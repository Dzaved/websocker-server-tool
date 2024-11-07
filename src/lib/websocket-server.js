import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

export class WebSocketServerManager {
  constructor() {
    this.wsServer = null;
    this.wssServer = null;
    this.clients = new Map();
    this.messageHandlers = new Set();
    this.connectionHandlers = new Set();
  }

  start(wsPort, wssPort, sslOptions = null) {
    if (wsPort) {
      this.wsServer = new WebSocketServer({ port: wsPort });
      this.setupServerHandlers(this.wsServer, false);
      console.log(`WebSocket server is running on port ${wsPort}`);
    }

    if (wssPort && sslOptions) {
      this.wssServer = new WebSocketServer({ 
        port: wssPort,
        ...sslOptions
      });
      this.setupServerHandlers(this.wssServer, true);
      console.log(`Secure WebSocket server is running on port ${wssPort}`);
    }
  }

  setupServerHandlers(server, isSecure) {
    server.on('connection', (ws, req) => {
      const clientId = uuidv4();
      const clientInfo = {
        id: clientId,
        ws,
        isSecure,
        ip: req.socket.remoteAddress,
        connectedAt: new Date().toISOString()
      };

      this.clients.set(clientId, clientInfo);
      
      // Notify connection handlers
      this.connectionHandlers.forEach(handler => {
        handler({
          type: 'client_connected',
          client: {
            id: clientId,
            ip: clientInfo.ip,
            connectedAt: clientInfo.connectedAt,
            isSecure
          }
        });
      });

      ws.on('message', (message) => {
        let parsedMessage;
        try {
          // Try parsing as JSON first
          parsedMessage = JSON.parse(message);
        } catch {
          // If parsing fails, treat as plain text
          parsedMessage = {
            type: 'message',
            content: message.toString(),
            clientId
          };
        }

        // Notify message handlers
        this.messageHandlers.forEach(handler => handler(parsedMessage));
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        this.connectionHandlers.forEach(handler => {
          handler({
            type: 'client_disconnected',
            clientId
          });
        });
      });

      ws.on('error', (error) => {
        console.error(`Client ${clientId} error:`, error);
      });
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

  broadcast(message, isSecure = null) {
    this.clients.forEach((client) => {
      if (isSecure === null || client.isSecure === isSecure) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  sendTo(clientId, message) {
    const client = this.clients.get(clientId);
    if (client) {
      client.ws.send(JSON.stringify(message));
    }
  }

  onMessage(handler) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onConnection(handler) {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  getConnectedClients() {
    return Array.from(this.clients.values()).map(({ id, ip, connectedAt, isSecure }) => ({
      id,
      ip,
      connectedAt,
      isSecure
    }));
  }
}