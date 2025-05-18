import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessage, type ChatMessageProps } from "./chat-message"
import { useEffect, useRef } from "react"

interface ChatListProps extends React.HTMLAttributes<HTMLDivElement> {
  messages: ChatMessageProps[]
}

export function ChatList({ messages, className, dir, ...props }: ChatListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  return (
    <ScrollArea className={cn("h-[calc(100vh-160px)]", className)} {...props}>
      <div ref={scrollAreaRef} className="flex flex-col gap-4 p-4" dir={dir}>
        {messages.map((message, index) => (
          <ChatMessage key={index} {...message} />
        ))}
      </div>
    </ScrollArea>
  )
} 