export interface MessagePayload {
  event: "groupMessage" | "directMessage" | "ping" | "pong";
  message: string;
  senderId: string;
}

export interface GroupMessagePayload extends MessagePayload {
  groupId: string;
}
