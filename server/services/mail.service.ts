import crypto from "crypto"
import nodemailer from "nodemailer"
import db from "./database.ts";
import { totp } from 'otplib'

totp.options = { 
    step: 60,
    digits: 6,
    window: 1 
}; 

function getUserSecret(email: string) {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is not set");
    return crypto
        .createHmac("sha1", secret)
        .update(email)
        .digest("hex");
}

type Data = {
    email: string;
    code: string;
    register: boolean;
}

export const send = async (data: Data) => { 
    if (data.register === false) {
        const user = await db.prisma.user.findUnique({
            where: { email: data.email }
        })
        if (!user) {
            return {success: false, message: "No account found with this email."}
        }
    }
    const email = data.email
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MAIL,
            pass: process.env.PASSWORD
        }
    });
    const secret = getUserSecret(email)
    const code = totp.generate(secret)
    let mailOptions = {
        from: process.env.MAIL,
        to: email,
        subject: 'ThinkLab verification email',
        text: `${code} is your verification code, valid for 5 minutes. Welcome! To keep your account safe, never forward this code.`
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true, message: "Send code successfully!" };
    } catch (error) {
        return { success: false, message: String(error)};
    }
}

export const verify = async (data: Data) => {
    const email = data.email
    const code = data.code

    const secret = getUserSecret(email)

    if (!totp.check(code, secret)) {
        console.log(false)
        return { success: false, message: "Invalid code." }
    }

    return { success: true, message: "Verification code successfully!" };
}