import mongoose from "mongoose";

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log("MongoDB already connected");
      return;
    }

    const mongoURI = process.env.MONGO_DB_URI;

    if (!mongoURI) {
      throw new Error("MONGO_DB_URI is missing");
    }

    const connection = await mongoose.connect(mongoURI);

    console.log(
      `db connected, db host : ${connection.connection.host}`,
    );

  } catch (error) {
    console.error("db could not be connected:", error);

    throw error;
  }
};

export default connectDB;