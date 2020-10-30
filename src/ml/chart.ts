import Decimal from 'decimal.js';

enum Trend {
  Bullish,
  Bearish,
  Unpredictable,
}

type Open = number;
type Close = number;
type High = number;
type Low = number;
type Time = string;
type Candle = number;
type Body = number;
type Ask = number;
type Bid = number;

type OHLC = {
  open: Open;
  high: High;
  low: Low;
  close: Close;
};

type Volume = {
  candle: Candle;
  body: Body;
};

type Tick = {
  ask: Ask;
  bid: Bid;
};

type History = [Open, High, Low, Close, Time];

export type Data = {
  candle: Candle;
  body: Body;
  highDiff: number;
  bodyDiff: number;
  trend: Trend;
};

type Series = [Ask, Bid, Data[]];

type SeriesParams = {
  tick: [Ask, Bid];
  history: History[];
};

interface IChart {
  getSeries: (params: SeriesParams) => Series;
}

class Chart implements IChart {
  lastDataTime: string = '';
  isNewTick: boolean = false;
  data: Data[] = [];
  tick: Tick = {
    ask: 0,
    bid: 0,
  };

  /**
   * Get data series
   */
  getSeries({ tick, history }: SeriesParams): Series {
    const [ask, bid] = tick;

    history.splice(0, 1);
    const [lastData] = history;

    const [, , , , lastDataTime] = lastData;
    if (this.lastDataTime !== lastDataTime) {
      this.isNewTick = true;
    }
    this.lastDataTime = lastDataTime;

    const datahistory = history.reverse();
    const data = datahistory.reduce<Data[]>(
      (prev, current, index, datahistory) => {
        const [open, high, low, close] = current;
        const [pOpen, pHigh, pLow, pClose] = datahistory?.[index - 1] ?? [];
        const reducer = [...prev];

        if (open && high && low && close && pOpen && pHigh && pLow && pClose) {
          const candle = this.getCandleVolume(high, low);
          const body = this.getBodyVolume(open, close);
          const trend = this.getTrend(current);
          const highDiff = this.diff(high, pHigh, false);
          const bodyDiff = this.diff(
            high,
            trend === Trend.Bullish ? close : open
          );

          reducer.push({
            candle,
            body,
            trend,
            highDiff,
            bodyDiff,
          });
        }

        return reducer;
      },
      []
    );

    this.data = data;
    this.tick = {
      ask,
      bid,
    };

    return [this.tick.ask, this.tick.bid, this.data];
  }

  /**
   * Get candle volume in integer
   */
  getCandleVolume(high: number, low: number) {
    return this.diff(high, low);
  }

  /**
   * Get candle's body volume in integer
   */
  getBodyVolume(open: number, close: number) {
    return this.diff(open, close);
  }

  /**
   * Get candlestick's trend, is it up or down
   */
  getTrend(data: History) {
    const [open, , , close] = data;
    return close > open ? Trend.Bullish : Trend.Bearish;
  }
  /**
   * Get diff number between two float in abs.
   */
  diff(float: number, minusf: number, isAbs: boolean = true) {
    const number = parseInt(
      new Decimal(float)
        .minus(minusf)
        .toString()
        .replace('.', '0')
    );

    if (isAbs) {
      return Math.abs(number);
    }

    return number;
  }
}

export default Chart;
