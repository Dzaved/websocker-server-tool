import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Power, Settings } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { ServerConfig } from "@/types";

interface SettingsPanelProps {
  serverConfig: ServerConfig;
  onServerConfigChange: (config: ServerConfig) => void;
  onDisconnect: () => void;
}

export function SettingsPanel({
  serverConfig,
  onServerConfigChange,
  onDisconnect,
}: SettingsPanelProps) {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'privateKey' | 'certificate') => {
    const file = event.target.files?.[0];
    if (file) {
      onServerConfigChange({
        ...serverConfig,
        [type]: file
      });
      toast({
        title: "File Uploaded",
        description: `${type === 'privateKey' ? 'Private key' : 'Certificate'} has been uploaded successfully`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Server Configuration</CardTitle>
          <CardDescription>Manage your WebSocket server settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="settings-ws-enabled"
              checked={serverConfig.wsEnabled}
              onCheckedChange={(checked) =>
                onServerConfigChange({ ...serverConfig, wsEnabled: checked as boolean })
              }
            />
            <Label htmlFor="settings-ws-enabled">Enable WebSocket (WS)</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="settings-wss-enabled"
              checked={serverConfig.wssEnabled}
              onCheckedChange={(checked) =>
                onServerConfigChange({ ...serverConfig, wssEnabled: checked as boolean })
              }
            />
            <Label htmlFor="settings-wss-enabled">Enable Secure WebSocket (WSS)</Label>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="settings-wsPort">WS Port</Label>
              <Input
                id="settings-wsPort"
                type="number"
                value={serverConfig.wsPort}
                onChange={(e) =>
                  onServerConfigChange({
                    ...serverConfig,
                    wsPort: parseInt(e.target.value)
                  })
                }
                disabled={!serverConfig.wsEnabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-wssPort">WSS Port</Label>
              <Input
                id="settings-wssPort"
                type="number"
                value={serverConfig.wssPort}
                onChange={(e) =>
                  onServerConfigChange({
                    ...serverConfig,
                    wssPort: parseInt(e.target.value)
                  })
                }
                disabled={!serverConfig.wssEnabled}
              />
            </div>
          </div>

          {serverConfig.wssEnabled && (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="settings-privateKey">Private Key</Label>
                <Input
                  id="settings-privateKey"
                  type="file"
                  accept=".pem"
                  onChange={(e) => handleFileUpload(e, "privateKey")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-certificate">Certificate</Label>
                <Input
                  id="settings-certificate"
                  type="file"
                  accept=".pem"
                  onChange={(e) => handleFileUpload(e, "certificate")}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Server Control</CardTitle>
          <CardDescription>Manage server connection</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={onDisconnect} className="w-full">
            <Power className="w-4 h-4 mr-2" />
            Disconnect Server
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}