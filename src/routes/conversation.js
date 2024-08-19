import express from "express";
import ConversationCtrl from "../controllers/conversationCtrl.js";

const conversationRouter = express.Router();

conversationRouter.get("/", ConversationCtrl.getAllConversations);
conversationRouter.get("/messages", ConversationCtrl.getMessages);
conversationRouter.post("/messages", ConversationCtrl.createMessage);
conversationRouter.put(
  "/messages/update-isread",
  ConversationCtrl.updateIsRead
);

export default conversationRouter;
