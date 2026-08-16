import app from "../app.js";
import connectDB from "../db/index.js";

let dbConnected = false;

export default async function handler(req: any, res: any) {
  if (!dbConnected) {
    await connectDB();
    dbConnected = true;
  }

  return app(req, res);
}