const WebSocket = require('ws');

const port = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port }, () => {
  console.log(`WebSocket server started on port ${port}`);
});

const connections = {};

wss.on('connection', function connection(ws) {
  console.log('A new client connected');

  ws.on('message', function incoming(_message) {
    //console.log(`Received message: ${_message}`);

    try {
      const parsedMessage = JSON.parse(_message);
      const { type, id, destination, sdp, candidate, message } = parsedMessage;

      // Register client
      if (type === 'register') {
        ws.id = id;
        connections[ws.id] = { ws, id };
        console.log(`Registered client: ${id}`);
        return;
      }

      // Check that destination exists before forwarding
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
          console.log(`Forwarded ${type} to ${destination}`);
          break;
        case 'ice_candidate':
          targetConn.ws.send(JSON.stringify({ type, candidate }));
          console.log(`Forwarded ICE candidate to ${destination}`);
          break;
        case 'data':
          targetConn.ws.send(JSON.stringify({ type, message }));
          console.log(`Forwarded data message '${message}' to ${destination}`);
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
    delete connections[ws.id];
  });
});



//const WebSocket = require('ws');

// // Get the port from the environment variable (Render will assign it)
// const port = process.env.PORT || 3000;

// // Create a WebSocket server
// const wss = new WebSocket.Server({ port }, () => {
//   console.log(`WebSocket server started on port ${port}`);
// });

// // Store connected clients and servers
// const connections = {};

// // Handle WebSocket connections
// wss.on('connection', function connection(ws) {
//   console.log('A new client connected');

//   ws.on('message', function incoming(_message) {
//     //console.log(`Received message: ${message}`);

//     try {
//       const parsedMessage = JSON.parse(_message);
//       const { type, id, destination, sdp, candidate, message } = parsedMessage;
//       //console.log(`type: ${type}, id: ${id}, destination: ${destination}`);

//       // Register client/server IDs
//       if (type === 'register') {
//         ws.id = id;  // Assign the id to the WebSocket instance
//         connections[ws.id] = { ws, id, destination }; // Store connection
//         console.log(`Registered ${id}`);
//       }

//       // Forward WebRTC offer/answer SDP to the correct destination (client or server)
//       if (type === 'OFFER' || type === 'ANSWER' || type === 'offer' || type === 'answer') {
//         const targetConn = Object.values(connections).find(conn => conn.id === destination);
//         if (targetConn && targetConn.ws.readyState === WebSocket.OPEN) {
//           targetConn.ws.send(JSON.stringify({ type, sdp }));
//           console.log(`Forwarded ${type} to ${destination}`);
//         } else {
//           console.log(`Could not forward ${type} to ${destination}`);
//         }
//       }

//       // Forward ICE candidates to the correct destination
//       if (type === 'ICE_CANDIDATE') {
//         const targetConn = Object.values(connections).find(conn => conn.id === destination);
//         if (targetConn && targetConn.ws.readyState === WebSocket.OPEN) {
//           targetConn.ws.send(JSON.stringify({ type, candidate }));
//           //console.log(`Forwarded ICE candidate to ${destination}`);
//         } else {
//           console.log(`Could not forward ICE candidate to ${destination}`);
//         }
//       }
//       if (type === 'data') {
//         const targetConn = Object.values(connections).find(conn => conn.id === destination);
//         if (targetConn && targetConn.ws.readyState === WebSocket.OPEN) {
//           targetConn.ws.send(JSON.stringify({ type,  message}));
//           console.log(`Forwarded MESSAGE ${message} candidate to ${destination}`);
//         } else {
//           console.log(`Could not forward ${message} to ${destination}`);
//         }
//       }


//       // Handle start/stop stream messages
//       // if (type === 'START_STREAM') {
//       //   // Iterate over all client connections and send START_STREAM message
//       //   Object.values(connections).forEach(clientConn => {
//       //      const clientConn = Object.values(connections).find(conn => conn.id === destination);
//       //     console.log(`Checking client ${clientConn.id}`);
//       //     if (clientConn.ws.readyState === WebSocket.OPEN) {
//       //       const startStreamMessage = {
//       //         type: 'START_STREAM',
//       //         // Add any additional fields here (responseId, requestId, etc.)
//       //       };

//       //       clientConn.ws.send(JSON.stringify(startStreamMessage));
//       //       console.log(`Forwarded start stream to client ${clientConn.id}`);
//       //     } else {
//       //       console.log(`NOT Forwarded start_stream to client ${clientConn.id} (connection closed or not open)`);
//       //     }
//       //   });
//       // }
//       if (type === 'START_STREAM') {
//         const clientConn = Object.values(connections).find(conn => conn.id === destination);
//         if (clientConn && clientConn.ws.readyState === WebSocket.OPEN) {
//           const stopStreamMessage = {
//             type: 'START_STREAM',
//             id,
//             destination
//           };
//           clientConn.ws.send(JSON.stringify(stopStreamMessage));
//           console.log(`Forwarded start stream to client ${destination}`);
//         } else {
//           console.log(`NOT Forwarded start_stream to client ${destination}`);
//         }
//       }

//       if (type === 'STOP_STREAM') {
//         const clientConn = Object.values(connections).find(conn => conn.id === destination);
//         if (clientConn && clientConn.ws.readyState === WebSocket.OPEN) {
//           const stopStreamMessage = {
//             type: 'STOP_STREAM',
//             id,
//             destination
//           };
//           clientConn.ws.send(JSON.stringify(stopStreamMessage));
//           console.log(`Forwarded stop stream to client ${destination}`);
//         } else {
//           console.log(`NOT Forwarded stop_stream to client ${destination}`);
//         }
//       }

//     } catch (err) {
//       console.error('Error handling message:', err);
//     }
//   });

//   // Handle client disconnection
//   ws.on('close', () => {
//     console.log(`Client disconnected: ${ws.id}`);
//     delete connections[ws.id]; // Remove the connection from the collection
//   });
// });
