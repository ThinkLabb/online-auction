import { Prisma } from "@prisma/client";
import db from "./database.ts";
import * as mailService from "../services/mail.service.ts";
import bcrypt from "bcryptjs"
import { OAuth2Client } from 'google-auth-library';

type Data = {
  email: string;
  name: string;
  code: string;
  password: string;
  address: string;
};
 
export const create = async (data: Data) => {

  const result = await mailService.verify({email: data.email, code: data.code, register: true}); 

  if (!result.success) {
     return { success: false, message: {code: "Invalid code."}  };
  }

  const existingUser = await db.prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    return { success: false, message: {email: "This email is already registered."} };
  }

  const hashPassword = await bcrypt.hash(data.password, 12);

  const user = await db.prisma.user.create({ 
    data: {
      email: data.email,
      password: hashPassword,
      address: data.address,
      name: data.name,
    } 
  });
  
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

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const verifyGoogleToken = async (token: string) => {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new Error("Invalid Google Token");
  }
  return {
    email: payload.email,
    name: payload.name || "Social User",
  };
};

export const findOrCreateSocialUser = async (email: string, name: string) => {
  let user = await db.prisma.user.findUnique({ where: { email } });

  const hashPassword = await bcrypt.hash(String(process.env.DEFAULT_PASSWORD), 12);

  if (!user) {
    user = await db.prisma.user.create({
      data: {
        email,
        name,
        password: hashPassword, 
        role: 'bidder',
      },
    });
  }
  return user;
};