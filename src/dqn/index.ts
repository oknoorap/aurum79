import SocketClient, { MessageType } from './client';
import Chart from './chart';

// Receive message from MT5
const client = new SocketClient();
const chart = new Chart();

// Receive message
client.onmessage(json => {
  const { type = null, ...ticks } = JSON.parse(json);

  switch (type) {
    case MessageType.Tick:
      const data = chart.getData(ticks);
      console.log(data);
      break;
  }
});

// setInterval(() => {
//   client.postMessage(JSON.stringify({ time: Date.now() }));
// }, 1000);
