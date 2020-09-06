import SocketClient from './client';

// Receive message from MT5
const client = new SocketClient();
client.onmessage(data => {
  console.log(data);
  client.postMessage('Hello from client');
});
