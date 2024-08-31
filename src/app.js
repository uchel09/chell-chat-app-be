import express from "express";
import dotenv from "dotenv";
import dbConnection from "./config/dbConnection.js";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import allRoutes from "./routes/index.js";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";
// socket
import { Server } from "socket.io";
import http from "http";
import SocketServer from "./socketServer.js";

dotenv.config();
dbConnection();
const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    credentials: true,
  },
});
io.on("connection", (socket) => {
  SocketServer(socket);
});

app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json());
app.use(cookieParser());

const allowedOrigins = [`${process.env.ORIGINS}`];
const PORT = process.env.PORT || 8000;

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", allowedOrigins);
  res.setHeader("Access-Control-Allow-Methods", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  // res.header("Referrer-Policy", "no-referrer-when-downgrade");

  next();
});

allRoutes(app);

app.use(errorMiddleware);

server.listen(PORT, () => {
  console.log(`Server is running on port `, PORT);
});
