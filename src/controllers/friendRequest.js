import { ResponseError } from "../middlewares/responseError.js";
import Conversation from "../models/conversationModel.js";
import FriendRequest from "../models/friendRequestModel.js";
import Message from "../models/messageModel.js";
import User from "../models/userModel.js";

class FriendRequestController {
  // =========================== Send Request Friend ==========================================
  static async sendRequest(req, res, next) {
    const senderId = res.locals.user;
    const { receiverId } = req.body;

    try {
      const getsender = await User.findById(senderId);
      if (getsender.friends.includes(receiverId)) {
        throw new ResponseError(400, "kalian sudah berteman");
      }
      // Hapus permintaan yang ditolak sebelumnya
      await FriendRequest.deleteMany({
        sender: senderId,
        receiver: receiverId,
        status: "rejected",
      });

      // Cek apakah ada permintaan pertemanan yang dikirim oleh receiver ke sender
      const reverseRequest = await FriendRequest.findOne({
        sender: receiverId,
        receiver: senderId,
        status: "pending",
      });

      if (reverseRequest) {
        // Jika ada permintaan pertemanan dari receiver ke sender, mereka otomatis menjadi teman
        const sender = await User.findByIdAndUpdate(
          senderId,
          {
            $pull: { friendRequestsReceived: reverseRequest._id },
            $push: { friends: receiverId },
          },
          { new: true }
        )
          .select("-password")
          .populate(
            "friendRequestsSent friendRequestsReceived friends",
            "-password"
          )
          .populate({
            path: "friendRequestsReceived",
            populate: {
              path: "sender",
              select: "avatar _id username",
            },
          });

        const receiver = await User.findByIdAndUpdate(
          receiverId,
          {
            $pull: { friendRequestsSent: reverseRequest._id },
            $push: { friends: senderId },
          },
          { new: true }
        )
          .select("-password")
          .populate(
            "friendRequestsSent friendRequestsReceived friends",
            "-password"
          )
          .populate({
            path: "friendRequestsReceived",
            populate: {
              path: "sender",
              select: "avatar _id username",
            },
          });

        // Hapus permintaan pertemanan dari database
        await FriendRequest.findByIdAndDelete(reverseRequest._id);
        const conversation = await Conversation.create({
          recipients: [sender._id, receiver._id],
        });

        return res.status(200).json({
          success: true,
          message: "Kalian berdua sekarang berteman",
          sender,
          receiver,
        });
      }

      // Cek apakah sudah ada permintaan yang sama
      const existingRequest = await FriendRequest.findOne({
        sender: senderId,
        receiver: receiverId,
      });

      if (existingRequest) {
        throw new ResponseError(400, "Permintaan pertemanan sudah ada");
      }

      // Jika tidak ada permintaan yang sama, buat permintaan baru
      const newRequest = new FriendRequest({
        sender: senderId,
        receiver: receiverId,
        status: "pending",
      });
      await newRequest.save();

      // Tambahkan permintaan ke daftar permintaan yang dikirim dan diterima
      const sender = await User.findByIdAndUpdate(
        senderId,
        {
          $push: { friendRequestsSent: newRequest._id },
        },
        { new: true }
      )
        .select("-password")
        .populate(
          "friendRequestsSent friendRequestsReceived friends",
          "-password"
        )
        .populate({
          path: "friendRequestsReceived",
          populate: {
            path: "sender",
            select: "avatar _id username",
          },
        });

      const receiver = await User.findByIdAndUpdate(
        receiverId,
        {
          $push: { friendRequestsReceived: newRequest._id },
        },
        {
          new: true,
        }
      )
        .select("-password")
        .populate(
          "friendRequestsSent friendRequestsReceived friends",
          "-password"
        )
        .populate({
          path: "friendRequestsReceived",
          populate: {
            path: "sender",
            select: "avatar _id username",
          },
        });

      res.status(201).json({ success: true, sender, receiver });
    } catch (error) {
      next(error);
    }
  }

  // =========================== Cancel Request Friend ==========================================
  static async cancelRequest(req, res, next) {
    const senderId = res.locals.user;
    const { receiverId } = req.params;

    try {
      const existingRequest = await FriendRequest.findOneAndDelete({
        sender: senderId,
        receiver: receiverId,
        status: "pending",
      });

      if (!existingRequest) {
        throw new ResponseError(
          404,
          "Permintaan pertemanan tidak ditemukan atau sudah ditanggapi"
        );
      }

      // Hapus ID permintaan dari array friendRequestsSent dan friendRequestsReceived
      const sender = await User.findByIdAndUpdate(
        senderId,
        {
          $pull: { friendRequestsSent: existingRequest._id },
        },
        {
          new: true,
        }
      )
        .select("-password")
        .populate(
          "friendRequestsSent friendRequestsReceived friends",
          "-password"
        )
        .populate({
          path: "friendRequestsReceived",
          populate: {
            path: "sender",
            select: "avatar _id username",
          },
        });
      const receiver = await User.findByIdAndUpdate(
        receiverId,
        {
          $pull: { friendRequestsReceived: existingRequest._id },
        },
        { new: true }
      )
        .select("-password")
        .populate(
          "friendRequestsSent friendRequestsReceived friends",
          "-password"
        )
        .populate({
          path: "friendRequestsReceived",
          populate: {
            path: "sender",
            select: "avatar _id username",
          },
        });

      res.status(200).json({
        success: true,
        message: "Permintaan pertemanan berhasil dibatalkan.",
        sender,
        receiver,
      });
    } catch (error) {
      next(error);
    }
  }

