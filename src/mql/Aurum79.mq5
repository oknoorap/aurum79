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
SOCKET64 server = INVALID_SOCKET64;

// Initialization
// Start server on port 3333.
int OnInit() {
  server = createServer(3333, "Start ", pkgName, " ", "v", pkgVersion);
  return INIT_SUCCEEDED;
}

// Deinitialize
// Stop server and close all connections.
void OnDeinit(const int reason) {
  stopServer(server);
}

// On Tick
void OnTick() {
  // WriteFile(
  //   "tick-data.txt",
  //   StringFormat(
  //     "%s %s",
  //     currentTick(),
  //     getRatesHistory()
  //   )
  // );
}
