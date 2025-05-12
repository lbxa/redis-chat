import { Global, Module } from "@nestjs/common";
import Redis from "ioredis";
import { RedisPubSubService } from "./redis.service";

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_PUB',
      useFactory: () => new Redis({ host: 'localhost', port: 6379 }),
    },
    {
      provide: 'REDIS_SUB',
      useFactory: () => new Redis({ host: 'localhost', port: 6379 }),
    },
    RedisPubSubService,
  ],
  exports: [RedisPubSubService],
})
export class RedisPubSubModule {}