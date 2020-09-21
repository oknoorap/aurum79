import net from 'net';

type onMessageCallback = (data: string) => void;

export enum MessageType {
  Tick = 'tick',
}
class SocketClient {
  client: net.Socket;
  isConnected: boolean = false;
  onMessageCallbackList: onMessageCallback[] = [];
  data: string = '';

  constructor(
    port: string | number = (process.env.PORT as string) || 3333,
    host: string = (process.env.HOST as string) || '0.0.0.0'
  ) {
    const socket = new net.Socket();

    socket.connect(parseInt(port.toString()), host, () => {
      this.isConnected = true;
      console.log(`Connected to socket port ${port}`);
    });

    socket.on('data', (data: string) => {
      // Buffering until json is valid
      let index = 0;
      while (this.data[index] !== undefined) {
        try {
          const json = this.data.substring(0, index);
          JSON.parse(json);
          for (const onMessage of this.onMessageCallbackList) {
            onMessage(json);
          }
          this.data = this.data.substring(index, this.data.length);
        } catch {
          index++;
        }
      }
      this.data += data;
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
