import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const instanceConnection = await mongoose.connect(
      `${process.env.MONGO_DB_URI}`,
    );
    console.log(
      `db connected, db host : ${instanceConnection.connection.host}`,
    );
  } catch (error) {
    console.log("db could not be connected", error);
    process.exit(1);
  }
};

export default connectDB;
