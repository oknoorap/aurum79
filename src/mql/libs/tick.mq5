bool isValidCurrentTick() {
  return SymbolInfoTick(Symbol(), tick);
}

string currentTick() {
  MqlTick tick;

  if (isValidCurrentTick()) {
    return tick.ask + "," + tick.bid;
  }

  return "";
}
