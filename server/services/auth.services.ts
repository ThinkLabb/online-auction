import { Prisma } from "@prisma/client";
import db from "./database.ts";

import bcrypt from "bcryptjs"

type UserRegister = Prisma.UserCreateInput;

export const create = async (data: UserRegister) => {
  const existingUser = await db.prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    return { success: false, message: "Email exist" };
  }

  const hashPassword = await bcrypt.hash(data.password, 12);
  data.password = hashPassword;

  const user = await db.prisma.user.create({ data });
  
  return { success: true, user };
};

type UserLogin = {
  email: string;
  password: string;
};


export const authenticateUser = async (data: UserLogin) => {
  const user = await db.prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    return { success: false, message: "Email incorrect" };
  }

  const isMatch = await bcrypt.compare(data.password, user.password);
  if (!isMatch) {
    return { success: false, message: "Password incorrect" };
  }

  return { success: true, user };
};