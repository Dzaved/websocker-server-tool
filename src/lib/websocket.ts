import { toast } from "./toast";

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private url: string;
  private isSecure: boolean;

  constructor(url: string, isSecure: boolean = false) {
    this.url = url;
    this.isSecure = isSecure;
  }

  connect(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log(`Connected to ${this.url}`);
          this.reconnectAttempts = 0;
          toast({
            title: "Connected",
            description: `Successfully connected to ${this.url}`,
          });
          resolve(true);
        };

        this.ws.onerror = (error) => {
          console.error(`${this.isSecure ? 'WSS' : 'WS'} error:`, error);
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            setTimeout(() => this.reconnect(), this.reconnectDelay);
          } else {
            toast({
              title: "Connection Failed",
              description: `Failed to connect to ${this.url}. ${this.isSecure ? 'Make sure SSL certificates are properly configured.' : ''}`,
              variant: "destructive",
            });
            resolve(false);
          }
        };

        this.ws.onclose = () => {
          console.log(`Disconnected from ${this.url}`);
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            setTimeout(() => this.reconnect(), this.reconnectDelay);
          }
        };

      } catch (error) {
        console.error('Failed to connect:', error);
        toast({
          title: "Connection Failed",
          description: `Failed to connect to ${this.url}`,
          variant: "destructive",
        });
        resolve(false);
      }
    });
  }

  private reconnect() {
    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    this.connect();
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: string | object) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const data = typeof message === 'string' ? message : JSON.stringify(message);
      this.ws.send(data);
    }
  }

  onMessage(callback: (data: any) => void) {
    if (this.ws) {
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          callback(data);
        } catch (error) {
          console.error('Error parsing message:', error);
          callback(event.data);
        }
      };
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}