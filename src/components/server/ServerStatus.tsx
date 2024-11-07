import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Users, MessageSquare } from "lucide-react";
import type { ServerConfig } from "@/types";

interface ServerStatusProps {
  serverConfig: ServerConfig;
  clientCount: number;
  messageCount: number;
  onViewLogs: () => void;
}

export function ServerStatus({
  serverConfig,
  clientCount,
  messageCount,
  onViewLogs,
}: ServerStatusProps) {
  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Connected Clients</p>
                <p className="text-2xl font-bold">{clientCount}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <MessageSquare className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Total Messages</p>
                <p className="text-2xl font-bold">{messageCount}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <div className="w-4 h-4 rounded-full bg-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Server Status</p>
                <p className="text-sm font-medium text-muted-foreground">
                  {serverConfig.wsEnabled && `WS :${serverConfig.wsPort}`}
                  {serverConfig.wsEnabled && serverConfig.wssEnabled && ' | '}
                  {serverConfig.wssEnabled && `WSS :${serverConfig.wssPort}`}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Button
            variant="outline"
            className="w-full"
            onClick={onViewLogs}
          >
            <FileText className="w-4 h-4 mr-2" />
            View Logs
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}