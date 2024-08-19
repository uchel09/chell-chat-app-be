export class ResponseError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.message = message;

    Error.captureStackTrace(this, this.constructor);
  }
}
