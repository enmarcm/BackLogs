import "dotenv/config";
import MailerConfigJson from "./jsons/mailerConfig.json";
import Mailer from "../utils/Mailer";
import { MailerConfig } from "../types";
import PgHandler from "../utils/PgHandler";
import querys from "./jsons/querys.json";
import configPgHandler  from "./jsons/configPgHandler.json";

export const INodeMailer = new Mailer({
  config: MailerConfigJson as MailerConfig,
});

console.log(querys["insertLog"])

export const IPgHandler = new PgHandler({ config: configPgHandler, querys });
