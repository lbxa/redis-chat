import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChatList } from "./chat-list"
import { ChatInput } from "./chat-input"
import type { ChatMessageProps } from "./chat-message"
import { useChatSocket } from "@/hooks"
import { HTMLAttributes, useState, useEffect, useCallback } from "react"

interface ChatProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  groupId?: string;
}

export function Chat({ title = "Chat", groupId, className, ...props }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessageProps[]>([
    {
      message: "Hi there! How can I help you today?",
      sender: "system",
      timestamp: new Date().toLocaleTimeString(),
    },
  ])

  // Use useCallback to prevent this function from being recreated on every render
  const onMessage = useCallback((message: string) => {
    console.log("[ON MESSAGE]", message)
    setMessages((prev) => [...prev, { message, sender: "system", timestamp: new Date().toLocaleTimeString() }])
  }, []);

  const { sendMessage, joinGroup, sendGroupMessage } = useChatSocket(onMessage);

  // Join the group when the component mounts
  useEffect(() => {
    if (groupId) {
      joinGroup(groupId);
      console.log(`Joined group: ${groupId}`);
    }
  }, [groupId, joinGroup]);

  const handleSend = (message: string) => {
    // Add user message
    const userMessage: ChatMessageProps = {
      message,
      sender: "user",
      timestamp: new Date().toLocaleTimeString(),
    }
    setMessages((prev) => [...prev, userMessage])

    // Send the message to the server
    if (groupId) {
      sendGroupMessage(groupId, message);
    } else {
      sendMessage(message);
    }
  }

  return (
    <Card className={cn("h-[calc(100vh-32px)] flex flex-col", className)} {...props}>
      <CardHeader className="px-4">
        <CardTitle>{groupId ? `${title} - ${groupId}` : title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col">
        <ChatList messages={messages} className="flex-1" />
        <ChatInput onSend={handleSend} className="border-t" />
      </CardContent>
    </Card>
  )
} 