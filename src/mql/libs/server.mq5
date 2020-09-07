#include "socket.mqh"

SOCKET64 _server = INVALID_SOCKET64;
SOCKET64 _connections[];
string _host = "0.0.0.0";
ushort _port = 3333;
string _message = "";

//---
// Create server with given port.
SOCKET64 createServer(ushort port) {
  _port = port;
  return _server;
}

//--
// Timer runtime.
void serverRuntime() {
  if (isInvalidSocket(_server)) {
    startServer();
    return;
  }

  acceptClients();
  receiveMessage();
}

//--
// Accepts all client connection.
void acceptClients() {
  if (isInvalidSocket(_server)) return;

  SOCKET64 client = INVALID_SOCKET64;

  do {
    ref_sockaddr socketAddressRef;
    int len = sizeof(ref_sockaddr);

    client = accept(_server, socketAddressRef.ref, len);

    if (isInvalidSocket(client)) {
      int err = WSAGetLastError();
      if(err == WSAEWOULDBLOCK) {
        Comment("\nWAITING CLIENT ("+ string(TimeCurrent()) +")");
      } else {
        destroyServer("Client socket error: " + getLastSocketErrorMessage());
      }

      return;
    }

    int response = enableSocketNonBlockMode(client);
    if (response != NO_ERROR) {
      Print("Client socket error: ", string(response));
      continue;
    }

    // Add client to connections list.
    int connSize = ArraySize(_connections);
    ArrayResize(_connections, connSize + 1);
    _connections[connSize] = client;

    // Show client info.
    char ipAddresses[23] = {0};
    ref_sockaddr_in clientAddress;
    clientAddress.in = socketAddressRef.in;
    inet_ntop(clientAddress.in.sin_family, clientAddress.ref, ipAddresses, sizeof(ipAddresses));
    printf("Accept new client %s : %d", CharArrayToString(ipAddresses), ntohs(clientAddress.in.sin_port));
  } while(!isInvalidSocket(client));
}

//---
// Start server.
SOCKET64 startServer() {
  string messages[] = {
    "Server error on startup: ",
    "Create server on port: ",
    "Server error on create: ",
    "Server error on listening: ",
    "Server started, listen port: "
  };

  char data[];
  ArrayResize(data, sizeof(data));

  // Startup.
  int response = WSAStartup(MAKEWORD(2, 2), data);
  if (response != 0) {
    Print(messages[0], string(response));
    return INVALID_SOCKET64;
  }

  // Validate socket.
  _server = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
  if (isInvalidSocket(_server)) {
    Print(messages[2], getLastSocketErrorMessage());
    cleanupConnections();
    return INVALID_SOCKET64;
  }

  // Bind server address in specified port
  Print(messages[1], string(_port));
  char channels[];
  StringToCharArray(_host, channels);

  // Register socket.
  sockaddr_in socketAddress;
  socketAddress.sin_family = AF_INET;
  socketAddress.sin_addr.u.S_addr = inet_addr(channels);
  socketAddress.sin_port = htons(_port);

  // Create ref from registered socket.
  ref_sockaddr socketAddressRef;
  socketAddressRef.in= socketAddress;

  int addressBinder = bind(_server, socketAddressRef.ref, sizeof(socketAddress));
  if (isSocketError(addressBinder)) {
    int err = WSAGetLastError();
    if (err != WSAEISCONN) {
      return destroyServer(messages[2]);
    }
  }

  // Enable Non-blocking Mode.
  response = enableSocketNonBlockMode(_server);
  if (response != NO_ERROR) {
    return destroyServer(messages[3]);
  }

  // Start server listener.
  int listener = listen(_server, SOMAXCONN);
  if (isSocketError(listener)) {
    return destroyServer(messages[3]);
  }

  // Success!!
  Print(messages[4], string(_port));
  return _server;
}

//--
// Destroy server by killing all connections
SOCKET64 destroyServer(string message) {
  if (message != "") {
    Print(message, getLastSocketErrorMessage());
  }

  if(!isInvalidSocket(_server)) {
    closesocket(_server);
    _server = INVALID_SOCKET64;
    return _server;
  }

  cleanupConnections();
  return INVALID_SOCKET64;
}

//--
// Cleanup all connections.
void cleanupConnections() {
  for (int i = ArraySize(_connections) - 1; i>= 0; --i) {
    closeConnection(_connections[i]);
  }
  ArrayResize(_connections,0);
  WSACleanup();
}

//--
// Close connection
void closeConnection(SOCKET64 &socket) {
  if (isInvalidSocket(socket)) return;

  if (isSocketError(shutdown(socket, SD_BOTH))) {
    Print("Server error: ", getLastSocketErrorMessage());
  }

  closesocket(socket);
  socket = INVALID_SOCKET64;
}

//--
// Post message to clients
void postMessage(string content) {
  char messages[];
  StringToCharArray(content, messages, 0, StringLen(content));

  int buffCount = ArraySize(messages);
  int connSize = ArraySize(_connections);

  for (int i = connSize - 1; i >= 0; --i) {
    if (isInvalidSocket(_connections[i])) {
      continue;
    }

    int response = send(_connections[i], messages, buffCount, 0);
    if (isSocketError(response)) {
      Print("Post message error: ", getLastSocketErrorMessage());
      closeConnection(_connections[i]);
    }
  }
}

//--
// Receive message from clients
void receiveMessage() {
  if(isInvalidSocket(_server)) {
    return;
  }

  char buff[1024];
  int buffsize = 1024;
  int r = 0;
  int response = 0;

  do {
    response = recv(_server, buff, buffsize, 0);

    if (response < 0) {
      int err = WSAGetLastError();
      if (err != WSAEWOULDBLOCK) {
        return destroyServer("Server error on message: ");
      }
      break;
    }

    if (response == 0 && r == 0) {
      return destroyServer("Server error on message: ");
    }

    r += response;
    _message = CharArrayToString(response);
  } while(response > 0 && response >= buffsize);
}

string getClientMessage() {
  return _message;
}

string getLastSocketErrorMessage() {
  return WSAErrorDescript(WSAGetLastError());
}

bool isInvalidSocket(SOCKET64 socket) {
  return socket == INVALID_SOCKET64;
}

bool isSocketError(int op) {
  return op == SOCKET_ERROR;
}

int enableSocketNonBlockMode(SOCKET64 socket) {
  int nonblock = 1;
  return ioctlsocket(socket, (int)FIONBIO, nonblock);
}

//--
// Step server by killing timers.
void stopServer(SOCKET64 &liveserver) {
  liveserver = destroyServer("");
  Print("Stop server on port: ", string(_port));
  EventKillTimer();
}
