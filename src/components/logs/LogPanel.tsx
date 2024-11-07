import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, AlertCircle, Info, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Log } from "@/types";

interface LogPanelProps {
  logs: Log[];
}

export function LogPanel({ logs }: LogPanelProps) {
  const getLogIcon = (type: Log["type"]) => {
    switch (type) {
      case "message":
        return <MessageSquare className="w-4 h-4" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case "connection":
        return <Info className="w-4 h-4 text-primary" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Server Logs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className={cn(
                  "flex items-start gap-2 p-2 rounded-lg",
                  log.type === "error" && "bg-destructive/10",
                  log.type === "connection" && "bg-primary/10",
                  log.type === "message" && "bg-secondary"
                )}
              >
                <div className="mt-1">{getLogIcon(log.type)}</div>
                <div className="flex-1">
                  <p className="text-sm">{log.content}</p>
                  {log.clientId && (
                    <p className="text-xs text-muted-foreground">
                      Client: {log.clientId}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatTimestamp(log.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}