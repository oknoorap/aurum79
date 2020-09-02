string currentTick() {
  MqlTick tick;

  if (SymbolInfoTick(Symbol(), tick)) {
    return tick.ask + "," + tick.bid;
  }

  return "";
}
