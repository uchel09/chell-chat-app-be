import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    recipients: {
      type: [{ type: mongoose.Types.ObjectId, ref: "User" }],
      required: true,
      maxLength: 2,
    },
    lastMessage: {
      type: String,
      default: "",
    },
    media: {
      type: Array,
      default: [],
    },
    call: {
      type: Object,
      default: {},
    },
    isShow: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
