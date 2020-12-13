import net from 'net';
import waitPort from 'wait-port';

type onMessageCallback = (data: string) => void;
type onConnectedCallback = () => void;
type onClientStartCallback = () => Promise<void>;

export enum ReceivedMessage {
  Tick = 'tick',
  Result = 'result',
}

export enum SendMessage {
  Buy = 'buy',
  Sell = 'sell',
}

type SocketClientOptions = {
  port?: string | number;
  host?: string;
};

class SocketClient {
  client: net.Socket;
  port: number;
  host: string;
  isConnected: boolean = false;
  onMessageCallbackList: onMessageCallback[] = [];
  onConnectedCallbackList: onConnectedCallback[] = [];
  data: string = '';

  constructor(options?: SocketClientOptions) {
    const port = <string>process.env.PORT || (options?.port ?? 3333);
    this.port = parseInt(<string>port);

    const host = <string>process.env.HOST || (options?.host ?? '0.0.0.0');
    this.host = host;

    this.client = new net.Socket();

    // Connect to socket server,
    // until port available
    console.log('---');
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

  /**
   * Connect to socket server.
   */
  connect() {
    this.client.connect(parseInt(this.port.toString()), this.host, () => {
      this.isConnected = true;
      console.log(`Connected to socket: ${this.host}:${this.port}`);
    });

    /**
     * On connected callback.s
     */
    this.client.once('connect', () => {
      for (const onConnected of this.onConnectedCallbackList) {
        onConnected();
      }
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

    /**
     * On socket error.
     */
    this.client.on('error', err => {
      console.log('Error', err.name, err.message);
    });
  }

  /**
   * On receiving mssage callback listener,
   * We can have multiple callbacks here.
   */
  onconnected(fn: onConnectedCallback) {
    this.onConnectedCallbackList.push(fn);
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
