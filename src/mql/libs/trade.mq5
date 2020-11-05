#include <Trade\Trade.mqh>
#include <Trade\SymbolInfo.mqh>

CTrade trade;
CSymbolInfo symbolInfo;

void buyOrder(ushort takeProfitInput, ushort stopLossInput) {
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

  double point = symbolInfo.Point() * digits;
  double takeProfitPoint = takeProfitInput * point;
  double takeProfit = (takeProfitPoint == 0.0) ? 0.0 : symbolInfo.Ask() + takeProfitPoint;
  double stopLossPoint = stopLossInput * point;
  double stopLoss = (stopLossPoint == 0.0) ? 0.0 : symbolInfo.Ask() - stopLossPoint;

  if (trade.Buy(
    symbolInfo.LotsMin(),
    symbolInfo.Name(),
    symbolInfo.Ask(),
    symbolInfo.NormalizePrice(stopLoss),
    symbolInfo.NormalizePrice(takeProfit)
  )) {
    Print("Order @", symbolInfo.Ask());
  }
}
