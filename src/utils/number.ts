export const parseDouble = (number: string) =>
  Number(parseFloat(number).toFixed(5));

export const x5digit = (number: number) => number * 100_000;
