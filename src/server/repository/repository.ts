import { prisma } from "../prisma/prisma";
import type { AvatarRepository, PostRepository, UserRepository } from "./interface";
import DBAvatarRepository from "./AvatarRepository";
import DBPostRepository from "./PostRepository";
import DBUserRepository from "./UserRepository";

export const dbAvatarRepository: AvatarRepository = new DBAvatarRepository(prisma);
export const dbPostRepository: PostRepository = new DBPostRepository(prisma);
export const dbUserRepository: UserRepository = new DBUserRepository(prisma);
