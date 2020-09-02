string currentTick() {
  MqlTick tick;
  return StringFormat("%G,%G,%G", tick.ask, tick.bid);
}
