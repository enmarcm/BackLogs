import net from "node:net";
import dgram from "node:dgram";
import WebSocket, { WebSocketServer } from "ws";

interface TctProxyServerProps {
  TCP_SERVER_HOST: string;
  TCP_SERVER_PORT: number;
  UDP_SERVER_PORT: number;
  WEBSOCKET_PORT: number;
}

class TcpProxyServer {
  private wss: WebSocketServer;
  private host!: string;
  private tcpPort!: number;
  private udpPort!: number;
  private wsPort!: number;
  private udpClient: dgram.Socket;

  constructor({
    TCP_SERVER_HOST,
    TCP_SERVER_PORT,
    UDP_SERVER_PORT,
    WEBSOCKET_PORT,
  }: TctProxyServerProps) {
    this.host = TCP_SERVER_HOST;
    this.tcpPort = TCP_SERVER_PORT;
    this.udpPort = UDP_SERVER_PORT;
    this.wsPort = WEBSOCKET_PORT;

    this.udpClient = dgram.createSocket("udp4");

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
      const message = JSON.stringify({
        protocol: "tcp",
        data: data.toString(),
      });
      ws.send(message);
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

      let parsedMessage;
      try {
        parsedMessage = JSON.parse(message.toString());
      } catch (err) {
        console.error("Invalid message format");
        return;
      }

      const { protocol, data } = parsedMessage;
      const buffer = Buffer.from(data);

      if (protocol === "tcp") {
        tcpClient.write(buffer);
      } else if (protocol === "udp") {
        this.udpClient.send(buffer, this.udpPort, this.host, (err) => {
          if (err) {
            console.error(`UDP client error: ${err.message}`);
          }
        });
      } else {
        console.error("Unsupported protocol");
      }
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
