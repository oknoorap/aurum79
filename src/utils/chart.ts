import { createCanvas as $createCanvas, Canvas } from "canvas";
import * as echarts from "echarts";
import { BEAR_COLOR, BULL_COLOR } from "../constants/chart";
import { clearCanvas, createCanvas } from "./canvas";
import { dateFormatTransformer } from "./date";

export const setupChartPlatform = () => {
  echarts.setPlatformAPI({
    // @ts-expect-error no-typings
    createCanvas: $createCanvas,
  });
};

export const createChart = (width: number = 800, height: number = 800) => {
  const [canvas] = createCanvas(width, height);
  // @ts-expect-error no-typings
  const chart = echarts.init(canvas, "dark");
  return {
    chart,
    canvas,
    width,
    height,
  };
};

export const makeCandlestickChart = ({
  canvas,
  chart,
  width,
  height,
  dates,
  series,
}: {
  canvas: Canvas;
  chart: echarts.ECharts;
  width: number;
  height: number;
  dates: Date[];
  series: [open: number, close: number, high: number, low: number][];
}) => {
  clearCanvas(canvas, width, height);

  const formattedDate = dates.map(dateFormatTransformer);
  const option: echarts.EChartsOption = {
    xAxis: {
      data: formattedDate,
      show: false,
    },
    yAxis: {
      scale: true,
      show: false,
    },
    series: [
      {
        type: "candlestick",
        itemStyle: {
          color: BULL_COLOR,
          color0: BEAR_COLOR,
          borderColor: undefined,
          borderColor0: undefined,
        },
        data: series,
      },
    ],
  };
  chart.setOption(option);
  return canvas.toBuffer("image/png");
};
