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

  const hashPassword = await bcrypt.hash(data.password_hash, 12);
  data.password_hash = hashPassword;

  const user = await db.prisma.user.create({ data });
  
  return { success: true, user, message: "Register successfully" };
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

  const isMatch = await bcrypt.compare(data.password, user.password_hash);
  if (!isMatch) {
    return { success: false, message: "Password incorrect" };
  }

  return { success: true, user, message: "SignIn successful" };
};