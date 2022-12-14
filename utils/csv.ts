import * as fs from "node:fs";
import * as path from "node:path";

import { parse as csvParser } from "csv-parse";
import { parseDouble } from "./number";

export type OHLCRRecord = {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  tickVolume: number;
  volume: number;
  spread: number;
};

export type OHLCRRecords = Array<OHLCRRecord>;

export const OHLC_DATA_PATH = path.resolve(".", "ohlc-data");

export const readCSVFile = async (filename: string) => {
  const records: OHLCRRecords = [];
  const parser = fs
    .createReadStream(path.join(OHLC_DATA_PATH, `${filename}.csv`))
    .pipe(
      csvParser({
        delimiter: "\t",
        columns: false,
      })
    );

  for await (const [
    date,
    time,
    open,
    high,
    low,
    close,
    tickVolume,
    volume,
    spread,
  ] of parser) {
    const record = {
      date: new Date(date.replace(/\./g, "-") + " " + time),
      open: parseDouble(open),
      high: parseDouble(high),
      low: parseDouble(low),
      close: parseDouble(close),
      tickVolume: parseInt(tickVolume),
      volume: parseInt(volume),
      spread: parseInt(spread),
    };

    if (
      isNaN(record.open) ||
      isNaN(record.high) ||
      isNaN(record.low) ||
      isNaN(record.close)
    )
      continue;

    records.push(record);
  }

  return records;
};
