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

startServer({ app, PORT });

new LoggerServer({
  host: CONFIG_LOGS.HOST,
  port: CONFIG_LOGS.PORT,
  pathFile: CONFIG_LOGS.PATH,
}).listen();

new TcpProxyServer({
  TCP_SERVER_HOST: CONFIG_LOGS.HOST,
  TCP_SERVER_PORT: CONFIG_LOGS.PORT,
  WEBSOCKET_PORT: WS_PORT,
});
