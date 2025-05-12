import { useEffect, useRef, useCallback } from "react";

export interface ChatMessage {
  event: string;
  groupId?: string;
  message?: string;
  data?: string;
}

export function useChatSocket(onMessage: (message: string) => void) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Only create a new WebSocket if one doesn't exist yet
    if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
      const ws = new WebSocket("ws://localhost:4000");
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[WS OPEN]");
      };

      ws.onmessage = (event) => {
        console.log("[WS MESSAGE]", event.data);
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'groupMessage' && data.message) {
            onMessage(data.message);
          } else {
            console.log(`[WS EVENT] ${data.event}`, data);
          }
        } catch (error) {
          // Handle plain text messages
          console.log("[WS PARSE ERROR]", error);
          onMessage(event.data);
        }
      };

      ws.onclose = () => {
        console.log("[WS CLOSED]");
        wsRef.current = null;
      };
    }

    return () => {
      // Only close if component is unmounting, not on every render
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        console.log("[WS CLEANUP]");
        const ws = wsRef.current;
        // Remove all listeners to prevent memory leaks
        ws.onopen = null;
        ws.onmessage = null;
        ws.onclose = null;
        ws.close();
      }
    };
  }, []); // Empty dependency array ensures this only runs once on mount

  const sendMessage = (data: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
    } else {
      console.warn("WebSocket is not connected");
    }
  };

  const joinGroup = useCallback((groupId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        event: 'joinGroup',
        groupId
      }));
    } else {
      console.warn("WebSocket is not connected");
    }
  }, []);

  const sendGroupMessage = useCallback((groupId: string, message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        event: 'groupMessage',
        data: {
          groupId,
          message
        }
      }));
    } else {
      console.warn("WebSocket is not connected");
    }
  }, []);

  return { sendMessage, joinGroup, sendGroupMessage };
}
