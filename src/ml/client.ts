import net from 'net';
import waitPort from 'wait-port';

type onMessageCallback = (data: string) => void;

export enum ReceivedMessage {
  Tick = 'tick',
  Result = 'result',
}

export enum SendMessage {
  Buy = 'buy',
  Sell = 'sell',
}

class SocketClient {
  client: net.Socket;
  port: number;
  host: string;
  isConnected: boolean = false;
  onMessageCallbackList: onMessageCallback[] = [];
  data: string = '';

  constructor(
    port: string | number = (process.env.PORT as string) || 3333,
    host: string = (process.env.HOST as string) || '0.0.0.0'
  ) {
    this.port = parseInt(port as string);

    this.host = host;

    this.client = new net.Socket();

    // Connect to socket server,
    // until port available
    waitPort({
      port: this.port,
      host: this.host,
    })
      .then(open => {
        if (open) {
          this.connect();
        } else {
          console.log(`Timeout when connecting to ${host}:${port}`);
        }
      })
      .catch(err => {
        console.error(err.message);
      });
  }

  connect() {
    /**
     * Connect to socket server.
     */
    this.client.connect(parseInt(this.port.toString()), this.host, () => {
      this.isConnected = true;
      console.log(`Connected to socket: ${this.host}:${this.port}`);
    });

    /**
     * On receiving data from socket server.
     */
    this.client.on('data', (data: string) => {
      let index = 0;

      // Buffering only when json is valid
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

    /**
     * On socket closed.
     */
    this.client.on('close', () => {
      this.isConnected = false;
      console.log('Connection closed');
    });
  }

  /**
   * On receiving mssage callback listener,
   * We can have multiple callbacks here.
   */
  onmessage(fn: onMessageCallback) {
    this.onMessageCallbackList.push(fn);
  }

  /**
   * Post message to socket server.
   */
  postMessage(message: string) {
    if (this.isConnected) {
      this.client.write(message);
    }
  }
}

export default SocketClient;
