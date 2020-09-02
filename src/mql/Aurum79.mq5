//---
// Aurum is Gold in Latin
//---
#define pkgName "Aurum79"
#define pkgVersion "1.00"
#define pkgDescription "Reinforcement learning trading bot, it's fun and makes you rich"
#define pkgCopyright "Copyright 2020, Ribhararnus Pracutian."
#property version pkgVersion
#property description pkgDescription
#property copyright pkgCopyright

// Input params
input FileSelectDialog dataDirectory ".//data.txt"

// Import files
#include "libs/fs.mq5"

// Vars init
int fileHandler;

// Initialization
int OnInit() {
  Print("Start ", pkgName, pkgVersion);
  fileHandler = FileHandle(".//data.txt");
  WriteFile(fileHandler, "testing");
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
