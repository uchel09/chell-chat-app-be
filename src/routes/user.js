import express from "express";
import UserCtrl from "../controllers/userCtrl.js";
import userAuth from "../middlewares/authMiddleware.js";
const userRouter = express.Router();

userRouter.get("/:username", userAuth, UserCtrl.getUserByUsername);
userRouter.patch("/:id", UserCtrl.updateUserById);


export default userRouter;
