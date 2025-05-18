import {
  index,
  pgEnum,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const withUuidPk = {
  id: uuid().primaryKey().defaultRandom(),
};

const withModificationDates = {
  createdAt: timestamp({
    mode: "date",
    withTimezone: true,
    precision: 6,
  })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp({
    mode: "date",
    withTimezone: true,
    precision: 6,
  }).$onUpdate(() => new Date()),
};

export const UserSchema = pgSchema("user");

export const UsersTable = UserSchema.table(
  "users",
  {
    ...withUuidPk,
    firstName: text().notNull(),
    lastName: text().notNull(),
    email: varchar({ length: 255 }).notNull(),
    handle: varchar({ length: 255 }).unique(),
    bio: varchar({ length: 160 }),
    password: varchar({ length: 255 }).notNull(),
    refreshToken: varchar({ length: 1000 }),
    ...withModificationDates,
  },
  (table) => [
    uniqueIndex("email_unique_index").on(sql`lower(${table.email})`),
    index("search_index").using(
      "gin",
      sql`(
        setweight(to_tsvector('english', ${table.handle}), 'A') ||
        setweight(to_tsvector('english', ${table.email}), 'B') ||
        setweight(to_tsvector('english', ${table.firstName}), 'C') ||
        setweight(to_tsvector('english', ${table.lastName}), 'D')
      )`
    ),
  ]
);

export const ChatSchema = pgSchema("chat");

export const ChatType = ChatSchema.enum("chat_type", ["DM", "GROUP"]);

export const ChatsTable = ChatSchema.table(
  "chats",
  {
    ...withUuidPk,
    type: ChatType().notNull(),
    name: varchar({ length: 100 }),
    lastMessageAt: timestamp({
      mode: "date",
      withTimezone: true,
      precision: 6,
    })
      .notNull()
      .defaultNow(),
    ...withModificationDates,
  },
  (table) => [index().on(table.createdAt), index().on(table.name)]
);

export const ChatMembersTable = ChatSchema.table(
  "members",
  {
    ...withUuidPk,
    chatId: uuid()
      .notNull()
      .references(() => ChatsTable.id, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    ...withModificationDates,
  },
  (table) => [index().on(table.userId), index().on(table.chatId)]
);

export const ChatMessagesTable = ChatSchema.table(
  "messages",
  {
    ...withUuidPk,
    chatId: uuid()
      .notNull()
      .references(() => ChatsTable.id, { onDelete: "cascade" }),
    senderId: uuid()
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    content: text().notNull(),
    deliveredAt: timestamp({
      // TODO add delivered receipts column (for now keep simple)
      mode: "date",
      withTimezone: true,
      precision: 6,
    }),
    ...withModificationDates,
  },
  (table) => [
    index().on(table.chatId, table.createdAt),
    index().on(table.senderId),
    index().on(table.createdAt),
  ]
);

export const ChatReadReceiptsTable = ChatSchema.table(
  "read_receipts",
  {
    ...withUuidPk,
    messageId: uuid()
      .notNull()
      .references(() => ChatMessagesTable.id, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    ...withModificationDates,
  },
  (table) => [
    index().on(table.messageId, table.userId),
    index().on(table.userId, table.createdAt),
  ]
);

export type User = typeof UsersTable.$inferSelect;
export type NewUser = typeof UsersTable.$inferInsert;

export type Chat = typeof ChatsTable.$inferSelect;
export type NewChat = typeof ChatsTable.$inferInsert;

export type ChatMember = typeof ChatMembersTable.$inferSelect;
export type NewChatMember = typeof ChatMembersTable.$inferInsert;

export type ChatMessage = typeof ChatMessagesTable.$inferSelect;
export type NewChatMessage = typeof ChatMessagesTable.$inferInsert;

export type ChatReadReceipt = typeof ChatReadReceiptsTable.$inferSelect;
export type NewChatReadReceipt = typeof ChatReadReceiptsTable.$inferInsert;
