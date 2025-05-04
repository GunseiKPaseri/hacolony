export class NotFoundError extends Error {
  static {
    this.prototype.name = "NotFoundError";
  }
}

export class InvalidInputError extends Error {
  static {
    this.prototype.name = "InvalidInputError";
  }
}