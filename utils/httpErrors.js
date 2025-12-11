export class HttpError extends Error {
  constructor(status, message, meta = {}) {
    super(message);
    this.status = status;
    this.meta = meta;
  }
}

export const badRequest = (msg, meta) => new HttpError(400, msg, meta);
export const unauthorized = (msg = "Unauthorized") => new HttpError(401, msg);
export const forbidden = (msg = "Forbidden") => new HttpError(403, msg);
export const notFound = (msg = "Not found") => new HttpError(404, msg);
export const conflict = (msg = "Conflict") => new HttpError(409, msg);
export const internal = (msg = "Internal server error") => new HttpError(500, msg);
