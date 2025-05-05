import { prisma } from "../prisma/prisma";
export type DBClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

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