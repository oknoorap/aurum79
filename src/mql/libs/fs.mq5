void WriteFile(string path, string content) {
  int handler = FileOpen(path, FILE_READ|FILE_WRITE|FILE_TXT|FILE_COMMON|FILE_SHARE_READ);
  if (handler != INVALID_HANDLE) {
    FileSeek(handler, 0, SEEK_SET);
    FileWriteString(handler, content);
    FileClose(handler);
  }
}
