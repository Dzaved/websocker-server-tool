import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageSquare, FileText, Power, Settings, Wifi } from "lucide-react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { ChatPanel } from "./chat/ChatPanel";
import { LogPanel } from "./logs/LogPanel";
import { ServerStatus } from "./server/ServerStatus";
import { SettingsPanel } from "./settings/SettingsPanel";
import { toast } from "@/hooks/use-toast";
import type { ServerConfig } from "@/types";

export default function WebSocketServerCompleteInterface() {
  const { isConnected, connect, disconnect, clients, messages, logs } = useWebSocket();
  const [activeTab, setActiveTab] = useState("chat");
  const [serverConfig, setServerConfig] = useState<ServerConfig>({
    wsEnabled: true,
    wssEnabled: false,
    wsPort: 8080,
    wssPort: 8443,
    privateKey: null,
    certificate: null,
  });

  const handleConnect = async () => {
    if (!serverConfig.wsEnabled && !serverConfig.wssEnabled) {
      toast({
        title: "No Server Type Selected",
        description: "Please enable at least one server type (WS or WSS)",
        variant: "destructive",
      });
      return;
    }

    if (serverConfig.wssEnabled && (!serverConfig.privateKey || !serverConfig.certificate)) {
      toast({
        title: "Missing SSL Files",
        description: "Please upload both private key and certificate for secure connection",
        variant: "destructive",
      });
      return;
    }

    await connect(serverConfig);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'privateKey' | 'certificate') => {
    const file = event.target.files?.[0];
    if (file) {
      setServerConfig(prev => ({
        ...prev,
        [type]: file
      }));
      toast({
        title: "File Uploaded",
        description: `${type === 'privateKey' ? 'Private key' : 'Certificate'} has been uploaded successfully`,
      });
    }
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wifi className="w-6 h-6 text-primary animate-pulse" />
            <div>
              <CardTitle>WebSocket Server Control</CardTitle>
              <CardDescription>Configure and manage your WebSocket server</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="ws-enabled"
              checked={serverConfig.wsEnabled}
              onCheckedChange={(checked) => 
                setServerConfig(prev => ({ ...prev, wsEnabled: checked as boolean }))
              }
            />
            <Label htmlFor="ws-enabled">Enable WebSocket (WS)</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="wss-enabled"
              checked={serverConfig.wssEnabled}
              onCheckedChange={(checked) => 
                setServerConfig(prev => ({ ...prev, wssEnabled: checked as boolean }))
              }
            />
            <Label htmlFor="wss-enabled">Enable Secure WebSocket (WSS)</Label>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="wsPort">WS Port</Label>
              <Input
                id="wsPort"
                type="number"
                value={serverConfig.wsPort}
                onChange={(e) => 
                  setServerConfig(prev => ({ ...prev, wsPort: parseInt(e.target.value) }))
                }
                disabled={!serverConfig.wsEnabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wssPort">WSS Port</Label>
              <Input
                id="wssPort"
                type="number"
                value={serverConfig.wssPort}
                onChange={(e) => 
                  setServerConfig(prev => ({ ...prev, wssPort: parseInt(e.target.value) }))
                }
                disabled={!serverConfig.wssEnabled}
              />
            </div>
          </div>

          {serverConfig.wssEnabled && (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="privateKey">Private Key</Label>
                <Input
                  id="privateKey"
                  type="file"
                  accept=".pem"
                  onChange={(e) => handleFileUpload(e, "privateKey")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="certificate">Certificate</Label>
                <Input
                  id="certificate"
                  type="file"
                  accept=".pem"
                  onChange={(e) => handleFileUpload(e, "certificate")}
                />
              </div>
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleConnect}
            disabled={
              (!serverConfig.wsEnabled && !serverConfig.wssEnabled) ||
              (serverConfig.wssEnabled && (!serverConfig.privateKey || !serverConfig.certificate))
            }
          >
            <Power className="w-4 h-4 mr-2" />
            Connect Server
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Wifi className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>WebSocket Server Interface</CardTitle>
            <CardDescription>Manage and monitor your WebSocket server</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chat">
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="logs">
              <FileText className="w-4 h-4 mr-2" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            <ChatPanel />
          </TabsContent>

          <TabsContent value="logs">
            <LogPanel logs={logs} />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsPanel
              serverConfig={serverConfig}
              onServerConfigChange={setServerConfig}
              onDisconnect={disconnect}
            />
          </TabsContent>
        </Tabs>

        <ServerStatus
          serverConfig={serverConfig}
          clientCount={clients.length}
          messageCount={messages.length}
          onViewLogs={() => setActiveTab("logs")}
        />
      </CardContent>
    </Card>
  );
}