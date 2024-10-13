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
      const { type, clientId, serverId, id, destination } = parsedMessage;
      console.log(`type: ` + type);
    console.log(`clientid: ` + clientId);
    console.log(`serverid: ` + serverId);
    console.log(`id: ` + id);
    console.log(`destination: ` + destination);

      // Register client/server IDs
      if (type === 'register') {
        connections[ws.id] = { ws, clientId, serverId, id, destination };
        
        console.log(`Registered clientId: ${clientId}, serverId: ${serverId}`);
      }

      // Forward start stream message to client
      if (type === 'START_STREAM') {
        console.log(`type=START_STREAM cc`);
        
        const clientConn = Object.values(connections).find(conn => conn.id === "client");

        if (!clientConn) {
        console.log(`No client found for clientId: ${clientId}`);
        }
        if (clientConn && clientConn.ws.readyState === WebSocket.OPEN) {
          console.log(`Forwardeding`);
          clientConn.ws.send(JSON.stringify({ type: 'START_STREAM', destination }));
          console.log(`Forwarded start stream to client ${clientId}`);
        }
        else{
          console.log(`NOTForwardeding` + clientConn.ws.readyState);
        }
      
    }

    // Forward stop stream message to client
      if (type === 'STOP_STREAM') {
        const clientConn = Object.values(connections).find(conn => conn.id === "client");
        if (clientConn && clientConn.ws.readyState === WebSocket.OPEN) {
          console.log(`Forwardeding`);
          clientConn.ws.send(JSON.stringify({ type: 'STOP_STREAM', destination }));
          console.log(`Forwarded stop stream to client ${clientId}`);
        }
        else{
          console.log(`Not Forwardeding` + clientConn.ws.readyState);
        }
      }
     }catch (err) {
      console.error('Error handling message:', err);
    }
});

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});
