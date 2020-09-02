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
#include "libs/tick.mq5"

//----
// Input params

//----
// Global variables

// Initialization
int OnInit() {
  Print("Start ", pkgName, " ", "v", pkgVersion);
  return INIT_SUCCEEDED;
}

// On Start
// void OnStart() {
//   int fileHandler = FileHandle("data.txt");
//   WriteFile(fileHandler, "testing");
// }

// On Tick
void OnTick() {
  string tickInfo = currentTick();
  WriteFile("tick.txt", tickInfo);
}
