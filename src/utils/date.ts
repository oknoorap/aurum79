import formatDate from "date-fns/format";

const DATE_FORMAT = "yyyy-MM-dd";

export const dateFormatTransformer = (time: Date) =>
  formatDate(time, DATE_FORMAT);
