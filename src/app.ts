import { CONFIG_LOGS, WS_PORT } from "./constants";
import LoggerServer from "./utils/LoggerServer";
import TcpProxyServer from "./utils/TcpProxyServer";
import express from "express";
import { startServer } from "./functions";
import {
  midCors,
  midJson,
  midNotFound,
  midNotJson,
  midValidJson,
} from "./middlewares/middlewares";
import { PORT } from "./constants";
import { MainRouter } from "./routers/allRouters";

const app = express();

//{ Middlewares
app.use(midJson());
app.use(midValidJson);
app.use(midCors());
app.use(midNotJson);

app.use("/", MainRouter);

app.use(midNotFound);

new LoggerServer({
  host: CONFIG_LOGS.HOST,
  portUDP: CONFIG_LOGS.UDP_PORT,
  portTCP: CONFIG_LOGS.TCP_PORT,
  pathFile: CONFIG_LOGS.PATH,
}).listen();

new TcpProxyServer({
  TCP_SERVER_HOST: CONFIG_LOGS.HOST,
  TCP_SERVER_PORT: CONFIG_LOGS.TCP_PORT,
  WEBSOCKET_PORT: WS_PORT,
  UDP_SERVER_PORT: CONFIG_LOGS.UDP_PORT,
});

startServer({ app, PORT });
