import { WebSocketGateway } from '@nestjs/websockets';
import type { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
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
    console.log('WebSocket Gateway initialized on port 4000');
  }

  handleConnection(client: WebSocket) {
    console.log('Client connected');
    
    // Setup event listeners directly on the WebSocket object
    client.on('message', (data: WebSocket.Data) => {
      console.log('Received message:', data.toString());
      // Echo the message back
      client.send(`Echo: ${data}`);
    });
    
    // Send a welcome message
    client.send('Welcome to the chat server!');
  }
  
  handleDisconnect(client: WebSocket) {
    console.log('Client disconnected');
  }
}