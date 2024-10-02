import "dotenv/config";
import { HostConfig } from "./types";

export const PORT = Number(process.env.PORT) || 3000;

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
  PORT: Number(process.env.PORT_SERVER) || 0,
  PATH: process.env.PATH_TXT || ""
};

// export const BASE_URL:string = process.env.BASE_URL || `http://localhost:${PORT}`;
export const BASE_URL: string =
  process.env.BASE_URL || `http://192.168.109.126:${PORT}`;
