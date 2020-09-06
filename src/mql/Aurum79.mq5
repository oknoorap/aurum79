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

//----
// Global variables
// Server stuff.
SOCKET64 server = INVALID_SOCKET64;
// Chart stuff.
string ratesHistory;
string latestTick;
string clientMessage;
// Order stuff.
bool isOrder = false;

// Initialization
// Start server on port 3333.
int OnInit() {
  server = createServer(3333);
  EventSetTimer(1);
  return INIT_SUCCEEDED;
}

// Start timer
void OnTimer() {
  serverRuntime(clientMessage);

  if (!isOrder) {
    if (latestClientMessage == "buy") {
      Print("buy right now");
    }
    if (latestClientMessage == "sell") {
      Print("sell right now");
    }
  }
}

// Deinitialize
// Stop server and close all connections.
void OnDeinit(const int reason) {
  stopServer(server);
}

// On Tick
void OnTick() {
  // Send data to client.
  ratesHistory = getRatesHistory();
  latestTick = currentTick();
  postMessage(StringFormat("[%s, %s]", latestTick, ratesHistory));
}
