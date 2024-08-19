import { ResponseError } from "../middlewares/responseError.js";
import Conversation from "../models/conversationModel.js";
import Message from "../models/messageModel.js";
import User from "../models/userModel.js"; // Pastikan model User diimport jika belum
import mongoose, { isValidObjectId } from "mongoose";

class ConversationController {
  static async getAllConversations(req, res, next) {
    const { q } = req.query;
    try {
      const userId = new mongoose.Types.ObjectId(res.locals.user); // Ambil ID pengguna dari res.locals.user
      let conversations = [];

      if (q) {
        // Cari pengguna yang cocok dengan query q dan yang juga ada di daftar teman (friends)
        const user = await User.findOne({ _id: userId }).select("friends");
        if (!user) {
          throw new ResponseError(404, "User not found");
        }

        const friends = await User.find({
          _id: { $in: user.friends },
          username: { $regex: q, $options: "i" }, // Misalnya q adalah nama pengguna
        }).select("_id");

        const friendIds = friends.map((friend) => friend._id);

        if (friends.length > 0) {
          conversations = await Conversation.find({
            $and: [{ recipients: userId }, { recipients: { $in: friendIds } }],
          })
            .populate("recipients", "username avatar _id")
            .sort({ updatedAt: -1 })
            .exec();
        } else {
          conversations = [];
        }
      } else {
        conversations = await Conversation.find({
          recipients: userId,
          isShow: true,
        })
          .populate("recipients", "username avatar _id")
          .sort({ updatedAt: -1 }) // Mengurutkan percakapan dari yang terbaru
          .exec();
      }

      // Tambahkan jumlah pesan belum terbaca untuk setiap percakapan
      const conversationsWithUnreadCount = await Promise.all(
        conversations.map(async (conversation) => {
          const unreadMessagesCount = await Message.countDocuments({
            conversation: conversation._id,
            recipient: userId,
            isRead: false,
          });
          return {
            ...conversation.toObject(),
            unreadMessagesCount,
          };
        })
      );

      res.status(200).json({
        success: true,
        conversations: conversationsWithUnreadCount,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createMessage(req, res, next) {
    const { conversationId, text, media, call, recipient } = req.body;
    const token = req.query.token
    const senderId = res.locals.user; 

    try {
      // Validasi data
      if (!conversationId || !text) {
        throw new ResponseError(400, "Conversation ID and text are required");
      }

      // Temukan percakapan
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw new ResponseError(404, "Conversation not found");
      }

      // Buat pesan baru
      const message = new Message({
        conversation: conversationId,
        sender: senderId,
        recipient,
        text,
        media,
        call,
      });

      // Simpan pesan baru
      const savedMessage = await message.save();

      // Memperbarui percakapan dengan pesan baru (opsional)
      // Misalnya, menambahkan waktu pembaruan
      const newConversation = await Conversation.findByIdAndUpdate(
        conversationId,
        {
          updatedAt: new Date(),
          lastMessage: message.text,
          media,
          call,
          isShow: true,
        },
        { new: true, upsert: true }
      ).populate("recipients", "username avatar _id");


      res.status(201).json({
        success: true,
        message: savedMessage,
        conversation: newConversation,
        token
      });
    } catch (error) {
      next(error);
    }
  }
  static async getMessages(req, res, next) {
    let { conversationId, skip = 0, limit = 10 } = req.query; // Ambil ID percakapan, skip, dan limit dari query string
    skip = parseInt(skip);
    limit = parseInt(limit);

    try {
      // Validasi ID percakapan
      if (!conversationId) {
        throw new ResponseError(400, "Conversation ID is required");
      }

      // Validasi ObjectId
      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        throw new ResponseError(400, "Invalid Conversation ID");
      }

      // Temukan percakapan
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw new ResponseError(404, "Conversation not found");
      }

      // Temukan pesan-pesan dalam percakapan dengan skip dan limit
      const messages = await Message.find({ conversation: conversationId })

        .sort({ createdAt: -1 }) // Mengurutkan pesan berdasarkan waktu pembuatan
        .skip(parseInt(skip * limit)) // Melewatkan sejumlah pesan
        .limit(parseInt(limit)) // Mengambil sejumlah pesan sesuai limit
        .exec();

      const messageIds = messages.map((message) => message._id);
      await Message.updateMany(
        { _id: { $in: messageIds }, recipient: res.locals.user },
        { isRead: true },
        { new: true }
      );

      res.status(200).json({
        success: true,
        messages,
      });
    } catch (error) {
      next(error);
    }
  }
  static async updateIsRead(req, res, next) {
    const { messageId } = req.body;
    console.log(messageId)
    console.log(res.locals.user)
    try {
        await Message.updateOne(
          { _id:messageId , recipient: res.locals.user },
          { isRead: true },
          { new: true }
        );

      res.status(200).json({ message: "update success" });
    } catch (error) {
      next(error);
    }
  }
}

export default ConversationController;
