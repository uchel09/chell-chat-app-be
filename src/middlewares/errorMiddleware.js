import { ResponseError } from "./responseError.js";
import { MongooseError } from "mongoose";

export const errorMiddleware = (error, req, res, next) => {
  console.error(error.stack);

  if (res.headersSent) {
    // agar tidak dobol
    return next(error);
  }

  if (error instanceof ResponseError) {
    res.status(error.status).json({
      errors: "Response error",
      message: error.message,
      success: false,
    });
  } else if (error.code && error.code === 11000) {
    res.status(400).json({
      errors: "Duplicate key",
      name: error.message,
      message: `${Object.keys(error.keyValue)[0]} already exists`,
      success: false,
    });
  } else if (error.name === "JsonWebTokenError") {
    res.status(400).json({
      errors: "Json web token error",
      message: `${error.message}, try again`,
      success: false,
    });
  } else if (error.name === "TokenExpiredError") {
    res.status(400).json({
      errors: "Token expired",
      message: error.message,
      success: false,
    });
  } else if (
    error.name === "BSONError" ||
    error.name === "TypeError" ||
    error.name === "CastError"
  ) {
    res.status(404).json({
      errors: `${error.name}`,
      message: `not found`,
      success: false,
    });
  } else if (error.name === "ValidationError") {
    res.status(400).json({
      errors: `${error.name}`,
      message: error.message,
      success: false,
    });
  } else if (error instanceof MongooseError) {
    res.status(500).json({
      errors: `Internal server error`,
      message: error.message,
      success: false,
    });
  } else {
    res.status(500).json({
      errors: `Internal server error`,
      message: error.message,
      success: false,
    });
  }
};
