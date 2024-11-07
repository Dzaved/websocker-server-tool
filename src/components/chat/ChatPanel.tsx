import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User } from "lucide-react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";

export function ChatPanel() {
  const { clients, messages, sendMessage } = useWebSocket();
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && activeClientId) {
      sendMessage(newMessage.trim(), activeClientId);
      setNewMessage("");
    }
  };

  const filteredMessages = messages.filter(
    (msg) => msg.clientId === activeClientId
  );

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMessage = (message: Message) => {
    const isIncoming = message.direction === "incoming";
    return (
      <div
        key={message.id}
        className={cn(
          "flex",
          isIncoming ? "justify-start" : "justify-end",
          "mb-4"
        )}
      >
        <div
          className={cn(
            "max-w-[80%] rounded-lg px-4 py-2",
            isIncoming
              ? "bg-secondary text-secondary-foreground"
              : "bg-primary text-primary-foreground",
          )}
        >
          <p className="text-sm">{message.content}</p>
          <p className="text-xs opacity-70 mt-1">
            {formatTimestamp(message.timestamp)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-3 gap-4 h-[600px]">
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Connected Clients ({clients.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {clients.map((client) => (
                <Button
                  key={client.id}
                  variant={activeClientId === client.id ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveClientId(client.id)}
                >
                  <User className="w-4 h-4 mr-2" />
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{client.id}</span>
                    <span className="text-xs text-muted-foreground">
                      {client.isSecure ? "WSS" : "WS"} • {client.ip}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>
            {activeClientId ? (
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Chat with {activeClientId}
              </div>
            ) : (
              "Select a client to start chatting"
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col h-[500px]">
          <ScrollArea className="flex-1 mb-4 p-4">
            <div className="space-y-4">
              {filteredMessages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          <div className="flex gap-2 pt-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder={
                activeClientId
                  ? "Type your message..."
                  : "Select a client to start chatting"
              }
              disabled={!activeClientId}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!activeClientId || !newMessage.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}