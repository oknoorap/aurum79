bool isValidTick(MqlTick& tick) {
  return SymbolInfoTick(Symbol(), tick);
}

string currentTick() {
  MqlTick tick;

  if (!isValidTick(tick)) {
    return "";
  }

  return tick.ask + "," + tick.bid;
}
