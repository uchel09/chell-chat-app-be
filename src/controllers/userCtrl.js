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
  static async updateUserById(req, res, next) {}

}

export default UserController;
