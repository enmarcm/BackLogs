import "dotenv/config";
import { HostConfig } from "./types";

export const PORT = Number(process.env.PORT_API) || 3030;

export const WS_PORT = Number(process.env.PORT_WEB_SOCKET) || 8080

export const Hosts: Record<string, HostConfig> = {
  gmail: {
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
  },
  outlook: {
    host: "smtp.office365.com",
    port: 587,
    secure: false,
  },
};

export const CONFIG_LOGS = {
  HOST: process.env.HOST_SERVER || "",
  UDP_PORT: Number(process.env.UDP_PORT) || 0,
  TCP_PORT:  Number(process.env.TCP_PORT) || 0,
  PATH: process.env.PATH_TXT || ""
};

// export const BASE_URL:string = process.env.BASE_URL || `http://localhost:${PORT}`;
export const BASE_URL: string =
  process.env.BASE_URL || `http://192.168.109.126:${PORT}`;
