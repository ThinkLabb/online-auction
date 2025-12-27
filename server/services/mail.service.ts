import crypto from 'crypto';
import nodemailer from 'nodemailer';
import db from './database.ts';
import { totp } from 'otplib';

totp.options = {
  step: 120,
  digits: 6,
  window: 1,
};

function getUserSecret(email: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return crypto.createHmac('sha1', secret).update(email).digest('hex');
}

type Data = {
  email: string;
  code: string;
  register: boolean;
};

export const send = async (data: Data) => {
  if (data.register === false) {
    const user = await db.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (!user) {
      return { success: false, message: 'No account found with this email.' };
    }
  }
  const email = data.email;
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL,
      pass: process.env.PASSWORD,
    },
  });
  const secret = getUserSecret(email);
  const code = totp.generate(secret);
  let mailOptions = {
    from: process.env.MAIL,
    to: email,
    subject: 'ThinkLab verification email',
    // text: `${code} is your verification code, valid for 5 minutes. Welcome! To keep your account safe, never forward this code.`,
    html: `
    <div style="font-family: sans-serif; padding: 20px;">
      <h3 style="color: #333;">ThinkLab Verification</h3>
      <p>Your verification code is:</p>
      <h1 style="color: #8D0000; letter-spacing: 5px; margin: 10px 0;">${code}</h1>
      <p style="color: #666; font-size: 14px;">Valid for 5 minutes. Do not share this code.</p>
    </div>
  `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Send code successfully!' };
  } catch (error) {
    return { success: false, message: String(error) };
  }
};

export const verify = async (data: Data) => {
  const email = data.email;
  const code = data.code;

  const secret = getUserSecret(email);

  if (!totp.check(code, secret)) {
    return { success: false, message: 'Invalid code.' };
  }

  return { success: true, message: 'Verification code successfully!' };
};

// =================================================================
// Function to send custom email (for Q&A notifications and others besides verification)
// =================================================================
export type CustomMailOptions = {
  to: string;
  subject: string;
  html: string;
  bcc?: string | string[]; // security purpose
};

// Dua bien transporter ra ngoai ham sendCustomEmail() de toi uu hieu nang
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL,
    pass: process.env.PASSWORD,
  },
});

export const sendCustomEmail = async (options: CustomMailOptions) => {
  let mailOptions = {
    from: process.env.MAIL,
    to: options.to,
    bcc: options.bcc, //khong cho thay danh sach nguoi nhan (van de bao mat)
    subject: options.subject,
    html: options.html,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Email sent successfully!' };
  } catch (error) {
    console.error('Mail Error:', error);
    return { success: false, message: String(error) };
  }
};

// Function to send email notifications for a new bid
export const sendNewBidEmail = async (
  productName: string,
  price: string,
  productLink: string,
  sellerEmail: string,
  bidderEmail: string,
  oldBidderEmail?: string
) => {
  // Danh sach nguoi can gui email
  const emailPromises = [];

  // 1. gui cho seller biet co nguoi ra gia moi
  emailPromises.push(
    sendCustomEmail({
      to: sellerEmail,
      subject: `New Bid Received: ${productName}`,
      html: `
        <h3>Good news!</h3>
        <p>A new bid of <strong style="color: #8D0000; font-size: 16px;">${price}</strong> has been placed on your product <strong>${productName}</strong>.</p>
        <div style="margin-top: 15px;">
          <a href="${productLink}" style="color: #8D0000; font-weight: bold;">Check your product now &rarr;</a>
        </div>
      `,
    })
  );

  // 2. gui cho bidder vua ra gia thanh cong - xac nhan da ra gia thanh cong
  emailPromises.push(
    sendCustomEmail({
      to: bidderEmail,
      subject: `Bid Successful: ${productName}`,
      html: `
        <h3>You are the highest bidder!</h3>
        <p>You successfully placed a bid of <strong style="color: #8D0000;">${price}</strong> on <strong>${productName}</strong>.</p>
        <p>We will notify you if someone outbids you via email.</p>
        <div style="margin-top: 15px;">
          <a href="${productLink}" style="color: #8D0000; font-weight: bold;">View Product &rarr;</a>
        </div>
      `,
    })
  );

  // 3. gui cho old bidder (neu co) rang co nguoi dat gia cao hon va hoi xem co muon ra gia tiep hay khong
  if (oldBidderEmail && oldBidderEmail !== bidderEmail) {
    emailPromises.push(
      sendCustomEmail({
        to: oldBidderEmail,
        subject: `⚠️ You have been outbid: ${productName}`,
        html: `
          <h3>Action Required!</h3>
          <p>Another user has placed a higher bid of <strong>${price}</strong> on <strong>${productName}</strong>.</p>
          <div style="background:#f3f4f6; padding:15px; border-left:4px solid #8D0000; margin: 15px 0;">
            <p style="margin:0;">Current Price: <strong>${price}</strong></p>
          </div>
          <p>Place a new bid now to reclaim your position!</p>
          <div style="margin-top: 20px;">
            <a href="${productLink}" style="background: #8D0000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Bid Again Now</a>
          </div>
        `,
      })
    );
  }

  try {
    // Gui cho tat ca cung luc
    await Promise.all(emailPromises);
    return { success: true, message: 'All bid emails sent successfully' };
  } catch (error) {
    console.error('Send New Bid Email Error:', error);
    return { success: false, message: 'Some emails failed to send' };
  }
};

