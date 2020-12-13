import SocketClient, { ReceivedMessage } from './libs/client';
import Chart, { History } from './libs/chart';
import Agent from './libs/agent';

export default async function runtime(isTrain: boolean = false) {
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

    // Load data series to chart
    chart.loadSeries(data);
    const isValidSeries = chart.series.length === agent.inputSize;
    const isValidInput = chart.isNewTick && isValidSeries;
    if (!isValidInput) {
      return;
    }

    // Agent predictions
    // We're now save agent prediction to agent.predictMemory
    agent.predicts(chart.series);

    if (chart.isBuy()) {
      actionBuy();
    }

    if (chart.isSell()) {
      actionSell();
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
