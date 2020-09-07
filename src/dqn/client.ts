import net from 'net';

type onMessageCallback = (data: string) => void;

class SocketClient {
  client: net.Socket;
  isConnected: boolean = false;
  onMessageCallbackList: onMessageCallback[] = [];

  constructor(port: number = 3333) {
    const socket = new net.Socket();

    socket.connect(port, () => {
      this.isConnected = true;
      console.log(`Connected to socket port ${port}`);
    });

    socket.on('data', (data: string) => {
      for (const fn of this.onMessageCallbackList) {
        fn(data.toString().trim());
      }
    });

    socket.on('close', () => {
      this.isConnected = false;
      console.log('Connection closed');
    });

    this.client = socket;
  }

  onmessage(fn: onMessageCallback) {
    this.onMessageCallbackList.push(fn);
  }

  postMessage(message: string) {
    if (this.isConnected) {
      this.client.write(message);
    }
  }
}

export default SocketClient;
