import net from 'net';

type onMessageCallback = (data: string) => void;

class SocketClient {
  client: net.Socket;
  onMessageCallbackList: onMessageCallback[] = [];

  constructor(port: number = 3333) {
    this.client = new net.Socket();

    this.client.connect(port, () => {
      console.log(`Connected to socket port ${port}`);
    });

    this.client.on('data', (data: string) => {
      for (const fn of this.onMessageCallbackList) {
        fn(data.toString().trim());
      }
    });

    this.client.on('close', () => {
      console.log('Connection closed');
    });
  }

  onmessage(fn: onMessageCallback) {
    this.onMessageCallbackList.push(fn);
  }
}

export default SocketClient;
