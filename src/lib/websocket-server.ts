import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import { readFileSync } from 'fs';

export class WebSocketServerManager {
  private wsServer: WebSocketServer | null = null;
  private wssServer: WebSocketServer | null = null;
  private clients = new Map();

  startWSServer(port: number) {
    if (this.wsServer) {
      this.wsServer.close();
    }

    const httpServer = createServer();
    this.wsServer = new WebSocketServer({ server: httpServer });
    
    this.wsServer.on('connection', (ws) => {
      this.handleConnection(ws, false);
    });

    httpServer.listen(port, () => {
      console.log(`WebSocket server running on ws://localhost:${port}`);
    });
  }

  startWSSServer(port: number, certPath: string, keyPath: string) {
    if (this.wssServer) {
      this.wssServer.close();
    }

    try {
      const httpsServer = createHttpsServer({
        cert: readFileSync(certPath),
        key: readFileSync(keyPath),
        rejectUnauthorized: false
      });

      this.wssServer = new WebSocketServer({ server: httpsServer });
      
      this.wssServer.on('connection', (ws) => {
        this.handleConnection(ws, true);
      });

      httpsServer.listen(port, () => {
        console.log(`Secure WebSocket server running on wss://localhost:${port}`);
      });

      return true;
    } catch (error) {
      console.error('Failed to start WSS server:', error);
      return false;
    }
  }

  private handleConnection(ws: WebSocket, isSecure: boolean) {
    const clientId = Math.random().toString(36).substr(2, 9);
    
    this.clients.set(clientId, { ws, isSecure });
    
    ws.addEventListener('message', (event) => {
      this.handleMessage(clientId, event.data);
    });

    ws.addEventListener('close', () => {
      this.clients.delete(clientId);
      this.broadcastMessage({
        type: 'client_disconnected',
        clientId
      });
    });
  }

  private handleMessage(clientId: string, data: any) {
    try {
      const message = typeof data === 'string' ? data : JSON.parse(data);
      this.broadcastMessage({
        type: 'message',
        clientId,
        content: message
      });
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  private broadcastMessage(message: any) {
    const data = JSON.stringify(message);
    this.clients.forEach(({ ws }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  }

  stop() {
    if (this.wsServer) {
      this.wsServer.close();
      this.wsServer = null;
    }
    if (this.wssServer) {
      this.wssServer.close();
      this.wssServer = null;
    }
    this.clients.clear();
  }
}