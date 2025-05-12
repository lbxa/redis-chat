import { Injectable, type OnModuleInit, Inject } from "@nestjs/common";
import { Redis as RedisClient } from 'ioredis';


@Injectable()
export class RedisPubSubService implements OnModuleInit {
  constructor(
    @Inject('REDIS_PUB') private readonly publisher: RedisClient,
    @Inject('REDIS_SUB') private readonly subscriber: RedisClient,
  ) {}

  async onModuleInit() {
    // Log any message for debugging
    this.subscriber.on('message', (channel, message) => {
      console.log(`Received message on ${channel}:`, message);
    });
  }

  // Publish a message to a group channel
  async publishToGroup(groupId: string, message: string) {
    const channel = `group:${groupId}`;
    await this.publisher.publish(channel, message);
  }

  // Subscribe to a group channel and invoke callback on new messages
  async subscribeToGroup(
    groupId: string,
    callback: (message: string, channel: string) => void,
  ) {
    const channel = `group:${groupId}`;
    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', (chan, message) => {
      if (chan === channel) callback(message, chan);
    });
  }
}