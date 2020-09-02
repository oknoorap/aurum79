string currentTick() {
  MqlTick tick;
  return tick.ask + "," + tick.bid;
}
