int FileHandle(string path) {
  int handler = FileOpen(path, FILE_WRITE|FILE_TXT|FILE_COMMON|FILE_SHARE_READ);
  return handler;
}

void WriteFile(int handler, string content) {
  if (handler != INVALID_HANDLE) {
    FileWriteString(handler, content);
    FileFlush(handler);
  }
}
