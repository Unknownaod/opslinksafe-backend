import { logger } from "../config/logger.js";
import { HttpError, internal } from "../utils/httpErrors.js";

export function notFoundHandler(req, res, next) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, req, res, next) {
  const isHttp = err instanceof HttpError;
  const status = isHttp ? err.status : 500;
  const message = isHttp ? err.message : "Internal server error";

  const logPayload = {
    status,
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
    meta: err.meta,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip
  };

  if (status >= 500) logger.error("Server error", logPayload);
  else logger.warn("Client error", logPayload);

  res.status(status).json({
    ok: false,
    error: {
      message,
      status
    }
  });
}
