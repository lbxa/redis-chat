import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChatList } from "./chat-list"
import { ChatInput } from "./chat-input"
import type { ChatMessageProps } from "./chat-message"
import { useChatSocket } from "@/hooks"
import { HTMLAttributes, useState, useEffect, useCallback } from "react"
import { $C } from "@/constants"
import { MessagePayload } from "chat-types"
import { Loader2 } from "lucide-react"

interface ChatProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  groupId?: string;
}

export function Chat({ title = "Chat", groupId, className, ...props }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessageProps[]>([])
  const [hasBeenConnected, setHasBeenConnected] = useState(false);

  const onMessage = useCallback(({ senderId, message }: MessagePayload) => {
    const who = senderId === $C.CLIENT_ID ? "user" : "server"
    setMessages((prev) => [...prev, { message, sender: who, timestamp: new Date().toLocaleTimeString() }])
  }, []);

  const { sendMessage, joinGroup, sendGroupMessage, isConnected } = useChatSocket(onMessage);

  useEffect(() => {
    if (isConnected) {
      setHasBeenConnected(true);
    }
  }, [isConnected]);

  useEffect(() => {
    if (groupId && isConnected) {
      joinGroup(groupId);
    }
  }, [groupId, joinGroup, isConnected]);

  const handleSend = (message: string) => {
    if (groupId) {
      sendGroupMessage(groupId, message);
    } else {
      sendMessage(message);
    }
  }

  const getConnectionStatusIndicator = () => {
    if (isConnected) {
      return <div className="w-3 h-3 bg-green-500 rounded-full" aria-label="Connected"></div>;
    }
    if (hasBeenConnected) {
      // Was connected, but now isn't
      return <div className="w-3 h-3 bg-red-500 rounded-full" aria-label="Disconnected"></div>;
    }
    // Initial connection attempt
    return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" aria-label="Connecting..." />;
  };

  return (
    <Card className={cn("h-[calc(100vh-32px)] flex flex-col", className)} {...props}>
      <CardHeader className="px-4">
        <div className="flex items-center space-x-2">
          <CardTitle>{groupId ? `${title} - ${groupId}` : title}</CardTitle>
          {getConnectionStatusIndicator()}
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col">
        <ChatList messages={messages} className="flex-1" />
        <ChatInput onSend={handleSend} className="border-t" />
      </CardContent>
    </Card>
  )
} 