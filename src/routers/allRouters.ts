import { Router } from "express";
import { IPgHandler } from "../data/instances";

export const MainRouter = Router();

MainRouter.get("/warnings", async (_req, res) => {
  const data = await IPgHandler.executeQuery({ key: "selectByWarning" });
  return res.json(data);
});

MainRouter.get("/errors", async (_req, res) => {
  const data = await IPgHandler.executeQuery({ key: "selectByError" });
  return res.json(data);
});

MainRouter.get("/debugs", async (_req, res) => {
  const data = await IPgHandler.executeQuery({ key: "selectByDebug" });
  return res.json(data);
});

MainRouter.get("/info", async (_req, res) => {
  const data = await IPgHandler.executeQuery({ key: "selectByInfo" });
  return res.json(data);
});

MainRouter.get("/date/:date", async (req, res) => {
  const date = req.params.date;

  const data = await IPgHandler.executeQuery({
    key: "selectByDate",
    params: [date],
  });
  return res.json(data);
});
