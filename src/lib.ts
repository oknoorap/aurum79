import { type EChartsType } from "echarts";
import { type Canvas } from "canvas";

import {
  createChart,
  makeCandlestickChart,
  setupChartPlatform,
} from "@utils/chart";
import { ReceivedMessage, SocketClient } from "./socket";

setupChartPlatform();

type OHLCT = [
  open: number,
  high: number,
  low: number,
  close: number,
  time: string
];

export enum MetaTraderClientEventType {
  Tick = "tick",
  Action = "action",
  Result = "result",
}

export enum MetaTraderClientActionType {
  BUY = "buy",
  SELL = "sell",
}

export enum MetaTraderClientTradingStatus {
  IDLE,
  TRADING,
}

type MetaTraderClientActionCallbackArgs = {
  type: MetaTraderClientActionType;
  data: [number, number, Date];
};

type MetaTraderClientTickCallbackArgs = {
  tick: [number, number];
  history: Array<OHLCT>;
  chart: Buffer;
  status: MetaTraderClientTradingStatus;
  action: (actionType: MetaTraderClientActionType) => void;
};

type MetaTraderClientResultCallbackArgs = {
  result: boolean;
  data: {
    action: MetaTraderClientActionType;
    price: number;
    closedPrice: number;
  };
};

type MetaTraderClientCallback = {
  tick: (args: MetaTraderClientTickCallbackArgs) => void;
  action: (type: MetaTraderClientActionCallbackArgs) => void;
  result: (args: MetaTraderClientResultCallbackArgs) => void;
};

type MetaTraderClientTickEventArg = {
  type: MetaTraderClientEventType.Tick;
  callback: MetaTraderClientCallback[MetaTraderClientEventType.Tick];
};

type MetaTraderClientActionEventArg = {
  type: MetaTraderClientEventType.Action;
  callback: MetaTraderClientCallback[MetaTraderClientEventType.Action];
};

type MetaTraderClientResultEventArg = {
  type: MetaTraderClientEventType.Result;
  callback: MetaTraderClientCallback[MetaTraderClientEventType.Result];
};

export class MetaTraderClient {
  private chart: EChartsType;

  private canvas: Canvas;

  private canvasW: number;

  private canvasH: number;

  private socket: SocketClient;

  private events: Array<{
    type: keyof MetaTraderClientCallback;
    callback:
      | MetaTraderClientCallback[MetaTraderClientEventType.Tick]
      | MetaTraderClientCallback[MetaTraderClientEventType.Action]
      | MetaTraderClientCallback[MetaTraderClientEventType.Result];
  }> = [];

  status: MetaTraderClientTradingStatus = MetaTraderClientTradingStatus.IDLE;

  constructor() {
    const { chart, canvas, width: canvasW, height: canvasH } = createChart();
    this.chart = chart;
    this.canvas = canvas;
    this.canvasW = canvasW;
    this.canvasH = canvasH;
  }

  on<T extends keyof MetaTraderClientCallback>(
    type: T,
    callback: MetaTraderClientCallback[T]
  ) {
    this.events.push({
      type,
      callback,
    });
  }

  #action({ type: action, data }: MetaTraderClientActionCallbackArgs) {
    // only trigger if it's correct type
    const isCorrectType = [
      MetaTraderClientActionType.BUY,
      MetaTraderClientActionType.SELL,
    ].includes(action);
    if (!isCorrectType) return;

    const message = JSON.stringify({ action });
    this.socket.postMessage(message);
    this.#dispatchActionEvents({ type: action, data });
    this.status = MetaTraderClientTradingStatus.TRADING;
  }

  #dispatchTickEvents({
    tick,
    history,
  }: {
    tick: MetaTraderClientTickCallbackArgs[MetaTraderClientEventType.Tick];
    history: Array<OHLCT>;
  }) {
    const dates = history.map(
      ([_open, _high, _low_, _close, time]) => new Date(time)
    );

    const series = history.map<
      [open: number, close: number, high: number, low: number]
    >(([open, high, low, close]) => [open, close, high, low]);

    const chart = makeCandlestickChart({
      canvas: this.canvas,
      chart: this.chart,
      dates,
      series,
      width: this.canvasW,
      height: this.canvasH,
    });

    const status = this.status;

    this.events
      .filter(({ type }) => type === MetaTraderClientEventType.Tick)
      .forEach(({ callback }: MetaTraderClientTickEventArg) => {
        const action = (type: MetaTraderClientActionType) =>
          this.#action({ type, data: [...tick, new Date()] });
        callback({
          tick,
          history,
          chart,
          status,
          action,
        });
      });
  }

  #dispatchActionEvents({ type, data }: MetaTraderClientActionCallbackArgs) {
    this.events
      .filter(({ type }) => type === MetaTraderClientEventType.Action)
      .forEach(({ callback }: MetaTraderClientActionEventArg) => {
        callback({
          type,
          data,
        });
      });
  }

  #dispatchResultEvents({ result, data }: MetaTraderClientResultCallbackArgs) {
    this.events
      .filter(({ type }) => type === MetaTraderClientEventType.Result)
      .forEach(({ callback }: MetaTraderClientResultEventArg) => {
        callback({ result, data });
      });
  }

  start(port = 3333) {
    this.socket = new SocketClient({
      port,
    });

    this.socket.onmessage(async (json) => {
      const { type = null, ...data } = JSON.parse(json);

      switch (type) {
        case ReceivedMessage.Tick:
          this.#dispatchTickEvents(data);
          break;

        case ReceivedMessage.Result:
          this.#dispatchResultEvents(data);
          break;
      }
    });
  }
}
