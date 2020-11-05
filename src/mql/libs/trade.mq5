#include <Trade\Trade.mqh>
#include <Trade\SymbolInfo.mqh>

CTrade trade;
CSymbolInfo symbolInfo;

void sendOrder(string action, ushort takeProfitInput, ushort stopLossInput) {
  symbolInfo.Name(Symbol());
  symbolInfo.RefreshRates();
  trade.SetMarginMode();
  trade.SetTypeFillingBySymbol(symbolInfo.Name());
  trade.SetDeviationInPoints(10);

  int digits = 1;
  bool isThreeDigits = symbolInfo.Digits() == 3;
  bool isFiveDigits = symbolInfo.Digits() == 5;
  if (isThreeDigits || isFiveDigits) {
    digits = 10;
  }

  double orderAction = (action == "buy") ? symbolInfo.Ask() : symbolInfo.Bid();
  double point = symbolInfo.Point() * digits;
  
  double takeProfitPoint = takeProfitInput * point;
  double takeProfitValue = (action == "buy") ? orderAction + takeProfitPoint : orderAction - takeProfitPoint;
  double takeProfit = (takeProfitPoint == 0.0) ? 0.0 : takeProfitValue;

  double stopLossPoint = stopLossInput * point;
  double stopLossValue  = (action == "buy") ? orderAction - stopLossPoint : orderAction + stopLossPoint;
  double stopLoss = (stopLossPoint == 0.0) ? 0.0 : stopLossValue;

  return trade.Buy(
    symbolInfo.LotsMin(),
    symbolInfo.Name(),
    orderAction,
    symbolInfo.NormalizePrice(stopLoss),
    symbolInfo.NormalizePrice(takeProfit)
  );
}

void buyOrder(ushort takeProfitInput, ushort stopLossInput) {
  if (sendOrder("buy", takeProfitInput, stopLossInput)) {
    Print("Buy @", symbolInfo.Ask());
  }
}

void sellOrder(ushort takeProfitInput, ushort stopLossInput) {
  if (sendOrder("sell", takeProfitInput, stopLossInput)) {
    Print("Sell @", symbolInfo.Bid());
  }
}
