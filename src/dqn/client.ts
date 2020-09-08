import net from 'net';

type onMessageCallback = (data: string) => void;

export enum MessageType {
  Tick = 'tick',
}
class SocketClient {
  client: net.Socket;
  isConnected: boolean = false;
  onMessageCallbackList: onMessageCallback[] = [];

  constructor(port: number = 3333, host: string = '0.0.0.0') {
    const socket = new net.Socket();

    socket.connect(port, host, () => {
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
