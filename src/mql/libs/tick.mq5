string currentTick() {
  MqlTick tick;
  return DoubleToString(tick.ask) + "," + DoubleToString(tick.bid));
}
