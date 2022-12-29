import {
  MetaTraderClient,
  MetaTraderClientActionType,
  MetaTraderClientTradingStatus,
} from "dist";

const client = new MetaTraderClient();

/**
 * Listening tick event from MetaTrader5
 */
client.on("tick", ({ tick, history, status, chart, action }) => {
  // Your technical decision here
  // e.g using machine learning library such as Tensorflow.js
  if (status !== MetaTraderClientTradingStatus.TRADING) {
    // If prediction BUY
    action(MetaTraderClientActionType.BUY);
    // If Prediction SELL
    // action(MetaTraderClientActionType.SELL);
  }

  // Status
  // console.log({ status });

  // Tick price
  // console.log({ tick });

  // Print all time-series historical data -60 bar
  // console.log({ history });

  // Candlestick chart buffer
  // You can save buffer as image
  // fs.writeFileSync(
  //   path.join('image', `${new Date().toISOString()}.png`),
  //   buffer
  // );
});

/**
 * Listening action triggers
 */
client.on("action", ({ type, data }) => {
  // Save action into log or database
  console.log({ type, data });
});

/**
 * Listening result when trading is finished
 */
client.on("result", ({ result, data }) => {
  // Save action into log or database
  // { isProfit: true } or { isProfit: false }
  console.log({ result, data });
});

// Start MetaTrader5 client
client.start();
