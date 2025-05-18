import { type OnModuleInit } from '@nestjs/common';
import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WsException } from '@nestjs/websockets';
import type { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, WsResponse } from '@nestjs/websockets';
import { type Server, WebSocket } from 'ws';
import { RedisPubSubService } from '../redis/redis.service';
import type { GroupMessagePayload } from './chat.types';
import type { MessagePayload } from 'chat-types';

@WebSocketGateway(4000, {
  transports: ['websocket'],
  pingTimeout: 60000,
  pingInterval: 30000,
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  server!: Server;

  constructor(private readonly pubSub: RedisPubSubService) {}

  async onModuleInit() {
    await this.pubSub.subscribeToGroup('*', (rawMessage, channel) => {
      const [, groupId] = channel.split(':');
      try {
        const messagePayload: { senderId: string; message: string } = JSON.parse(rawMessage);
        console.log(`[REDIS GLOBAL SUB] Message for group ${groupId} (channel: ${channel}): ${messagePayload.message} from ${messagePayload.senderId}`);
      } catch (error) {
        throw new WsException(`[REDIS GLOBAL SUB] Error parsing message from Redis: ${error} Raw message: ${rawMessage}`);
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

  @SubscribeMessage('joinGroup')
  async onJoinGroup(
    @MessageBody() { groupId }: { groupId: string },
    @ConnectedSocket() client: WebSocket,
  ): Promise<WsResponse<string>> {
    console.log(`[JOIN] Client joining group ${groupId}`);
    // When a message is published to this group in Redis
    await this.pubSub.subscribeToGroup(groupId, (rawMessage) => {
      try {
        const messagePayload : { senderId: string, message: string } = JSON.parse(rawMessage);
        client.send(JSON.stringify({ event: 'groupMessage', groupId, ...messagePayload }));
      } catch (error) {
        throw new WsException(`[ERROR onJoinGroup sub] Failed to parse or send message for group ${groupId}: ${error}`);
      }
    });
    return { event: 'joinGroupAck', data: `Joined group ${groupId}` };
  }

  @SubscribeMessage('groupMessage')
  async onGroupMessage(
    @MessageBody() payload: GroupMessagePayload,
  ): Promise<WsResponse<string>> {
    console.log('[DEBUG] Received groupMessage payload:', payload);

    if (!payload) {
      throw new WsException('Invalid message format');
    }

    const { groupId, message, senderId } = payload;

    console.log(`[MESSAGE] Publishing to group ${groupId}: "${message}" from sender ${senderId}`);
    await this.pubSub.publishToGroup(groupId, JSON.stringify({ senderId, message }));
    return { event: 'groupMessageAck', data: `Message sent to ${groupId}` };
  }
  
  @SubscribeMessage('ping')
  async onPing(
    @MessageBody() payload: MessagePayload,
  ): Promise<WsResponse<string>> {
    console.log('[DEBUG] Received ping payload:', payload);
    return { event: 'pong', data: 'Pong received' };
  }
}