  // =============================== Accept Request ===================================
  static async acceptRequest(req, res, next) {
    const { requestId } = req.body;

    try {
      const request = await FriendRequest.findById(requestId);
      if (!request) {
        throw new ResponseError(404, "Request not found");
      }

      // Tambahkan pengguna ke daftar teman masing-masing
      const sender = await User.findByIdAndUpdate(
        request.sender,
        {
          $pull: { friendRequestsSent: requestId },
          $addToSet: { friends: request.receiver },
        },
        { new: true }
      )
        .select("-password")
        .populate(
          "friendRequestsSent friendRequestsReceived friends",
          "-password"
        )
        .populate({
          path: "friendRequestsReceived",
          populate: {
            path: "sender",
            select: "avatar _id username",
          },
        });
      const receiver = await User.findByIdAndUpdate(
        request.receiver,
        {
          $addToSet: { friends: request.sender },
          $pull: { friendRequestsReceived: requestId },
        },
        {
          new: true,
        }
      )
        .select("-password")
        .populate(
          "friendRequestsSent friendRequestsReceived friends",
          "-password"
        )
        .populate({
          path: "friendRequestsReceived",
          populate: {
            path: "sender",
            select: "avatar _id username",
          },
        });
      // Hapus permintaan pertemanan dari database
      await FriendRequest.findByIdAndDelete(requestId);
      const conversation = await Conversation.create({
        recipients: [sender._id, receiver._id],
      });


      res.status(200).json({
        message: "Friend request accepted and deleted",
        sender,
        receiver,
      });
    } catch (error) {
      next(error);
    }
  }

  //   ================Reject Request ======================
  static async rejectRequest(req, res, next) {
    const { requestId } = req.params;

    try {
      const request = await FriendRequest.findByIdAndDelete(requestId);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      const sender = await User.findByIdAndUpdate(
        request.sender,
        {
          $pull: { friendRequestsSent: request._id },
        },
        { new: true }
      )
        .select("-password")
        .populate(
          "friendRequestsSent friendRequestsReceived friends",
          "-password"
        )
        .populate({
          path: "friendRequestsReceived",
          populate: {
            path: "sender",
            select: "avatar _id username",
          },
        });
      const receiver = await User.findByIdAndUpdate(
        request.receiver,
        {
          $pull: { friendRequestsReceived: request._id },
        },
        {
          new: true,
        }
      )
        .select("-password")
        .populate(
          "friendRequestsSent friendRequestsReceived friends",
          "-password"
        )
        .populate({
          path: "friendRequestsReceived",
          populate: {
            path: "sender",
            select: "avatar _id username",
          },
        });

      res
        .status(200)
        .json({ message: "Friend request rejected", sender, receiver });
    } catch (error) {
      next(error);
    }
  }
  // ============================= DElete Friend ========================
  static async deleteFriend(req, res, next) {
    const senderId = res.locals.user;
    const { receiverId } = req.params;

    try {
      const sender = await User.findByIdAndUpdate(
        senderId,
        {
          $pull: { friends: receiverId },
        },
        { new: true }
      )
        .select("-password")
        .populate(
          "friendRequestsSent friendRequestsReceived friends",
          "-password"
        )
        .populate({
          path: "friendRequestsReceived",
          populate: {
            path: "sender",
            select: "avatar _id username",
          },
        });

      const receiver = await User.findByIdAndUpdate(
        receiverId,
        {
          $pull: { friends: senderId },
        },
        { new: true }
      )
        .select("-password")
        .populate(
          "friendRequestsSent friendRequestsReceived friends",
          "-password"
        )
        .populate({
          path: "friendRequestsReceived",
          populate: {
            path: "sender",
            select: "avatar _id username",
          },
        });
      const conversation = await Conversation.findOneAndDelete({
        recipients: { $all: [senderId, receiverId] },
      });

      // Hapus semua pesan yang terkait dengan percakapan tersebut
      if (conversation) {
        await Message.deleteMany({ conversation: conversation._id });
      }

      res.status(200).json({
        message: "Friend deleted",
        sender,
        receiver,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default FriendRequestController;
