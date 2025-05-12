import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import type { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, WsResponse } from '@nestjs/websockets';
import type { Server, WebSocket } from 'ws';

@WebSocketGateway(4000, {
  transports: ['websocket'],
  pingTimeout: 60000,
  pingInterval: 30000,
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  server!: Server;
  
  afterInit(server: Server) {
    this.server = server;
    console.log('[INITIALIZED]');
  }

  handleConnection(client: WebSocket) {
    console.log('[CONNECTED]');
    
    // Setup event listeners directly on the WebSocket object
    client.on('message', (data: WebSocket.Data) => {
      console.log('[RECEIVED]:', data.toString());
      // Echo the message back
      client.send(`[ECHO]: ${data}`);
    });
    
    // Send a welcome message
    client.send('[WELCOME]');
  }
  
  handleDisconnect(client: WebSocket) {
    console.log('[DISCONNECTED]');
  }

  @SubscribeMessage('events')
  handleEvent(
    @MessageBody() data: any,
    @ConnectedSocket() client: WebSocket,
  ): WsResponse<string> {
    console.log('[EVENT RECEIVED]:', data, 'from client URL:', client.url); 
    return { event: 'events', data: '[EVENT_ACK_FROM_SERVER]' };
  }
}