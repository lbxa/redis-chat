export interface MessagePayload {
  message: string;
  senderId: string;
}

export interface GroupMessagePayload extends MessagePayload {
  groupId: string;
}
