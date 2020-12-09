import SocketClient, { ReceivedMessage } from './client';
import Chart, { History } from './chart';
import Agent, { Action } from './agent';

async function start() {
  // Trade status
  let isTrading = false;

  // Chart
  const chart = new Chart();

  // Socket client
  const client = new SocketClient();

  // Create or load existing models.
  const agent = new Agent();
  await agent.createOrLoadModels();
  await agent.saveModels();

  // Receive message from socket.
  client.onmessage(json => {
    const { type = null, ...data } = JSON.parse(json);

    switch (type) {
      case ReceivedMessage.Tick:
        onTick(data);
        break;

      case ReceivedMessage.Result:
        onResult(data);
        break;
    }
  });

  /**
   * Buy Action
   */
  function actionBuy() {
    isTrading = true;
    client.postMessage(
      JSON.stringify({
        action: 'buy',
      })
    );
  }

  /**
   * Sell Action
   */
  function actionSell() {
    isTrading = true;
    client.postMessage(
      JSON.stringify({
        action: 'sell',
      })
    );
  }

  /**
   * Received data when chart ticks.
   */
  function onTick(data: { tick: [number, number]; history: History[] }) {
    if (isTrading) {
      return;
    }

    const { tick, history } = data;
    const [ask, bid, series] = chart.getSeries({
      tick,
      history,
    });

    const isNewTick = chart.isNewTick;
    const isValidInput = series.length === agent.inputSize;
    if (!(isNewTick && isValidInput)) {
      return;
    }

    agent.predicts(series);

    switch (agent.bestAction()) {
      case Action.Buy:
        actionBuy();
        break;

      case Action.Sell:
        actionSell();
        break;
    }
  }

  /**
   * Received data when trading result occured
   */
  function onResult({ result, data }: { result: boolean; data: any }) {
    console.log({ result, data });
    isTrading = false;
  }
}

// Start the engine.
start();
