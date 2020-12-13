import Decimal from "decimal.js";

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

type Tick = {
  ask: Ask;
  bid: Bid;
};

export type History = [Open, High, Low, Close, Time];

export type Data = {
  candle: Candle;
  body: Body;
  highDiff: number;
  bodyDiff: number;
  trend: Trend;
};

export type Series = [Ask, Bid, Data[]];

type SeriesParams = {
  tick: [Ask, Bid];
  history: History[];
};

interface IChart {
  loadSeries: (params: SeriesParams) => void;
}

class Chart implements IChart {
  lastDataTime: string = "";
  isNewTick: boolean = false;
  series: Data[] = [];
  tick: Tick = {
    ask: 0,
    bid: 0,
  };

  /**
   * Get data series
   */
  loadSeries({ tick, history: originalHistory }: SeriesParams) {
    const [ask, bid] = tick;

    originalHistory.splice(0, 1);
    const history = originalHistory.slice(0, 60);

    const [lastData] = history;
    const [, , , , lastDataTime] = lastData;
    this.isNewTick = this.lastDataTime !== lastDataTime;
    this.lastDataTime = lastDataTime;

    const data = history
      .reverse()
      .reduce<Data[]>((prev, current, index, history) => {
        const [open, high, low, close] = current;
        const [pOpen, pHigh, pLow, pClose] = history?.[index - 1] ?? [];
        const reducer = [...prev];

        if (open && high && low && close && pOpen && pHigh && pLow && pClose) {
          const candle = this.getCandleVolume(high, low);
          const body = this.getBodyVolume(open, close);
          const trend = this.getTrend(current);
          const highDiff = this.diff(high, pHigh, false);
          const bodyDiff = this.diff(
            high,
            trend === Trend.Bullish || trend === Trend.Unpredictable
              ? close
              : open
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
      }, []);

    this.series = data;
    this.tick = {
      ask,
      bid,
    };
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

    if (open === close) {
      return Trend.Unpredictable;
    }

    return close > open ? Trend.Bullish : Trend.Bearish;
  }
  /**
   * Get diff number between two float in abs.
   */
  diff(float: number, minusf: number, isAbs: boolean = true) {
    const number = parseInt(
      new Decimal(float).minus(minusf).toString().replace(".", "0")
    );

    if (isAbs) {
      return Math.abs(number);
    }

    return number;
  }

  /**
   * Detects if it's time to buy
   */
  isBuy() {
    const [$1, $2, $3, $4] = this.series.reverse();
    return (
      ($1.bodyDiff < $2.bodyDiff &&
        $2.bodyDiff < $3.bodyDiff &&
        $4.trend === Trend.Bearish) ||
      $4.trend === Trend.Unpredictable
    );
  }

  /**
   * Detects if it's time to sell
   */
  isSell() {
    const [$1, $2, $3, $4] = this.series.reverse();
    return (
      ($1.bodyDiff > $2.bodyDiff &&
        $2.bodyDiff > $3.bodyDiff &&
        $4.trend === Trend.Bullish) ||
      $4.trend === Trend.Unpredictable
    );
  }
}

export default Chart;
