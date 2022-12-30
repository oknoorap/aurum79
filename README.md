# Aurum79
As a chemical element with the symbol Au and atomic number 79, aurum, commonly known as gold, has long been esteemed for its associations with wealth and luxury. The Aurum79 JavaScript library offers a client for connecting to the MetaTrader 5 trading platform, potentially aiding users in achieving financial success through trading.

It is possible to utilize `tensorflow.js` for predicting prices, as well as for fetching forex calendar or other relevant events, allowing for the combination of technical and fundamental analysis. Additionally, using javascript can be a more convenient option than scripting in MQL5, as there may be fewer restrictions and difficulties.

---

## Installation

Prerequisites:

* NodeJS (latest version or LTS)
* MT5 client

Install from package manager:

**NPM**  
> `npm install aurum79 --save`

**Yarn**  
> `yarn add aurum79`

**PNPM**
> `pnpm add aurum79`

---

## Usage

To utilize the aurum79 module in your project, you will first need to download the compiled EA from the `mql/Aurum79.ex5` directory or compile it yourself. Once this is done, activate it within the MetaTrader5 client prior to running your script.

An example of how to utilize the `aurum79` module in your project is provided below:

```typescript
import {
  MetaTraderClient,
  MetaTraderClientActionType,
  MetaTraderClientTradingStatus,
} from 'aurum79';

const client = new MetaTraderClient();

/**
 * Listening tick event from MetaTrader5
 */
client.on('tick', ({ tick, history, chart, status, action }) => {
  // Your technical decision here
  // e.g using machine learning library such as Tensorflow.js
  if (status !== MetaTraderClientTradingStatus.TRADING) {
    // If prediction BUY
    action(MetaTraderClientActionType.BUY);

    // If Prediction SELL
    action(MetaTraderClientActionType.SELL);
  }

  // Status, 0 = IDLE, 1 = TRADING
  console.log({ status })

  // Tick price
  console.log({ tick });

  // Print all time-series historical data -60 bar
  console.log({ history });

  // Candlestick chart buffer
  // You can save buffer as image
  fs.writeFileSync(
    path.join('image', `${new Date().toISOString()}.png`),
    chart
  );
});

/**
 * Listening action triggers
 */
client.on('action', ({ type, data }) => {
  // Save action into log or database
  console.log({ type });
});

/**
 * Listening result when trading is finished
 */
client.on('result', ({ result, data }) => {
  // Save action into log or database
  console.log({ result, data });
});

// Start MetaTrader5 client
// Custom port: client.start(8080);
// Default port is 3333
client.start();
```

### License
MIT (c) copyrighted 2022 by [Ribhararnus Pracutian](https://github.com/oknoorap).
