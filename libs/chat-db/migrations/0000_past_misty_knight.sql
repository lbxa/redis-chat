CREATE SCHEMA "chat";
--> statement-breakpoint
CREATE SCHEMA "user";
--> statement-breakpoint
CREATE TYPE "chat"."chat_type" AS ENUM('DM', 'GROUP');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('PENDING', 'ACCEPTED', 'DECLINED');--> statement-breakpoint
CREATE TABLE "chat"."members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone
);
--> statement-breakpoint
CREATE TABLE "chat"."messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"content" text NOT NULL,
	"delivered_at" timestamp (6) with time zone,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone
);
--> statement-breakpoint
CREATE TABLE "chat"."read_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone
);
--> statement-breakpoint
CREATE TABLE "chat"."chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "chat"."chat_type" NOT NULL,
	"name" varchar(100),
	"last_message_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone
);
--> statement-breakpoint
CREATE TABLE "user"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" varchar(255) NOT NULL,
	"handle" varchar(255),
	"bio" varchar(160),
	"password" varchar(255) NOT NULL,
	"refresh_token" varchar(1000),
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone,
	CONSTRAINT "users_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
ALTER TABLE "chat"."members" ADD CONSTRAINT "members_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "chat"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat"."members" ADD CONSTRAINT "members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat"."messages" ADD CONSTRAINT "messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "chat"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat"."messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "user"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat"."read_receipts" ADD CONSTRAINT "read_receipts_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "chat"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat"."read_receipts" ADD CONSTRAINT "read_receipts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "members_user_id_index" ON "chat"."members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "members_chat_id_index" ON "chat"."members" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "messages_chat_id_created_at_index" ON "chat"."messages" USING btree ("chat_id","created_at");--> statement-breakpoint
CREATE INDEX "messages_sender_id_index" ON "chat"."messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "messages_created_at_index" ON "chat"."messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "read_receipts_message_id_user_id_index" ON "chat"."read_receipts" USING btree ("message_id","user_id");--> statement-breakpoint
CREATE INDEX "read_receipts_user_id_created_at_index" ON "chat"."read_receipts" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "chats_created_at_index" ON "chat"."chats" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "chats_name_index" ON "chat"."chats" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "email_unique_index" ON "user"."users" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "search_index" ON "user"."users" USING gin ((
        setweight(to_tsvector('english', "handle"), 'A') ||
        setweight(to_tsvector('english', "email"), 'B') ||
        setweight(to_tsvector('english', "first_name"), 'C') ||
        setweight(to_tsvector('english', "last_name"), 'D')
      ));