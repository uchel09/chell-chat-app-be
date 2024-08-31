import mongoose from "mongoose";
//For Production
// const dbConnection = async () => {
//   try {
//     if (mongoose.connections[0].readyState) {
//       return true;
//     }
//     await mongoose.connect(`${process.env.MONGODB_URI}`,{
//       serverSelectionTimeoutMS:30000,
//     });
//     console.log("mongodb connected");
//   } catch (err) {
//     console.log(`Error connecting to mongoose: ${err}`);
//   }
// };

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
