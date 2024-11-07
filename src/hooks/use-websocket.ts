import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/hooks/use-toast';

interface WebSocketHookOptions {
  url: string;
  onMessage?: (data: any) => void;
  onLog?: (type: string, content: string) => void;
}

export function useWebSocket({ url, onMessage, onLog }: WebSocketHookOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    try {
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        const isSecure = url.startsWith('wss://');
        const connectionMsg = `Connected to ${url} ${isSecure ? '(Secure Connection)' : ''}`;
        onLog?.('connection', connectionMsg);
        
        toast({
          title: isSecure ? "Secure Connection Established" : "Connected",
          description: connectionMsg,
        });
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch (error) {
          console.error('Failed to parse message:', error);
          onLog?.('error', 'Failed to parse incoming message');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        onLog?.('error', `WebSocket error: ${error}`);
        toast({
          title: "Connection Error",
          description: "Failed to establish WebSocket connection",
          variant: "destructive",
        });
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        onLog?.('connection', 'WebSocket connection closed');
        toast({
          title: "Disconnected",
          description: "WebSocket connection closed",
        });
      };
    } catch (error) {
      console.error('Failed to connect:', error);
      onLog?.('error', `Connection failed: ${error}`);
      toast({
        title: "Connection Failed",
        description: "Failed to establish WebSocket connection",
        variant: "destructive",
      });
    }
  }, [url, onMessage, onLog]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    connect,
    disconnect,
    send,
  };
}