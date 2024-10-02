import net, { Socket } from "node:net";
import { IPgHandler } from "../data/instances";
import fs from "node:fs";
import pc from "picocolors";

export default class LoggerServer {
  host!: string;
  port!: number;
  pathFile!: string;
  clients: Set<Socket> = new Set();

  constructor({ host, port, pathFile }: ConstructorProps) {
    this.host = host;
    this.port = port;
    this.pathFile = pathFile;
  }

  listen() {
    this.sayListen();

    return net
      .createServer((socket: Socket) => {
        const IP_CONNECTED = `${socket.remoteAddress}:${socket.remotePort}`;
        this.clients.add(socket);

        this.socketConnect(IP_CONNECTED);

        socket.on(EVENTS.DATA, (data: any) => {
          this.dataManager({ data, IP_CONNECTED });
        });

        socket.on(EVENTS.CLOSE, (_data: any) => {
          this.dataClose(socket);
          this.clients.delete(socket);
        });

        socket.on(EVENTS.ERROR, this.errorManager);
      })
      .listen(this.port, this.host);
  }

  private broadcast(_event: string, data: any) {
    for (const client of this.clients) {
      client.write(data);
    }
  }

  private sayListen = () => {
    console.log(
      pc.bgBlack(pc.white(`Esperando respuestas en ${this.host}:${this.port}`))
    );
  };

  private socketConnect = (IP_CONNECTED: string) =>
    console.log(`Se conecto el equipo desde ${IP_CONNECTED}`);

  private dataManager = ({
    data,
    IP_CONNECTED,
  }: {
    data: string;
    IP_CONNECTED: string;
  }) => {
    // Aquí primero debo obtener la información que viene ^
    console.log(`Esta es tu data: ${data}`);
    const parsedData = data.toString().split("^");

    console.log(parsedData);

    // Luego de eso, debo identificar las partes del array, que deben ser 4
    const objData = {
      init: parsedData[0],
      command: parsedData[1],
      data: parsedData[2],
      fin: parsedData[3],
    };

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
    this.broadcast(EVENTS.REALTIME, JSON.stringify(objSave));

    if (objData.command === "sv") {
      const onlySring = `${log} ${date} ${IP_CONNECTED} ${module} `;
      this.addToTxt(onlySring);
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
  port: number;
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
