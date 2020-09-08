type ChartPredictArgs = {
  tick: number[];
  history: number[][];
};

interface IChart {
  predict: (args: ChartPredictArgs) => void;
}

class Chart implements IChart {
  predict({ tick, history }: ChartPredictArgs) {
    const [ask, bid] = tick;
    console.log({ ask, bid });
  }
}

export default Chart;
