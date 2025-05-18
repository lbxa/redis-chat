import { cn } from "@/lib/utils"

export interface ChatMessageProps {
  message: string
  sender: "user" | "server"
  timestamp: string
}

export function ChatMessage({ message, sender, timestamp }: ChatMessageProps) {
  return (
    <div
      className={cn(
        "flex w-max max-w-[80%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
        sender === "user"
          ? "ml-auto bg-primary text-primary-foreground"
          : "bg-muted"
      )}
    >
      <div className="break-words">{message}</div>
      <div
        className={cn(
          "ml-auto text-xs",
          sender === "user" ? "text-primary-foreground/80" : "text-muted-foreground"
        )}
      >
        {timestamp}
      </div>
    </div>
  )
} 