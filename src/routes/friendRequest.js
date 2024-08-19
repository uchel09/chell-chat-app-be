import express from "express";
import FriendRequestController from "../controllers/friendRequest.js";
const friendRequestRouter = express.Router();

friendRequestRouter.post("/send-request", FriendRequestController.sendRequest);
friendRequestRouter.delete(
  "/cancel-request/:receiverId",
  FriendRequestController.cancelRequest
);
friendRequestRouter.post("/accept", FriendRequestController.acceptRequest);
friendRequestRouter.delete(
  "/reject/:requestId",
  FriendRequestController.rejectRequest
);
friendRequestRouter.delete(
  "/friend/:receiverId",
  FriendRequestController.deleteFriend
);

export default friendRequestRouter;
