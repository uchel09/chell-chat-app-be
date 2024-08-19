import jwt from "jsonwebtoken";
import { ResponseError } from "./responseError.js";

const userAuth = async (req, res, next) => {
  const authHeader = req?.headers?.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    next(new ResponseError(400, "Unauthorized"));
    return;
  }

  const token = authHeader?.split(" ")[1];
  try {
    const userToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    res.locals = userToken;
    next();
  } catch (error) {
    next(new ResponseError(400, "Unauthorized"));
  }
};

export default userAuth;
