import Decimal from 'decimal.js';

type OHLC = {
  open: number;
  high: number;
  low: number;
  close: number;
};

type Volume = {
  candle: number;
  body: number;
};

enum CandleType {
  Unknown,
  Doji,
}

type DataStream = [number, number, number, number, string];

type DataOptions = {
  tick: number[];
  history: DataStream[];
};

type Data = [number, number, [CandleType, number, number][]];

type RawData = OHLC &
  Volume & {
    type: CandleType;
    label: string;
    time: string;
  };

interface IChart {
  getData: (args: DataOptions) => Data;
}

const CandleLabel = {
  [CandleType.Unknown]: 'unknown',
  [CandleType.Doji]: 'doji',
};

class Chart implements IChart {
  rawData: RawData[] = [];

  getData({ tick, history }: DataOptions): Data {
    const [ask, bid] = tick;

    const prevHistory = history.slice(1, history.length);
    const rawData = prevHistory.reduce<RawData[]>((prev, current) => {
      const [open, high, low, close, time] = current;
      const reducer = [...prev];

      if (open && high && low && close) {
        const candle = this.getCandleVolume(high, low);
        const body = this.getBodyVolume(open, close);
        const type = this.getCandleType({
          open,
          high,
          low,
          close,
          candle,
          body,
        });
        const label = CandleLabel[type];
        reducer.push({
          type,
          label,
          candle,
          body,
          open,
          high,
          low,
          close,
          time,
        });
      }

      return reducer;
    }, []);

    this.rawData = rawData;

    return [
      ask,
      bid,
      this.rawData.map(({ type, candle, body }) => [type, candle, body]),
    ];
  }

  getRawData() {
    return this.rawData;
  }

  getCandleVolume(high: number, low: number) {
    return this.substract(high, low);
  }

  getBodyVolume(open: number, close: number) {
    return this.substract(open, close);
  }

  getCandleType({ open, high, low, close, candle, body }: OHLC & Volume) {
    let type = CandleType.Unknown;

    // open - close range
    const opencloseRange = this.substract(open, close);

    // high -low range
    const highlowRange = this.substract(high, low);

    // Doji
    if (body <= 2) {
      type = CandleType.Doji;
    }

    return type;
  }

  substract(float: number, subn: number, isAbs: boolean = true) {
    const number = parseInt(
      new Decimal(float)
        .minus(subn)
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
