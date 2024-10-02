import net from "node:net";
import WebSocket, { WebSocketServer } from "ws";

interface TctProxyServerProps {
  TCP_SERVER_HOST: string;
  TCP_SERVER_PORT: number;
  WEBSOCKET_PORT: number;
}

class TcpProxyServer {
  private wss: WebSocketServer;
  private host!: string;
  private tcpPort!: number;
  private wsPort!: number;

  constructor({
    TCP_SERVER_HOST,
    TCP_SERVER_PORT,
    WEBSOCKET_PORT,
  }: TctProxyServerProps) {
    this.host = TCP_SERVER_HOST;
    this.tcpPort = TCP_SERVER_PORT;
    this.wsPort = WEBSOCKET_PORT;

    this.wss = new WebSocketServer({ port: this.wsPort });
    this.wss.on("connection", this.handleWsConnection.bind(this));
    console.log(`WebSocket server listening on port ${this.wsPort}`);
  }

  private handleWsConnection(ws: WebSocket) {
    console.log("WebSocket client connected");
    const tcpClient = new net.Socket();

    tcpClient.connect(this.tcpPort, this.host, () => {
      console.log(`Connected to TCP server at ${this.host}:${this.tcpPort}`);
    });

    tcpClient.on("data", (data) => {
      console.log(`Received data from TCP server: ${data}`);
      ws.send(data.toString());
    });

    tcpClient.on("close", () => {
      console.log("Connection to TCP server closed");
      ws.close();
    });

    tcpClient.on("error", (err) => {
      console.error(`TCP client error: ${err.message}`);
      ws.close();
    });

    ws.on("message", (message) => {
      console.log(`Received message from WebSocket client: ${message}`);

      let buffer: Buffer;

      if (typeof message === "string") {
        buffer = Buffer.from(message);
      } else if (message instanceof ArrayBuffer) {
        buffer = Buffer.from(message);
      } else if (Buffer.isBuffer(message)) {
        buffer = message;
      } else {
        console.error("Unsupported message type");
        return;
      }

      tcpClient.write(buffer);
    });

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
      tcpClient.end();
    });

    ws.on("error", (err) => {
      console.error(`WebSocket client error: ${err.message}`);
      tcpClient.end();
    });
  }
}

export default TcpProxyServer;
