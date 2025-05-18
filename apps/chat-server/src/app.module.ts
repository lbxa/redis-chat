import { Module } from "@nestjs/common";
import { ChatModule } from "./chat/chat.module";
import { SchemaService } from "./schema.service";
import { GraphQLController } from "./graphql.controller";

@Module({
  imports: [
    ChatModule
  ],
  controllers: [GraphQLController],
  providers: [SchemaService]
})
export class AppModule {}