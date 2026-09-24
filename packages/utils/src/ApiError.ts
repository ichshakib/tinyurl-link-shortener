export class ApiError extends Error {
  readonly statusCode: number
  readonly data: null
  readonly success: false
  readonly errors: unknown[]

  constructor(
    statusCode: number,
    message: string = "Something went wrong",
    errors: unknown[] = [],
    stack: string = ""
  ) {
    super(message)

    this.statusCode = statusCode
    this.data = null
    this.success = false
    this.errors = errors

    if (stack) {
      this.stack = stack
    } else {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}
