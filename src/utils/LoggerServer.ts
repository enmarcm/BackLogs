import net, { Socket } from "node:net";
import { IPgHandler } from "../data/instances";
import fs from "node:fs";
import dgram from "node:dgram";
import pc from "picocolors";

export default class LoggerServer {
  host!: string;
  portTCP!: number;
  portUDP!: number;
  pathFile!: string;
  clients: Set<Socket> = new Set();
  udpClients: Set<string> = new Set();
  udpServer!: dgram.Socket;

  constructor({ host, portTCP, portUDP, pathFile }: ConstructorProps) {
    this.host = host;
    this.portTCP = portTCP;
    this.portUDP = portUDP;
    this.pathFile = pathFile;
    this.udpServer = dgram.createSocket("udp4");
  }

  listen() {
    this.sayListen();

    net
      .createServer((socket: Socket) => {
        const IP_CONNECTED = `${socket.remoteAddress}:${socket.remotePort}`;
        this.clients.add(socket);

        this.socketConnect(IP_CONNECTED);

        socket.on(EVENTS.DATA, (data: any) => {
          this.dataManager({ data, IP_CONNECTED, protocol: "tcp" });
        });

        socket.on(EVENTS.CLOSE, (_data: any) => {
          this.dataClose(socket);
          this.clients.delete(socket);
        });

        socket.on(EVENTS.ERROR, this.errorManager);
      })
      .listen(this.portTCP, this.host);

    this.udpServer.on("listening", () => this.sayListen());
    this.udpServer.on("message", (msg, rinfo) => {
      const IP_CONNECTED = `${rinfo.address}:${rinfo.port}`;
      this.udpClients.add(IP_CONNECTED);
      console.log(`Datos recibidos por UDP: ${msg}`);
      this.dataManager({ data: msg.toString(), IP_CONNECTED, protocol: "udp" });
    });
    this.udpServer.on("error", this.errorManager);

    this.udpServer.bind(this.portUDP, this.host);
  }

  private broadcast(protocol: string, data: any) {
    const parsedData = JSON.stringify({ ...JSON.parse(data), protocol });
    console.log(parsedData);
    for (const client of this.clients) {
      client.write(parsedData);
    }
    for (const client of this.udpClients) {
      const [address, port] = client.split(":");
      this.udpServer.send(parsedData, parseInt(port), address);
    }
  }

  private sayListen = () => {
    console.log(
      pc.bgBlack(
        pc.white(
          `Esperando respuestas en ${this.host}:${this.portTCP} y ${this.portUDP}`
        )
      )
    );
  };

  private socketConnect = (IP_CONNECTED: string) =>
    console.log(`Se conecto el equipo desde ${IP_CONNECTED}`);

  private dataManager = ({
    data,
    IP_CONNECTED,
    protocol,
  }: {
    data: string;
    IP_CONNECTED: string;
    protocol: string;
  }) => {
    // Aquí primero debo obtener la información que viene ^
    console.log(`Esta es tu data: ${data}`);
    const parsedData = data.toString().split("^");

    // Luego de eso, debo identificar las partes del array, que deben ser 4
    const objData = {
      init: parsedData[0],
      command: parsedData[1],
      data: parsedData[2],
      fin: parsedData[3],
    };

    console.table({ ...objData, protocol });

    try {
      
      const dataStringParsed = JSON.parse(objData.data) as DataProps;

      const { date, module, log, typeLog } = dataStringParsed;

      const objSave = {
        typeLog,
        data: log,
        date,
        module,
        host: IP_CONNECTED,
      };

      this.saveInDB(objSave);
      this.broadcast(protocol, JSON.stringify(objSave));

      if (objData.command === "sv") {
        const onlyString = `${log} ${date} ${IP_CONNECTED} ${module} `;
        this.addToTxt(onlyString);
      }
    } catch (error) {
      console.error("Error parsing data:", error);
    }
  };

  private dataClose = (socket: Socket) => {
    console.log(`CERRADO IP: ${socket.remoteAddress}:${socket.remotePort}`);
  };

  private addToTxt(data: string): void {
    fs.appendFile(this.pathFile, `${data}\n`, (err) => {
      if (err) {
        console.error("Error escribiendo en el archivo:", err);
      } else {
        console.log("Información agregada al archivo.");
      }
    });
  }

  private async saveInDB({ typeLog, data, date, host, module }: any) {
    try {
      await IPgHandler.executeQuery({
        key: "insertLog",
        params: [typeLog, data, date, host, module],
      });
    } catch (error) {
      console.error(error);
    }
  }

  private errorManager(err: any) {
    if (err.toString().includes("ECONNRESET")) {
      console.log("Se ha desconectado un socket");
      return;
    }

    console.error(`Error ${err}`);
  }
}

interface ConstructorProps {
  host: string;
  portTCP: number;
  portUDP: number;
  pathFile: string;
}

enum EVENTS {
  DATA = "data",
  CLOSE = "close",
  ERROR = "error",
  REALTIME = "realtime",
}

type LogsType = "warning" | "debug" | "info" | "error";

interface DataProps {
  date: string;
  module: string;
  log: string;
  typeLog: LogsType;
}
