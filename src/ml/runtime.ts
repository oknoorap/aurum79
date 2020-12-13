import SocketClient, { ReceivedMessage } from "./libs/client";
import Chart, { History } from "./libs/chart";
import Agent, { Action } from "./libs/agent";

export default async function runtime(isTrain: boolean = false) {
  // Trade status
  let isTrading = false;
  let iterator = 0;
  let action: Action;

  // Chart
  const chart = new Chart();

  // Create or load existing models.
  const agent = new Agent();
  await agent.createOrLoadModels();
  if (isTrain) {
    await agent.saveModels();
  }

  // Socket client
  // Waiting for agents model loaded
  const client = new SocketClient();

  // Receive message from socket.
  client.onmessage(async (json) => {
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
        action: "buy",
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
        action: "sell",
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
    action = agent.bestAction();

    if (!isTrain && action === Action.NoAction) {
      return;
    }

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
  async function onResult({ result, data }: { result: boolean; data: any }) {
    // If prediction correct
    // Keeps noAction or takeAction models
    if (isTrain) {
      console.log({ result, data, iterator });

      if (iterator === 10) {
        await agent.saveModels();
        iterator = 0;
      } else {
        iterator++;
      }

      await agent.keepBestModels();
    }

    isTrading = false;
  }
}
