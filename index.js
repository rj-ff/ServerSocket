const WebSocket = require('ws');

// Get the port from the environment variable (Render will assign it)
const port = process.env.PORT || 3000; 

// Create a WebSocket server
const wss = new WebSocket.Server({ port }, () => {
  console.log(`WebSocket server started on port ${port}`);
});

// Store connected clients and servers
const connections = {};

// Handle WebSocket connections
wss.on('connection', function connection(ws) {
  console.log('A new client connected');

  ws.on('message', function incoming(message) {
    console.log(`Received message: ${message}`);
    
    try {
      const parsedMessage = JSON.parse(message);
      const { type, clientId, serverId, id, destination, sdp, candidate } = parsedMessage;
      console.log(`type: ` + type);

      // Register client/server IDs
      if (type === 'register') {
        connections[ws.id] = { ws, clientId, serverId, id, destination };
        console.log(`Registered clientId: ${clientId}, serverId: ${serverId}`);
      }

      // Forward WebRTC offer/answer SDP to the correct destination (client or server)
      if (type === 'OFFER' || type === 'ANSWER') {
        const targetConn = Object.values(connections).find(conn => conn.id === destination);
        if (targetConn && targetConn.ws.readyState === WebSocket.OPEN) {
          targetConn.ws.send(JSON.stringify({ type, sdp }));
          console.log(`Forwarded ${type} to ${destination}`);
        }
      }

      // Forward ICE candidates to the correct destination
      if (type === 'ICE_CANDIDATE') {
        const targetConn = Object.values(connections).find(conn => conn.id === destination);
        if (targetConn && targetConn.ws.readyState === WebSocket.OPEN) {
          targetConn.ws.send(JSON.stringify({ type, candidate }));
          console.log(`Forwarded ICE candidate to ${destination}`);
        }
      }

      // Handle start/stop stream messages
      if (type === 'START_STREAM') {
        const clientConn = Object.values(connections).find(conn => conn.id === "client");
        if (clientConn && clientConn.ws.readyState === WebSocket.OPEN) {
            const startStreamMessage = {
                type: 'START_STREAM',
                clientId,    // Include clientId
                serverId,    // Include serverId
                id,          // Include id
                destination  // Include destination
            };
            clientConn.ws.send(JSON.stringify(startStreamMessage));
            console.log(`Forwarded start stream to client ${clientId}`);
        }
    }
    
    if (type === 'STOP_STREAM') {
        const clientConn = Object.values(connections).find(conn => conn.id === "client");
        if (clientConn && clientConn.ws.readyState === WebSocket.OPEN) {
            const stopStreamMessage = {
                type: 'STOP_STREAM',
                clientId,    // Include clientId
                serverId,    // Include serverId
                id,          // Include id
                destination  // Include destination
            };
            clientConn.ws.send(JSON.stringify(stopStreamMessage));
            console.log(`Forwarded stop stream to client ${clientId}`);
        }
    }
    
    } catch (err) {
      console.error('Error handling message:', err);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});
