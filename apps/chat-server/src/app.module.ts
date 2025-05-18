import { Module } from "@nestjs/common";
import { ChatModule } from "./chat/chat.module";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "@apollo/server-plugin-landing-page-graphql-playground";
import { ApolloDriver } from "@nestjs/apollo";
import { GraphQLModule } from "@nestjs/graphql";
import type { ApolloDriverConfig } from "@nestjs/apollo";

@Module({
  imports: [GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      typePaths: [`${process.cwd()}/schema.graphql`],
      playground: false,
      introspection: process.env.NODE_ENV !== "production",
      plugins: [
        process.env.NODE_ENV === "production"
          ? ApolloServerPluginLandingPageLocalDefault()
          : ApolloServerPluginLandingPageGraphQLPlayground(),
      ],
      subscriptions: {
        "graphql-ws": true,
      },
      autoTransformHttpErrors: true,
      formatError: (error) => {
        const graphQLFormattedError = {
          code: error.extensions?.code || "INTERNAL_SERVER_ERROR",
          message: error.message,
          locations: error.locations,
          path: error.path,
        };
        return graphQLFormattedError;
      },
    }), 
    ChatModule
  ],
  providers: []
})
export class AppModule {}