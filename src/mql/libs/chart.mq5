bool isValidTick(MqlTick& tick) {
  return SymbolInfoTick(Symbol(), tick);
}

//--
// Get current tick
string currentTick() {
  MqlTick tick;

  if (!isValidTick(tick)) {
    return "";
  }

  return tick.ask + "," + tick.bid;
}

//---
// Get tick history
string getRatesHistory() {
   MqlRates rates[];
   ArraySetAsSeries(rates, true);
   
   int isCopied = CopyRates(_Symbol, _Period, 0, 70, rates);
   int historySize = ArraySize(rates);
   string outputFormat = "%G,%G,%G,%G ";
   string history = "";
   
   if (!isCopied) {
      return history;
   }

   for (int i = 0; i < historySize; i++) {
      history += StringFormat(outputFormat, rates[i].open, rates[i].high, rates[i].low, rates[i].close);
   }

   return history;
}
