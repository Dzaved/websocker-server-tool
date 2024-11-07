import React, { createContext, useContext, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/hooks/use-toast';
import { Client, Message, Log, ServerConfig } from '@/types';

interface WebSocketContextType {
  isConnected: boolean;
  connect: (config: ServerConfig) => void;
  disconnect: () => void;
  sendMessage: (content: string, clientId: string) => void;
  clients: Client[];
  messages: Message[];
  logs: Log[];
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);

  const addLog = useCallback((type: Log["type"], content: string, clientId?: string) => {
    const newLog: Log = {
      id: uuidv4(),
      type,
      content,
      timestamp: new Date().toISOString(),
      clientId,
    };
    setLogs(prev => [...prev, newLog]);
  }, []);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, {
      ...message,
      id: message.id || uuidv4(),
      timestamp: message.timestamp || new Date().toISOString()
    }]);
  }, []);

  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'client_connected':
          const newClient: Client = {
            id: data.client.id,
            ip: data.client.ip || 'unknown',
            connectedAt: data.client.connectedAt,
            isSecure: data.client.isSecure
          };
          setClients(prev => [...prev, newClient]);
          addLog("connection", `Client connected: ${data.client.id}`, data.client.id);
          break;

        case 'client_disconnected':
          setClients(prev => prev.filter(client => client.id !== data.clientId));
          addLog("connection", `Client disconnected: ${data.clientId}`, data.clientId);
          break;

        case 'message':
          const newMessage: Message = {
            id: uuidv4(),
            clientId: data.clientId,
            content: data.content,
            timestamp: data.timestamp || new Date().toISOString(),
            direction: "incoming"
          };
          addMessage(newMessage);
          addLog("message", `Received: ${data.content}`, data.clientId);
          break;

        default:
          console.warn('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
      addLog("error", `Failed to parse message: ${error}`);
    }
  }, [addLog, addMessage]);

  const connect = useCallback(async (config: ServerConfig) => {
    try {
      const protocol = config.wsEnabled ? 'ws' : 'wss';
      const port = config.wsEnabled ? config.wsPort : config.wssPort;
      const url = `${protocol}://localhost:${port}`;

      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        setIsConnected(true);
        setWsConnection(ws);
        addLog("connection", "Connected to WebSocket server");
        toast({
          title: "Connected",
          description: "WebSocket server connection established"
        });
      };

      ws.onmessage = handleWebSocketMessage;

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        addLog("error", `WebSocket error: ${error}`);
        toast({
          title: "Connection Error",
          description: "Failed to establish WebSocket connection",
          variant: "destructive"
        });
      };

      ws.onclose = () => {
        setIsConnected(false);
        setWsConnection(null);
        setClients([]);
        addLog("connection", "Disconnected from server");
        toast({
          title: "Disconnected",
          description: "WebSocket connection closed"
        });
      };

    } catch (error) {
      console.error('Failed to connect:', error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to establish connection",
        variant: "destructive"
      });
    }
  }, [addLog, handleWebSocketMessage]);

  const disconnect = useCallback(() => {
    if (wsConnection) {
      wsConnection.close();
      setWsConnection(null);
      setIsConnected(false);
      setClients([]);
      setMessages([]);
    }
  }, [wsConnection]);

  const sendMessage = useCallback((content: string, clientId: string) => {
    if (!wsConnection || wsConnection.readyState !== WebSocket.OPEN) {
      toast({
        title: "Error",
        description: "No active connection",
        variant: "destructive"
      });
      return;
    }

    const messageData = {
      type: 'message',
      clientId,
      content,
      timestamp: new Date().toISOString()
    };

    wsConnection.send(JSON.stringify(messageData));
    
    const newMessage: Message = {
      id: uuidv4(),
      clientId,
      content,
      timestamp: new Date().toISOString(),
      direction: "outgoing"
    };
    
    addMessage(newMessage);
    addLog("message", `Sent: ${content}`, clientId);
  }, [wsConnection, addMessage, addLog]);

  const value = {
    isConnected,
    connect,
    disconnect,
    sendMessage,
    clients,
    messages,
    logs
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}