import type { MessagePayload } from "chat-types";
import { $C } from "@/constants";
import { useEffect, useRef, useCallback, useState } from "react";

export function useChatSocket(onMessage: (message: MessagePayload) => void): {
  sendMessage: (data: string) => void; 
  joinGroup: (groupId: string) => void;
  sendGroupMessage: (groupId: string, message: string) => void;
  status: 'connecting' | 'connected' | 'disconnected';
  clientId: string; 
} {
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pongTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (pongTimeoutRef.current) {
      clearTimeout(pongTimeoutRef.current);
      pongTimeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      console.debug("[WS ALREADY CONNECTING/CONNECTED]");
      return;
    }

    const ws = new WebSocket("ws://localhost:4000");
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('connected');
      setReconnectAttempts(0);
      console.debug("[WS OPEN]");
      clearTimers(); // Clear any existing timers on new connection

      pingIntervalRef.current = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          if (pongTimeoutRef.current) {
            console.warn("[WS PING] Pong overdue. Forcing close.");
            wsRef.current.close();
            return;
          }

          try {
            wsRef.current.send(JSON.stringify({ event: 'ping', senderId: $C.CLIENT_ID, message: 'ping' }));
            console.debug("[WS PING SENT]");
          } catch (e) {
            console.error("[WS PING SEND ERROR]", e);
            wsRef.current.close();
            return;
          }

          pongTimeoutRef.current = setTimeout(() => {
            console.warn("[WS PONG TIMEOUT] No pong received. Closing connection.");
            if (wsRef.current) {
              wsRef.current.close();
            }
          }, $C.PONG_TIMEOUT_MS);
        } else {
          console.warn("[WS PING] Attempted to ping on non-open socket. Clearing interval.");
          clearTimers();
        }
      }, $C.PING_INTERVAL_MS);
    };

    ws.onmessage = (event) => {
      console.debug("[WS MESSAGE]", event.data);
      try {
        const parsedData = JSON.parse(event.data) as MessagePayload;

        switch (parsedData.event) {
          case 'pong':
            console.debug("[WS PONG RECEIVED]");
            if (pongTimeoutRef.current) {
              clearTimeout(pongTimeoutRef.current);
              pongTimeoutRef.current = null;
            }
            break;
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
      setStatus('disconnected');
      clearTimers();

      if (reconnectAttempts < $C.MAX_RECONNECT_ATTEMPTS) {
        const delay = $C.BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts);
        console.log(`[WS RECONNECT] Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts + 1})`);
        setStatus('connecting');
        setTimeout(() => {
          setReconnectAttempts(prev => prev + 1);
          connect();
        }, delay);
      } else {
        console.error("[WS RECONNECT] Max reconnection attempts reached.");
        setStatus('disconnected');
      }
    };

    ws.onerror = (error) => {
      console.error("[WS ERROR]", error);
    };
  }, [reconnectAttempts, onMessage, clearTimers]);


  useEffect(() => {
    connect();

    return () => {
      clearTimers(); // Ensure timers are cleared on component unmount
      if (wsRef.current) {
        console.log("[WS CLEANUP] Closing WebSocket and clearing timers.");
        const ws = wsRef.current;
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null; // Make sure onerror is also nulled
        ws.onclose = null; // Nullify onclose before manual close to prevent reconnect logic
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
        wsRef.current = null;
      }
    };
  }, [connect, clearTimers]); 

  const sendMessage = (message: string) => { // Modified to send object for consistency, though server might expect raw string for directMessage
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({
          event: 'directMessage',
          message,
          senderId: $C.CLIENT_ID
        }));
      } catch (e) {
        console.error("[WS SEND DIRECT MESSAGE ERROR]", e);
      }
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
          message: messageText,
          senderId: $C.CLIENT_ID
        }
      }));
    } else {
      console.warn("WebSocket is not connected");
    }
  }, []);

  return { sendMessage, joinGroup, sendGroupMessage, status, clientId: $C.CLIENT_ID };
}
