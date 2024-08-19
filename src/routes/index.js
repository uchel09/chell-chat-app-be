import userAuth from "../middlewares/authMiddleware.js";
import authRouter from "./auth.js";
import conversationRouter from "./conversation.js";
import friendRequestRouter from "./friendRequest.js";
import userRouter from "./user.js";

const allRoutes = (app) => {
  app.use("/api", authRouter);
  app.use("/api/v1/friend-request", userAuth, friendRequestRouter);
  app.use("/api/v1/conversations", userAuth, conversationRouter);
  app.use("/api/v1/users", userRouter);
};

export default allRoutes;
