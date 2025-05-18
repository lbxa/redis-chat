import type { MessagePayload } from "chat-types";
import { $C } from "@/constants";
import { useEffect, useRef, useCallback, useState } from "react";

export function useChatSocket(onMessage: (message: MessagePayload) => void): {
  sendMessage: (data: string) => void; 
  joinGroup: (groupId: string) => void;
  sendGroupMessage: (groupId: string, message: string) => void;
  isConnected: boolean;
  clientId: string; 
} {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      console.debug("[WS ALREADY CONNECTING/CONNECTED]");
      return;
    }

    const ws = new WebSocket("ws://localhost:4000");
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setReconnectAttempts(0); // Reset attempts on successful connection
      console.debug("[WS OPEN]");
    };

    ws.onmessage = (event) => {
      console.debug("[WS MESSAGE]", event.data);
      try {
        const parsedData: MessagePayload = JSON.parse(event.data);

        switch (parsedData.event) {
          case 'groupMessage':
            onMessage({
              event: parsedData.event,
              senderId: parsedData.senderId,
              message: parsedData.message,
            });
            break;
            case 'directMessage':
            onMessage({
              event: parsedData.event,
              senderId: parsedData.senderId,
              message: parsedData.message,
            });
            break;
          default:
            console.log(`[WS EVENT] ${parsedData.event}`, parsedData);
            break;
        }
      } catch (error) {
        console.error("[WS PARSE ERROR]", error);
      }
    };

    ws.onclose = () => {
      console.log("[WS CLOSED]");
      wsRef.current = null;
      setIsConnected(false);

      if (reconnectAttempts < $C.MAX_RECONNECT_ATTEMPTS) {
        const delay = $C.BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts);
        console.log(`[WS RECONNECT] Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts + 1})`);
        setTimeout(() => {
          setReconnectAttempts(prev => prev + 1);
          connect();
        }, delay);
      } else {
        console.error("[WS RECONNECT] Max reconnection attempts reached.");
      }
    };

    ws.onerror = (error) => {
      console.error("[WS ERROR]", error);
      // onclose will be called subsequently, triggering reconnection logic
    };
  }, [reconnectAttempts, onMessage]);


  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        console.log("[WS CLEANUP]");
        const ws = wsRef.current;
        ws.onopen = null;
        ws.onmessage = null;
        ws.onclose = null;
        ws.close();
      }
    };
  }, [connect]); // onMessage dependency removed as it can cause re-connections if defined inline in parent

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
        data: {
          groupId
        }
      }));
    } else {
      console.warn("WebSocket is not connected");
    }
  }, []);

  const sendGroupMessage = useCallback((groupId: string, messageText: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        event: 'groupMessage',
        data: {
          groupId,
          message: messageText, // field name expected by server
          senderId: $C.CLIENT_ID
        }
      }));
    } else {
      console.warn("WebSocket is not connected");
    }
  }, []);

  return { sendMessage, joinGroup, sendGroupMessage, isConnected, clientId: $C.CLIENT_ID };
}
