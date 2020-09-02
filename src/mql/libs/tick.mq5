string currentTick() {
  MqlTick tick;
  return StringFormat("%s", DoubleToString(tick.ask), DoubleToString(tick.bid));
}
