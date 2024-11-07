import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join } from 'path';

const wsServer = new WebSocketServer({ port: 8080 });
let activeConnections = new Set<string>();

function logServerStatus() {
  const connections = Array.from(activeConnections);
  if (connections.length > 0) {
    console.log('Active connections:', connections.join(' and '));
    if (connections.includes('ws://localhost:8080') && connections.includes('wss://localhost:8443')) {
      console.log('Connected to ws://localhost:8080 and wss://localhost:8443');
    }
  }
}

wsServer.on('connection', (ws, req) => {
  const clientId = `client-${Math.random().toString(36).substr(2, 9)}`;
  const isSecure = req.headers['upgrade-insecure-requests'] === '1';
  const connectionUrl = isSecure ? 'wss://localhost:8443' : 'ws://localhost:8080';
  
  activeConnections.add(connectionUrl);
  logServerStatus();
  
  // Send client connected event to all clients
  const connectMessage = JSON.stringify({
    type: 'client_connected',
    client: {
      id: clientId,
      connectedAt: new Date().toISOString(),
      isSecure
    }
  });
  
  wsServer.clients.forEach(client => {
    client.send(connectMessage);
  });

  console.log(`New client connected: ${clientId} via ${connectionUrl}`);

  ws.on('message', (message) => {
    const messageStr = message.toString();
    let processedMessage;

    // Try parsing as JSON first
    try {
      const jsonData = JSON.parse(messageStr);
      processedMessage = {
        type: 'message',
        clientId,
        content: typeof jsonData === 'object' ? jsonData.content || jsonData : jsonData,
        timestamp: new Date().toISOString()
      };
    } catch (e) {
      // If not JSON, treat as plaintext
      processedMessage = {
        type: 'message',
        clientId,
        content: messageStr,
        timestamp: new Date().toISOString()
      };
    }

    console.log(`Received message from ${clientId}:`, processedMessage.content);

    // Broadcast to all clients including sender
    const broadcastMessage = JSON.stringify(processedMessage);
    wsServer.clients.forEach(client => {
      client.send(broadcastMessage);
    });
  });

  ws.on('close', () => {
    activeConnections.delete(connectionUrl);
    console.log(`Client ${clientId} disconnected from ${connectionUrl}`);
    logServerStatus();

    // Notify all clients about disconnection
    const disconnectMessage = JSON.stringify({
      type: 'client_disconnected',
      clientId
    });
    
    wsServer.clients.forEach(client => {
      if (client !== ws && client.readyState === ws.OPEN) {
        client.send(disconnectMessage);
      }
    });
  });
});

console.log('WebSocket server is running on port 8080');