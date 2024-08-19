import express from "express";
import AuthCtrl from "../controllers/authCtrl.js";
import userAuth from "../middlewares/authMiddleware.js";
const authRouter = express.Router();

authRouter.post("/register", AuthCtrl.register);
authRouter.post("/login", AuthCtrl.login);
authRouter.post("/logout", AuthCtrl.logout);
authRouter.get("/refresh-token", AuthCtrl.generateNewToken);

export default authRouter;
