#include <Trade\Trade.mqh>
#include <Trade\SymbolInfo.mqh>

CTrade trade;
CSymbolInfo symbolInfo;

enum OrderAction {
  OrderActionBuy,
  OrderActionSell,
  OrderActionIdle
};

struct Order {
  double price;
  ulong ticketId;
  OrderAction action;
};

bool sendOrder(OrderAction action, ushort takeProfitInput, ushort stopLossInput) {
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

  double orderAction = (action == OrderActionBuy) ? symbolInfo.Ask() : symbolInfo.Bid();
  double point = symbolInfo.Point() * digits;
  
  double takeProfitPoint = takeProfitInput * point;
  double takeProfitValue = (action == OrderActionBuy) ? orderAction + takeProfitPoint : orderAction - takeProfitPoint;
  double takeProfit = (takeProfitPoint == 0.0) ? 0.0 : takeProfitValue;

  double stopLossPoint = stopLossInput * point;
  double stopLossValue  = (action == OrderActionBuy) ? orderAction - stopLossPoint : orderAction + stopLossPoint;
  double stopLoss = (stopLossPoint == 0.0) ? 0.0 : stopLossValue;

  if (action == OrderActionBuy) {
    return trade.Buy(
      symbolInfo.LotsMin(),
      symbolInfo.Name(),
      orderAction,
      symbolInfo.NormalizePrice(stopLoss),
      symbolInfo.NormalizePrice(takeProfit)
    );
  }

  return trade.Sell(
    symbolInfo.LotsMin(),
    symbolInfo.Name(),
    orderAction,
    symbolInfo.NormalizePrice(stopLoss),
    symbolInfo.NormalizePrice(takeProfit)
  );
}

Order buyOrder(ushort takeProfitInput, ushort stopLossInput) {
  Order order;
  order.action = OrderActionBuy;

  if (sendOrder(order.action, takeProfitInput, stopLossInput)) {
    order.ticketId = trade.ResultOrder();
    order.price = symbolInfo.Ask();
    Print("Buy @", order.price);
    return order;
  }

  order.ticketId = 0;
  order.price = 0;
  return order;
}

Order sellOrder(ushort takeProfitInput, ushort stopLossInput) {
  Order order;
  order.action = OrderActionSell;

  if (sendOrder(order.action, takeProfitInput, stopLossInput)) {
    order.ticketId = trade.ResultOrder();
    order.price = symbolInfo.Bid();
    Print("Sell @", order.price);
    return order;
  }

  order.ticketId = 0;
  order.price = 0;
  return order;
}

bool isCloseOrder(const MqlTradeTransaction &tx) {
  if (tx.type != TRADE_TRANSACTION_HISTORY_ADD) {
    return false;
  }
  
  if (tx.order_state != ORDER_STATE_FILLED) {
    return false;
  }
  
  if (tx.price == 0.0) {
    return false;
  }

  return true;
}

ulong tradeResult(const MqlTradeTransaction &tx, Order &order) {
  bool status;

  if (tx.deal_type == DEAL_TYPE_BUY && order.action == OrderActionBuy) {
    status = tx.price > order.price;
  }
  
  if (tx.deal_type == DEAL_TYPE_SELL && order.action == OrderActionSell) {
    status = tx.price < order.price;
  }
  
  return status;
}
