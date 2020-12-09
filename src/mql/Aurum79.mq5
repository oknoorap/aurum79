//---
// Aurum is Gold in Latin
// Aurum79 v1.00
//---
#define pkgName "Aurum79"
#define pkgVersion "1.00"
#define pkgDescription "Reinforcement learning trading bot, it's fun and makes you rich"
#define pkgCopyright "Copyright 2020, Ribhararnus Pracutian."
#property version pkgVersion
#property description pkgDescription
#property copyright pkgCopyright

//---
// Import sections
#include "libs/fs.mq5"
#include "libs/chart.mq5"
#include "libs/server.mq5"
#include "libs/trade.mq5"

//----
// Global variables
// Server stuff.
SOCKET64 server = INVALID_SOCKET64;

// Chart stuff.
string clientMessage = "";
bool isSendFirstMessage = false;
Order order;
OrderStatus orderStatus;

// Initialization
// Start server on port 3333.
int OnInit() {
  server = createServer(3333);
  order.action = OrderActionIdle;
  resetOrderStatus(orderStatus);
  EventSetMillisecondTimer(100);
  return INIT_SUCCEEDED;
}

// Deinitialize
// Stop server and close all connections.
void OnDeinit(const int reason) {
  stopServer(server);
}

// Start timer
void OnTimer() {
  serverRuntime(clientMessage);

  if (clientMessage != "") {
    JSON json;
    json.Deserialize(clientMessage);

    string action = json["action"].ToStr();

    if (order.action == OrderActionIdle) {
      if (action == "buy") {
        order = buyOrder(1, 5);
      }

      if (action == "sell") {
        order = sellOrder(1, 5);
      }
    }
  }
}

// On transactions
void OnTradeTransaction(
  const MqlTradeTransaction &tx,
  const MqlTradeRequest &req,
  const MqlTradeResult &res
) {
  updateOrderStatus(tx, orderStatus);

  if (isOrderOpened(orderStatus)) {
    setOrderPosition(orderStatus, OrderPositionTrading);
  }

  if (isOrderClosed(orderStatus)) {
    JSON json;
    json["type"] = "result";

    // profit or loss
    bool result = tradeResult(orderStatus);
    json["result"] = result;

    JSON data;
    data["action"] = orderStatus.action == OrderActionBuy ? "buy" : "sell";
    data["price"] = orderStatus.price;
    data["closedPrice"] = orderStatus.closePrice;
    json["data"].Set(data);

    postMessage(json.Serialize());
    resetOrderStatus(orderStatus);
  }
}


// On Tick
void OnTick() {
  // Send data to client.
  JSON json;
  json["type"] = "tick";
  json["tick"].Set(currentTick());
  json["history"].Set(getRatesHistory());

  postMessage(json.Serialize());
}
