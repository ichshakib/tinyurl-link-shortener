import type { Request, Response, NextFunction, RequestHandler } from "express"

export const asyncHandler =
  <T = unknown>(
    requestHandler: (
      req: Request,
      res: Response,
      next: NextFunction
    ) => Promise<T>
  ): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch(next)
  }
