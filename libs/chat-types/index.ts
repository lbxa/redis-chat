export interface MessagePayload {
  event: "groupMessage" | "directMessage";
  message: string;
  senderId: string;
}

export interface GroupMessagePayload extends MessagePayload {
  groupId: string;
}
