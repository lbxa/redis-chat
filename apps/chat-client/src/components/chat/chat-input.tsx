import * as React from "react"
import { SendIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ChatInputProps extends React.HTMLAttributes<HTMLDivElement> {
  onSend: (message: string) => void
}

export function ChatInput({ onSend, className, ...props }: ChatInputProps) {
  const [input, setInput] = React.useState("")

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (input.trim()) {
      onSend(input)
      setInput("")
    }
  }

  return (
    <div className={cn("p-4", className)} {...props}>
      <form 
        onSubmit={handleSubmit} 
        className="flex w-full items-center gap-2"
      >
        <Input
          value={input}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={!input.trim()}
        >
          <SendIcon className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  )
} 