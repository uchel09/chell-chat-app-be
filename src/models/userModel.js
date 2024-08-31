import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      maxlength: 25,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      publicId: {
        type: String,
        default: "",
      },
      imageUrl: {
        type: String,
        default:
          "https://img.freepik.com/free-vector/illustration-businessman_53876-5856.jpg?size=626&ext=jpg&ga=GA1.1.1448711260.1707091200&semt=ais", // URL default jika tidak ada yang disediakan
      },
    },
    role: { type: String, default: "user" },
    gender: { type: String, default: "male" },
    bio: {
      type: String,
      default: "",
      maxlength: 200,
    },

    link: { type: String, default: "" },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    friendRequestsSent: [
      { type: mongoose.Schema.Types.ObjectId, ref: "FriendRequest" },
    ],
    friendRequestsReceived: [
      { type: mongoose.Schema.Types.ObjectId, ref: "FriendRequest" },
    ],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
export default User;
