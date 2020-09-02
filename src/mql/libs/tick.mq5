bool isValidCurrentTick(MqlTick tick) {
  return SymbolInfoTick(Symbol(), tick);
}

string currentTick() {
  MqlTick tick;

  if (isValidCurrentTick(tick)) {
    return tick.ask + "," + tick.bid;
  }

  return "";
}
