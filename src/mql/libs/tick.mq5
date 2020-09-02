string currentTick() {
  MqlTick tick;
  return StringFormat("%%.%df,%%.%df", tick.ask, tick.bid);
}
