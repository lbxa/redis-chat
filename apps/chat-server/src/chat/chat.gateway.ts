import { type OnModuleInit } from '@nestjs/common';
import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import type { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, WsResponse } from '@nestjs/websockets';
import { type Server, WebSocket } from 'ws';
import { RedisPubSubService } from '../redis/redis.service';
import type { GroupMessagePayload } from './chat.types';

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
    await this.pubSub.subscribeToGroup('*', (rawMessage, channel) => {
      const [, groupId] = channel.split(':');
      try {
        const messagePayload: { senderId: string; message: string } = JSON.parse(rawMessage);
        // Log the message. The "broadcast" part is now handled by individual client subscriptions.
        console.log(`[REDIS GLOBAL SUB] Message for group ${groupId} (channel: ${channel}): ${messagePayload.message} from ${messagePayload.senderId}`);

        // Forward to relevant clients, IF NEEDED (currently onJoinGroup handles specific subscriptions)
        // This global subscription might still be useful for other features or logging.
        // For now, we assume onJoinGroup handles sending to correct clients.
        // If general broadcast is needed, it would go here, sending messagePayload
      } catch (error) {
        console.error('[REDIS GLOBAL SUB] Error parsing message from Redis:', error, 'Raw message:', rawMessage);
      }
    });
  }

  afterInit(server: Server) {
    this.server = server;
    console.debug('[WS INITIALIZED]');
  }

  handleConnection(client: WebSocket) {
    console.debug('[WS CONNECTED]');
  }

  handleDisconnect(client: WebSocket) {
    console.debug('[WS DISCONNECTED]');
  }

  // Client requests to join a group
  @SubscribeMessage('joinGroup')
  async onJoinGroup(
    @MessageBody() { groupId }: { groupId: string },
    @ConnectedSocket() client: WebSocket,
  ) {
    console.log(`[JOIN] Client joining group ${groupId}`);
    // When a message is published to this group in Redis
    await this.pubSub.subscribeToGroup(groupId, (rawMessage) => {
      try {
        const messagePayload : { senderId: string, message: string } = JSON.parse(rawMessage);
        // Send the parsed message (which includes senderId) to the client
        client.send(JSON.stringify({ event: 'groupMessage', groupId, ...messagePayload }));
      } catch (error) {
        console.error(`[ERROR onJoinGroup sub] Failed to parse or send message for group ${groupId}:`, error);
        // Optionally send an error to the client
        client.send(JSON.stringify({ event: 'error', data: 'Error processing group message.'}));
      }
    });
    return { event: 'joinGroupAck', data: `Joined group ${groupId}` };
  }

  // Client sends a message to a group
  @SubscribeMessage('groupMessage')
  async onGroupMessage(
    @MessageBody() payload: GroupMessagePayload,
  ) {
    console.log('[DEBUG] Received groupMessage payload:', payload);

    if (!payload) {
      console.error('[ERROR] Message data is undefined or null');
      return { event: 'error', data: 'Invalid message format' };
    }

    const { groupId, message, senderId } = payload; // Destructure senderId

    if (!groupId) {
      console.error('[ERROR] groupId is missing in the message payload');
      return { event: 'error', data: 'groupId is required' };
    }

    if (!message) {
      console.error('[ERROR] message is missing in the message payload');
      return { event: 'error', data: 'message is required' };
    }

    if (!senderId) { // Add check for senderId
      console.error('[ERROR] senderId is missing in the message payload');
      return { event: 'error', data: 'senderId is required' };
    }

    console.log(`[MESSAGE] Publishing to group ${groupId}: "${message}" from sender ${senderId}`);
    // Publish an object containing both the message and senderId
    await this.pubSub.publishToGroup(groupId, JSON.stringify({ senderId, message }));
    return { event: 'groupMessageAck', data: `Message sent to ${groupId}` };
  }
}

