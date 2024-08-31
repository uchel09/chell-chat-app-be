import User from "../models/userModel.js";

class UserController {
  static async getUserByUsername(req, res, next) {
    const { username } = req.params;
    const myId = res.locals.user;

    try {
      const users = await User.find({
        username: { $regex: username, $options: "i" },
        _id: { $ne: myId }, //kecuali saya
      });

      res.status(200).json({
        length: users.length,
        success: true,
        users,
      });
    } catch (error) {
      next(error);
    }
  }
  static async updateUserById(req, res, next) {
    const id = res.locals.user;
    let { link, bio, avatar } = req.body;
    try {
      if (avatar?.imageUrl) {
        await User.findByIdAndUpdate(
          id,
          {
            link,
            bio,
            avatar,
          },
          { new: true }
        );
      } else {
        await User.findByIdAndUpdate(
          id,
          {
            link,
            bio,
          },
          {
            new: true,
          }
        );
      }
      res.status(200).json({
        success: true,
        message: "profile image updated",
      });
    } catch (error) {
      next(error);
    }
  }
}

export default UserController;
