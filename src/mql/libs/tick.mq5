string currentTick() {
  MqlTick tick;
  return StringFormat("%s,%s", DoubleToString(tick.ask), DoubleToString(tick.bid));
}
