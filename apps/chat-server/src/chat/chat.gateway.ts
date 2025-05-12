import { Module, type OnModuleInit } from '@nestjs/common';
import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import type { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, WsResponse } from '@nestjs/websockets';
import { type Server, WebSocket } from 'ws';
import { RedisPubSubService } from '../redis/redis.service';

@WebSocketGateway(4000, {
  transports: ['websocket'],
  pingTimeout: 60000,
  pingInterval: 30000,
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  server!: Server;

  constructor(private readonly pubSub: RedisPubSubService) {}

  async onModuleInit() {
    // Log and broadcast incoming Redis messages to clients
    await this.pubSub.subscribeToGroup('*', (message, channel) => {
      const [, groupId] = channel.split(':');
      this.server.clients.forEach((client: WebSocket) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ event: 'groupMessage', groupId, message }));
        }
      });
    });
  }

  afterInit(server: Server) {
    this.server = server;
    console.log('[WS INITIALIZED]');
  }

  handleConnection(client: WebSocket) {
    console.log('[WS CONNECTED]');
    client.send('Welcome to the chat server!');
  }

  handleDisconnect(client: WebSocket) {
    console.log('[WS DISCONNECTED]');
  }

  // Client requests to join a group
  @SubscribeMessage('joinGroup')
  async onJoinGroup(
    @MessageBody() { groupId }: { groupId: string },
    @ConnectedSocket() client: WebSocket,
  ) {
    console.log(`[JOIN] Client joining group ${groupId}`);
    await this.pubSub.subscribeToGroup(groupId, (message) => {
      client.send(JSON.stringify({ event: 'groupMessage', groupId, message }));
    });
    return { event: 'joinGroupAck', data: `Joined group ${groupId}` };
  }

  // Client sends a message to a group
  @SubscribeMessage('groupMessage')
  async onGroupMessage(
    @MessageBody() payload: any,
  ) {
    console.log('[DEBUG] Received groupMessage payload:', payload);
    
    // Extract the data from the payload, which now includes a data property
    const data = payload?.data;
    
    // Check if data exists and has the required fields
    if (!data) {
      console.error('[ERROR] Message data is undefined or null');
      return { event: 'error', data: 'Invalid message format' };
    }

    const { groupId, message } = data;

    if (!groupId) {
      console.error('[ERROR] groupId is missing in the message payload');
      return { event: 'error', data: 'groupId is required' };
    }

    if (!message) {
      console.error('[ERROR] message is missing in the message payload');
      return { event: 'error', data: 'message is required' };
    }

    console.log(`[MESSAGE] Publishing to group ${groupId}: ${message}`);
    await this.pubSub.publishToGroup(groupId, message);
    return { event: 'groupMessageAck', data: `Message sent to ${groupId}` };
  }
}
