import mongoose from "mongoose";

const dbConnection = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB
    );

    console.log("Connected successfully to mongoose server");
  } catch (err) {
    console.log(`Error connecting to mongoose: ${err}`);
  }
};

export default dbConnection;
