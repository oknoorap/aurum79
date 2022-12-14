import getUnixTime from "date-fns/getUnixTime";
import formatDate from "date-fns/format";

const DATE_FORMAT = "yyyy-MM-dd";

const DAY_MONTH_FORMAT = "dd-MM";

export const dateFormatTransformer = (time: Date) =>
  formatDate(time, DATE_FORMAT);

export const dateDayFormatTransformer = (time: Date) =>
  formatDate(time, DAY_MONTH_FORMAT);

export const ts = (time: Date) => getUnixTime(time);
