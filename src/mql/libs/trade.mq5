#include <Trade\Trade.mqh>
#include <Trade\SymbolInfo.mqh>

CTrade trade;
CSymbolInfo symbolInfo;

enum OrderAction {
  OrderActionBuy,
  OrderActionSell,
  OrderActionIdle
};

enum OrderPosition {
  OrderPositionInit,
  OrderPositionOpen,
  OrderPositionClose,
  OrderPositionTrading
};

struct Order {
  double price;
  ulong ticketId;
  OrderAction action;
};

struct OrderStatus {
  ulong id;
  OrderAction action;
  OrderPosition position;
  double price;
  double closePrice;
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
    return order;
  }

  order.ticketId = 0;
  order.price = 0;
  return order;
}

void resetOrderStatus(OrderStatus &orderStatus) {
  orderStatus.id = 0;
  orderStatus.action = OrderActionIdle;
  orderStatus.position = OrderPositionInit;
  orderStatus.price = 0;
  orderStatus.closePrice = 0;
}

void setOrderPosition(OrderStatus &orderStatus, OrderPosition position) {
  orderStatus.position = position;
}

void updateOrderStatus(const MqlTradeTransaction &tx, OrderStatus &orderStatus) {
  if (
    tx.type == TRADE_TRANSACTION_DEAL_ADD &&
    tx.deal > 0 &&
    tx.order > 0 &&
    tx.price > 0
  ) {
    if (
      orderStatus.position == OrderPositionInit &&
      tx.order == tx.position
    ) {
      orderStatus.position = OrderPositionOpen;
      orderStatus.price = tx.price;
    }

    if (
     orderStatus.position == OrderPositionTrading &&
     tx.order != tx.position &&
     tx.position == orderStatus.id
    ) {
      orderStatus.position = OrderPositionClose;
      orderStatus.closePrice = tx.price;
    }
  }

  if (tx.type == TRADE_TRANSACTION_HISTORY_ADD && tx.order_state == ORDER_STATE_FILLED) {
    orderStatus.id = tx.order;
    
    if (tx.order_type == ORDER_TYPE_BUY) {
      orderStatus.action = OrderActionBuy;
    }

    if (tx.order_type == ORDER_TYPE_SELL) {
      orderStatus.action = OrderActionSell;
    }
  }
}

bool isOrderOpened(OrderStatus &orderStatus) {
  return orderStatus.action != OrderActionIdle && orderStatus.position == OrderPositionOpen;
}

bool isOrderClosed(OrderStatus &orderStatus) {
  return orderStatus.action != OrderActionIdle && orderStatus.position == OrderPositionClose;
}

bool tradeResult(OrderStatus &orderStatus) {
  if (orderStatus.action == OrderActionBuy) {
    return orderStatus.closePrice > orderStatus.price;
  }
  
  if (orderStatus.action == OrderActionSell) {
    return orderStatus.closePrice < orderStatus.price;
  }
  
  return false;
}
