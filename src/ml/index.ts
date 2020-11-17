import SocketClient, { ReceivedMessage } from './client';
import Chart, { History } from './chart';
import Agent, { Action } from './agent';

async function start() {
  // Create or load existing models.
  const agent = new Agent();
  await agent.createOrLoadModels();
  await agent.saveModels();

  // Receive message from socket.
  const client = new SocketClient();
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

  // Chart
  const chart = new Chart();

  /**
   * Buy Action
   */
  function actionBuy() {
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
    const action = agent.bestAction();

    switch (action) {
      case Action.Buy:
        console.log('buy', ask);
        actionBuy();
        break;

      case Action.Sell:
        console.log('sell', bid);
        actionSell();
        break;
    }
  }

  /**
   * Received data when trading result occured
   */
  function onResult(data: any) {
    console.log(data);
  }
}

// Start the engine.
start();
