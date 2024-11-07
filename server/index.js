import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

const wss = new WebSocketServer({ port: 8080 });
const clients = new Map();

wss.on('connection', (ws) => {
  const clientId = uuidv4();
  const clientInfo = {
    id: clientId,
    ip: ws._socket.remoteAddress,
    connectedAt: new Date().toISOString(),
    isSecure: false
  };
  
  clients.set(clientId, { ws, info: clientInfo });

  // Send connection confirmation to the new client
  ws.send(JSON.stringify({
    type: 'client_connected',
    client: clientInfo
  }));

  // Broadcast new client connection to all other clients
  broadcast({
    type: 'client_connected',
    client: clientInfo
  }, clientId);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      const enhancedMessage = {
        ...message,
        timestamp: new Date().toISOString(),
        clientId
      };

      // Broadcast the message to all clients
      broadcast(enhancedMessage);
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    clients.delete(clientId);
    broadcast({
      type: 'client_disconnected',
      clientId
    });
  });

  ws.on('error', (error) => {
    console.error(`Client ${clientId} error:`, error);
    clients.delete(clientId);
  });
});

function broadcast(message, excludeClientId = null) {
  const messageStr = JSON.stringify(message);
  clients.forEach((client, id) => {
    if (id !== excludeClientId && client.ws.readyState === WebSocketServer.OPEN) {
      client.ws.send(messageStr);
    }
  });
}

console.log('WebSocket server running on port 8080');