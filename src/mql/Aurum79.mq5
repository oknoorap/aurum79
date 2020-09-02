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

//----
// Input params
input string TickDataDirectory;

//----
// Global variables
int fileHandler;

// Initialization
int OnInit() {
  Print("Start ", pkgName, pkgVersion);
  
  string tickPath = "C:\\tick.txt";
  fileHandler = FileHandle(tickPath);
  WriteFile(fileHandler, "testing");
  Print("Write file to", tickPath);
  return INIT_SUCCEEDED;
}

// On Start
// void OnStart() {
//   int fileHandler = FileHandle("data.txt");
//   WriteFile(fileHandler, "testing");
// }

// On Tick
void OnTick() {
  datetime currentTime = iTime(_Symbol, _Period, 0);
  Print(currentTime);
}
