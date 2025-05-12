import * as React from "react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChatList } from "./chat-list"
import { ChatInput } from "./chat-input"
import type { ChatMessageProps } from "./chat-message"

interface ChatProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
}

export function Chat({ title = "Chat", className, ...props }: ChatProps) {
  const [messages, setMessages] = React.useState<ChatMessageProps[]>([
    {
      message: "Hi there! How can I help you today?",
      sender: "system",
      timestamp: new Date().toLocaleTimeString(),
    },
  ])

  const handleSend = (message: string) => {
    // Add user message
    const userMessage: ChatMessageProps = {
      message,
      sender: "user",
      timestamp: new Date().toLocaleTimeString(),
    }
    setMessages((prev) => [...prev, userMessage])

    // Simulate response after a short delay
    setTimeout(() => {
      const systemMessage: ChatMessageProps = {
        message: "Thanks for your message! This is a demo response.",
        sender: "system",
        timestamp: new Date().toLocaleTimeString(),
      }
      setMessages((prev) => [...prev, systemMessage])
    }, 1000)
  }

  return (
    <Card className={cn("h-[calc(100vh-32px)] flex flex-col", className)} {...props}>
      <CardHeader className="px-4">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col">
        <ChatList messages={messages} className="flex-1" />
        <ChatInput onSend={handleSend} className="border-t" />
      </CardContent>
    </Card>
  )
} 