import SocketClient, { ReceivedMessage } from './client';
import Chart from './chart';
import Agent from './agent';

async function start() {
  const chart = new Chart();
  const agent = new Agent();

  // Create or load existing models.
  await agent.createOrLoadModels();
  await agent.saveModels();

  // Receive message from socket.
  const client = new SocketClient();
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
          agent.predicts(series);
          console.log(agent.result());
        }
        break;

      // On Result
      case ReceivedMessage.Result:
        break;
    }
  });
}

// Start the engine.
start();
