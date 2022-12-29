# Aurum79
Aurum (79) is a Gold name from periodic table in chemistry.

---

## Installation

<details>
<summary>NodeJS</summary>

**NPM**  
> `npm install aurum79 --save`

**Yarn**  
> `yarn add aurum79`

**PNPM**
> `pnpm add aurum79`
</details>

<details>
<summary>Deno</summary>

</details>

---

## Basic Usage

```typescript
const client = new MetaTraderNode();

/**
 * Listening tick event from MetaTrader5
 */
client.on('tick', ({ tick, history, chart, action }) => {
  // Your technical decision here
  // e.g using machine learning library such as Tensorflow.js
  
  // If prediction BUY
  action('BUY');

  // If Prediction SELL
  action('SELL');

  // Tick price
  console.log({ tick });

  // Print all time-series historical data -60 bar
  console.log({ history });

  // Candlestick chart buffer
  // You can save buffer as image
  fs.writeFileSync(
    path.join('image', `${new Date().toISOString()}.png`),
    buffer
  );
});

/**
 * Listening action triggers
 */
client.on('action', (type: "SELL" | "BUY") => {
  // Save action into log or database
  // { type: "SELL" } or { type: "BUY" }
  console.log({ type });
});

/**
 * Listening result when trading is finished
 */
client.on('result', (isProfit: boolean, data: ) => {
  // Save action into log or database
  // { isProfit: true } or { isProfit: false }
  console.log({ isProfit });
});

// Start MetaTrader5 client
client.start();
```

### License
MIT (c) copyrighted 2002 by [Ribhararnus Pracutian](https://github.com/oknoorap).
