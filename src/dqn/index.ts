import SocketClient, { MessageType } from './client';
import Chart from './chart';

// Receive message from MT5
const client = new SocketClient();
const chart = new Chart();

// Receive message
client.onmessage(json => {
  const { type = null, ...data } = JSON.parse(json);

  switch (type) {
    case MessageType.Tick:
      const { tick, history } = data;
      chart.predict({
        tick,
        history,
      });
      break;
  }
});

// setInterval(() => {
//   client.postMessage(JSON.stringify({ time: Date.now() }));
// }, 1000);
