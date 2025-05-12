import { Module } from "@nestjs/common";
import { ChatGateway } from "./chat.gateway";
import { RedisPubSubModule } from "../redis/redis.module";

@Module({
  imports: [RedisPubSubModule],
  providers: [ChatGateway]
})
export class ChatModule {}