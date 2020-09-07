import SocketClient from './client';

// Receive message from MT5
const client = new SocketClient();

// Receive message
client.onmessage(data => {
  console.log(JSON.parse(data));
});

setInterval(() => {
  client.postMessage(JSON.stringify({ time: Date.now() }));
}, 1000);
