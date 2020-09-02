int FileHandle(string path) {
  int handler = FileOpen(path, FILE_READ|FILE_WRITE|FILE_TXT|FILE_SHARE_READ|FILE_SHARE_WRITE);
  return handler;
}

void WriteFile(int handler, string content) {
  if (handler != INVALID_HANDLE) {
    FileWriteString(handler, content);
  }
}
