import mongoose from "mongoose";

const dbConnection = async () => {
  try {
    if (mongoose.connections[0].readyState) {
      return true;
    }
    await mongoose.connect(`${process.env.MONGODB_URI}`,{
      serverSelectionTimeoutMS:30000,
    });
    console.log("mongodb connected");
  } catch (err) {
    console.log(`Error connecting to mongoose: ${err}`);
  }
};

export default dbConnection;
