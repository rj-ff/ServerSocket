const WebSocket = require('ws');

const port = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port }, () => {
  console.log(`WebSocket server started on port ${port}`);
});

const connections = {};

// Send a "ping" every 4 minutes to keep connections alive
setInterval(() => {
  Object.values(connections).forEach(({ ws }) => {

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }));
      console.log('ping sent');
    }
  });
}, 4 * 60 * 1000); // 4 minutes

wss.on('connection', function connection(ws) {
  console.log('A new client connected');

  ws.on('message', function incoming(_message) {
    try {
      const parsedMessage = JSON.parse(_message);
      const { type, id, destination, sdp, candidate, message } = parsedMessage;

      //console.log('Received message:', parsedMessage);

      // Register client
      if (type === 'register') {
        ws.id = id;
        ws.destination = destination;
        connections[ws.id] = { ws, id, destination };
        console.log(`Registered client: ${id} destination ${destination}`);

        // Send a registration confirmation back to the client
        const mm = {
          type: 'connection',
          message: "registered",
          id: ws.id,
          destination: ws.id,
        };

        ws.send(JSON.stringify(mm));
        console.log(`Sent registration confirmation to client: ${ws.id}`);
        return;
      }

      // Handle pong response from client
      if (type === 'pong') {
        console.log(`Received pong from client: ${ws.id}`);
        return;
      }

      // Ensure destination is valid
      if (!destination || !connections[destination]) {
        console.log(`Invalid destination: ${destination}`);
        return;
      }

      const targetConn = connections[destination];
      if (!targetConn || targetConn.ws.readyState !== WebSocket.OPEN) {
        console.log(`Destination ${destination} is unavailable`);
        return;
      }

      // Switch statement for message types
      switch (type.toLowerCase()) {
        case 'offer':
        case 'answer':
          targetConn.ws.send(JSON.stringify({ type, sdp }));
          //console.log(`Forwarded ${type} to ${destination}`);
          break;
        case 'ice_candidate':
          targetConn.ws.send(JSON.stringify({ type, candidate }));
         // console.log(`Forwarded ICE candidate to ${destination}`);
          break;
        case 'data':
          console.log(`Data message ${message}`);
          targetConn.ws.send(JSON.stringify({ type, message }));
          //console.log(`Forwarded data message ${message} to ${destination}`);
          break;
        case 'start_stream':
        case 'stop_stream':
          targetConn.ws.send(JSON.stringify({ type, id, destination }));
          console.log(`Forwarded ${type} to ${destination}`);
          break;
        default:
          console.log(`Unknown message type: ${type}`);
      }
    } catch (err) {
      console.error('Error handling message:', err);
    }
  });

  ws.on('close', () => {
    console.log(`Client disconnected: ${ws.id}`);

    // Send a disconnection message to the destination
    const disconnectedClient = connections[ws.id];
    if (disconnectedClient && disconnectedClient.id) {
      const r = {
        type: 'disconnection',
        message: "dc",
        id: disconnectedClient.id,
        destination: disconnectedClient.destination,
      };

      const targetConn = connections[disconnectedClient.destination];
      if (targetConn && targetConn.ws.readyState === WebSocket.OPEN) {
        targetConn.ws.send(JSON.stringify(r));
        console.log(`Sent disconnection message for ${disconnectedClient.id} to destination`);
      }
    }

    // Remove the connection from the list
    delete connections[ws.id];
  });
});



// const WebSocket = require('ws');

// const port = process.env.PORT || 3000;
// const wss = new WebSocket.Server({ port }, () => {
//   console.log(`WebSocket server started on port ${port}`);
// });

// const connections = {};

// // Send a "ping" every 4 minutes to keep connections alive
// setInterval(() => {
//   Object.values(connections).forEach(({ ws }) => {
//     if (ws.readyState === WebSocket.OPEN) {
//       ws.send(JSON.stringify({ type: 'ping' }));
//       console.log('ping sent');
//     }
//   });
// }, 4 * 60 * 1000); // 4 minutes

// wss.on('connection', function connection(ws) {
//   console.log('A new client connected');

//   ws.on('message', function incoming(_message) {
//     try {
//       const parsedMessage = JSON.parse(_message);
//       const { type, id, destination, sdp, candidate, message } = parsedMessage;

//       // Register client
//       if (type === 'register') {
//         ws.id = id;
//         connections[ws.id] = { ws, id };
//         console.log(`Registered client: ${id}`);
//         return;
//       }

//       // Handle pong response from client
//       if (type === 'pong') {
//         console.log(`Received pong from client: ${ws.id}`);
//         return;
//       }
//       var conn= true;
//       const targetConn = connections[destination];
//       if (!targetConn || targetConn.ws.readyState !== WebSocket.OPEN) {
//         console.log(`Destination ${destination} is unavailable`);
//         conn=false; 
//         //return;
//       }

//       // Switch statement for message types
//       switch (type.toLowerCase()) {
//         case 'offer':
//         case 'answer':
//           targetConn.ws.send(JSON.stringify({ type, sdp }));
//           console.log(`Forwarded ${type} to ${destination}`);
//           break;
//         case 'ice_candidate':
//           targetConn.ws.send(JSON.stringify({ type, candidate }));
//           console.log(`Forwarded ICE candidate to ${destination}`);
//           break;
//         case 'data':
//           console.log(`data message ${message} `);
//           if(!conn)
//             return;

//           targetConn.ws.send(JSON.stringify({ type, message }));
//           console.log(`Forwarded data message ${message} to ${destination}`);
//           break;
//         case 'start_stream':
//         case 'stop_stream':
//           targetConn.ws.send(JSON.stringify({ type, id, destination }));
//           console.log(`Forwarded ${type} to ${destination}`);
//           break;
//         default:
//           console.log(`Unknown message type: ${type}`);
//       }
//     } catch (err) {
//       console.error('Error handling message:', err);
//     }
//   });

//   ws.on('close', () => {
//     console.log(`Client disconnected: ${ws.id}`);
//     delete connections[ws.id];
//   });
// });
