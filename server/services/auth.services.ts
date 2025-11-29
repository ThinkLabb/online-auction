import { Prisma } from "@prisma/client";
import db from "./database.ts";

import bcrypt from "bcryptjs"

type UserRegister = Prisma.UserCreateInput;

export const create = async (data: UserRegister) => {

  const existingUser = await db.prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    return { success: false, message: {email: "This email is already registered."} };
  }

  const hashPassword = await bcrypt.hash(data.password, 12);
  data.password = hashPassword;

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
    return { success: false, message: {email: "No account found with this email."} };
  }

  const isMatch = await bcrypt.compare(data.password, user.password);
  if (!isMatch) {
    return { success: false, message: {password: "Incorrect password. Please try again."}};
  }

  return { success: true, user, message: "SignIn successfully" };
};

export const changePassword = async (data: UserLogin) => {
  const user = await db.prisma.user.findUnique({
    where: {email: data.email }
  })

  if (!user) {
    return {success: false, message: "No account found with this email."}
  }


  const hashPassword = await bcrypt.hash(data.password, 12);
    

  const updateUser = await db.prisma.user.update({
    where: {user_id: user.user_id},
    data: {password: hashPassword}
  })

  return { success: true, updateUser, message: "Change password successfully" };

}