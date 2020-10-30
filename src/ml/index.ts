import SocketClient, { ReceivedMessage } from './client';
import Chart from './chart';
import Agent from './agent';

async function start() {
  const client = new SocketClient();

  const chart = new Chart();

  const agent = new Agent();
  await agent.createBulkModels();

  // Receive message
  client.onmessage(json => {
    const { type = null, ...jsonData } = JSON.parse(json);

    switch (type) {
      // On Tick
      case ReceivedMessage.Tick:
        const { tick, history } = jsonData;
        const [, , series] = chart.getSeries({
          tick,
          history,
        });

        if (chart.isNewTick) {
          const results = agent.bulkPredict(agent.input(series));
          console.log(results);
        }
        break;

      // On Result
      case ReceivedMessage.Result:
        break;
    }
  });
}

start();
