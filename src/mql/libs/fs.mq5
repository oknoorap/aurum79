int FileHandle(string path) {
  int handler = FileOpen(path, FILE_READ|FILE_WRITE|FILE_TXT|FILE_COMMON);
  return handler;
}

void WriteFile(int handler, string content) {
  if (handler != INVALID_HANDLE) {
    FileWriteString(handler, content);
  }
}