// Người mua bị từ chối ra giá
export const sendBidRejectedEmail = async (
  email: string, // Người mua
  productName: string,
  productLink: string
) => {
  await sendCustomEmail({
    to: email,
    subject: `Bid Rejected: ${productName}`,
    html: `
      <h3>Your bid has been rejected by the seller.</h3>
      <p>You can no longer participate in this auction.</p>
      <a href="${productLink}">View Product</a>
    `,
  });
};

// Đấu giá kết thúc, không có người mua
export const sendAuctionEndedNoWinnerEmail = async (
  email: string, //
  productName: string,
  productLink: string
) => {
  await sendCustomEmail({
    to: email,
    subject: `Auction Ended with no bids: ${productName}`,
    html: `
      <p>Your auction has ended but received no bids.</p>
      <a href="${productLink}">View Product</a>
    `,
  });
};

// Đấu giá kết thúc, có người mua
export const sendAuctionSuccessEmail = async (
  productName: string,
  price: string,
  productLink: string,
  sellerEmail: string,
  winnerEmail: string
) => {
  const promises = [];

  // Gửi Seller
  promises.push(
    sendCustomEmail({
      to: sellerEmail,
      subject: `🎉 Product Sold: ${productName}`,
      html: `
      <h3>Congratulations!</h3>
      <p>Your product was sold for <strong>${price}</strong>.</p>
      <p>Please contact the winner to arrange delivery.</p>
      <a href="${productLink}">View Details</a>
    `,
    })
  );

  // Gửi Winner
  promises.push(
    sendCustomEmail({
      to: winnerEmail,
      subject: `🏆 You Won: ${productName}`,
      html: `
      <h3>Congratulations!</h3>
      <p>You won the auction with a bid of <strong>${price}</strong>.</p>
      <a href="${productLink}">Pay Now</a>
    `,
    })
  );

  await Promise.all(promises);
};

export const sendNewQuestionEmail = async (
  sellerEmail: string,
  productName: string,
  question: string,
  productLink: string
) => {
  await sendCustomEmail({
    to: sellerEmail,
    subject: `New Question on: ${productName}`,
    html: `
      <h3>You received a new question</h3>
      <p><strong>There is a new question about your product (${productName}):</strong> "${question}"</p>
      <div style="margin-top: 15px;">
        <a href="${productLink}" style="background: #8D0000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reply Now</a>
      </div>
    `,
  });
};

export const sendNewAnswerEmail = async (
  emails: string[],
  productName: string,
  question: string,
  answer: string,
  productLink: string
) => {
  if (emails.length === 0) return;

  await sendCustomEmail({
    to: process.env.MAIL as string,
    bcc: emails,
    subject: `💬 Seller Replied: ${productName}`,
    html: `
      <h3>New update on the product you are following</h3>
      <div style="background:#f9f9f9; padding:15px; border-left: 4px solid #8D0000; margin-bottom: 15px;">
        <p style="margin: 0 0 10px 0;"><strong>Q:</strong> ${question}</p>
        <p style="margin: 0;"><strong>A:</strong> ${answer}</p>
      </div>
      <a href="${productLink}" style="color: #8D0000; font-weight: bold;">View Discussion &rarr;</a>
    `,
  });
};
