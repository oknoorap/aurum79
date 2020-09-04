
#include "json.mqh"

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

  JSON ticks, json;
  ticks[0] = tick.ask;
  ticks[0] = tick.bid;
  json.Set(ticks);

  return json.Serialize();
}

//---
// Get tick history
string getRatesHistory() {
   MqlRates rates[];
   ArraySetAsSeries(rates, true);
   
   int isCopied = CopyRates(_Symbol, _Period, 0, 70, rates);
   int historySize = ArraySize(rates);
   JSON history;
   
   if (!isCopied) {
    return history.Serialize();
   }

   for (int i = 0; i < historySize; i++) {
    JSON ohlc;
    ohlc[0] = rates[i].open;
    ohlc[1] = rates[i].high;
    ohlc[2] = rates[i].low;
    ohlc[3] = rates[i].close;
    history.Add(ohlc);
   }

   return history.Serialize();
}
