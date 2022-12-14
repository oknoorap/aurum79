import * as fs from "node:fs";
import * as path from "node:path";

import winston from "winston";
import async from "async";
import { createCanvas } from "canvas";
import * as echarts from "echarts";
import { shuffle } from "radash";

import { readCSVFile } from "./utils/csv";
import { x5digit } from "./utils/number";
import { dateFormatTransformer, ts } from "./utils/date";
import { cpus } from "node:os";

type ActionEntry = {
  dates: Date[];
  series: Array<number[]>;
};

/**
 * Module setup
 */
echarts.setPlatformAPI({
  // @ts-expect-error
  createCanvas,
});

const logger = winston.createLogger({
  level: "info",
  format: winston.format.simple(),
  transports: [new winston.transports.Console()],
});

/**
 * Constants
 */
const IMAGE_CLASS_PATH = path.resolve(".", "image-class-output");
const BUY_CLASS_PATH = path.join(IMAGE_CLASS_PATH, "BUY");
const SELL_CLASS_PATH = path.join(IMAGE_CLASS_PATH, "SELL");
const BULL_COLOR = "#00da3c";
const BEAR_COLOR = "#ec0000";
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 800;

const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
const ctx = canvas.getContext("2d");
const queue = async.queue(function ({ type, dates, series }, callback) {
  // @ts-expect-error
  const chart = echarts.init(canvas, "dark");
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

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  const buffer = canvas.toBuffer("image/png");
  const imagePath = type === "buy" ? BUY_CLASS_PATH : SELL_CLASS_PATH;
  const [, randomId] = Math.random().toString().split(".");
  const [firstDate, ...restDates] = dates;
  const [lastDate] = [...restDates].reverse();
  const fileName = `${ts(firstDate)}#${ts(lastDate)}#${randomId}`;
  console.log({ type, fileName });
  fs.writeFileSync(path.join(imagePath, `${fileName}.png`), buffer);
  callback();
}, cpus().length);

const start = async () => {
  logger.info("importing csv...");
  const records = await readCSVFile("EURUSD_M5_202112130000_202212130540");
  const buyEntries: ActionEntry[] = [];
  const sellEntries: ActionEntry[] = [];

  logger.info("building time series data...");
  for (let currentIndex = 0; currentIndex < records.length; currentIndex++) {
    const firstRecordIndex = currentIndex - 24;
    const lastRecordIndex = currentIndex + 3;

    const prevRecords = records[firstRecordIndex];
    const currentRecord = records[currentIndex];
    const futureRecords = records[lastRecordIndex];

    const hasPrevRecords = prevRecords !== undefined;
    const hasFutureRecords = futureRecords !== undefined;

    if (!hasPrevRecords) continue;
    if (!hasFutureRecords) break;

    const seriesObject = records
      .slice(firstRecordIndex, lastRecordIndex)
      .filter((item) => !!item.date)
      .map(({ date, open, high, low, close }) => ({
        date,
        open,
        high,
        low,
        close,
      }));

    const futureTickOHLC$3 = seriesObject[seriesObject.length];
    const futureTickOHLC$2 = seriesObject[seriesObject.length - 1];
    const futureTickOHLC$1 = seriesObject[seriesObject.length - 2];

    const dates = seriesObject.map((item) => item.date);
    const series = seriesObject.map((item) => [
      item.open,
      item.close,
      item.low,
      item.high,
    ]);

    const isNextCloseTickDiffProfitable_TO_BUY_1 =
      x5digit(futureTickOHLC$1.close) - x5digit(currentRecord.high) >= 77;
    const isNextHighTickDiffProfitable_TO_BUY_1 =
      x5digit(futureTickOHLC$1.high) - x5digit(currentRecord.high) >= 77;
    const isNextCloseTickDiffProfitable_TO_BUY_2 =
      x5digit(futureTickOHLC$2.close) - x5digit(currentRecord.high) >= 77;
    const isNextHighTickDiffProfitable_TO_BUY_2 =
      x5digit(futureTickOHLC$2.high) - x5digit(currentRecord.high) >= 77;

    if (
      (isNextCloseTickDiffProfitable_TO_BUY_1 ||
        isNextHighTickDiffProfitable_TO_BUY_1) &&
      (isNextCloseTickDiffProfitable_TO_BUY_2 ||
        isNextHighTickDiffProfitable_TO_BUY_2)
    )
      buyEntries.push({
        dates,
        series,
      });

    const isNextCloseTickDiffProfitable_TO_SELL_1 =
      x5digit(futureTickOHLC$1.close) - x5digit(currentRecord.low) >= 77;
    const isNextHighTickDiffProfitable_TO_SELL_1 =
      x5digit(futureTickOHLC$1.low) - x5digit(currentRecord.low) >= 77;
    if (
      isNextCloseTickDiffProfitable_TO_SELL_1 ||
      isNextHighTickDiffProfitable_TO_SELL_1
    )
      sellEntries.push({
        dates,
        series,
      });
  }

  const qEntries = [];
  for (const { dates, series } of buyEntries) {
    qEntries.push({ type: "buy", dates, series });
  }

  for (const { dates, series } of sellEntries) {
    qEntries.push({ type: "sell", dates, series });
  }

  for (const queueItem of shuffle(qEntries)) {
    queue.push(queueItem);
  }
};

/**
 * Start the app
 */
start();
