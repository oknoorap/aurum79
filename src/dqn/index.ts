import SocketClient from './client';

// Receive message from MT5
const client = new SocketClient();

// Receive message
client.onmessage(data => {
  console.log(JSON.parse(data));
});

setInterval(() => {
  client.postMessage(`now = ${new Date().toString()}`);
}, 1000);
