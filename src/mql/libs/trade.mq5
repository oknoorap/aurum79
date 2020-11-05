#include <Trade\Trade.mqh>
#include <Trade\SymbolInfo.mqh>

CTrade trade;
CSymbolInfo symbolInfo;

void buyOrder(ushort takeProfitInput, ushort stopLossInput) {
  int digits = 1;
  bool isThreeDigits = symbolInfo.Digits() == 3;
  bool isFiveDigits = symbolInfo.Digits() == 5;
  if (isThreeDigits || isFiveDigits) {
    digits = 10;
  }

  double point = symbolInfo.Point() * digits;
  double takeProfit = takeProfitInput * point;
  double stopLoss = stopLossInput * point;

  trade.Buy(
    symbolInfo.LotsMin(),
    symbolInfo.Name(),
    symbolInfo.Ask(),
    symbolInfo.NormalizePrice(stopLoss),
    symbolInfo.NormalizePrice(takeProfit)
  );
}
