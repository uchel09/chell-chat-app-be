import User from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ResponseError } from "../middlewares/responseError.js";

class AuthCtrl {
  static async register(req, res, next) {
    try {
      const { username, email, password, gender } = req.body;
      const newUsername = username.toLowerCase().replace(/ /g, "");

      //   validation
      const new_username = await User.findOne({ username: newUsername });
      if (new_username) {
        throw new ResponseError(400, "username already exist");
      }
      const new_email = await User.findOne({ email });
      if (new_email) {
        throw new ResponseError(400, "email already exist");
      }
      if (password.length < 8) {
        throw new ResponseError(400, "password at least must be 8 character");
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const newUser = await User.create({
        username: newUsername,
        email,
        password: passwordHash,
        gender,
      });

      res.status(201).json({
        success: true,
        message: "register user success",
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email })
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
      if (!user) {
        throw new ResponseError(422, "email or password incorrect");
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new ResponseError(422, "email or password incorrect");
      }

      user.password = "";

      const accessToken = createAccessToken({ user: user._id });
      const refreshToken = createRefreshToken({ id: user._id });

      res.cookie("refreshtoken", refreshToken, {
        httpOnly: true,
        path: "/api/refresh-token",
        maxAge: 30 * 7 * 24 * 60 * 60 * 1000,
      });
      res.json({
        success: true,
        message: "login success",
        accessToken,
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      res.clearCookie("refreshtoken", { path: "/api/refresh-token" });
      return res.json({ success: true, message: "logout success" });
    } catch (error) {
      next(error);
    }
  }

  static async generateNewToken(req, res, next) {
    try {
      const rfToken = req.cookies.refreshtoken;
      if (!rfToken) {
        throw new ResponseError(400, "unAuthorized,try login again");
      }
      jwt.verify(
        rfToken,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, result) => {
          if (err) {
            throw new ResponseError(400, "unAuthorized,try login again");
          }

          const user = await User.findById(result.id)
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
          if (!user) {
            throw new ResponseError(400, "unAuthorized,try login again");
          }

          const accessToken = createAccessToken({ user: user._id });
          res.status(200).json({
            success: true,
            accessToken,
            user,
          });
        }
      );
    } catch (error) {
      next(error);
    }
  }
}

const createAccessToken = (payload) => {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1d",
  });
};

const createRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "30d",
  });
};

export default AuthCtrl;
