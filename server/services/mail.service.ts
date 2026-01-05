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

  // 1. Send to seller - Notify new bid received
  emailPromises.push(
    sendCustomEmail({
      to: sellerEmail,
      subject: `New Bid Received: "${productName}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background: linear-gradient(135deg, #8D0000 0%, #b30000 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h2 style="margin: 0; font-size: 24px;">Good News!</h2>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Your product <strong style="color: #8D0000;">${productName}</strong> just received a new bid!
            </p>
            <div style="background: #f0f8ff; border-left: 4px solid #8D0000; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0; font-size: 14px; color: #666;">Current Price:</p>
              <h3 style="margin: 10px 0 0 0; color: #8D0000; font-size: 28px;">${price} USD</h3>
            </div>
            <p style="font-size: 14px; color: #666; line-height: 1.6;">
              The auction is heating up! Continue to monitor your product.
            </p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${productLink}" style="display: inline-block; background: #8D0000; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">View Product Now →</a>
            </div>
          </div>
          <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
            <p>ThinkLab Auction System</p>
          </div>
        </div>
      `,
    })
  );

  // 2. Send to bidder - Confirm successful bid
  emailPromises.push(
    sendCustomEmail({
      to: bidderEmail,
      subject: `Bid Successful: "${productName}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h2 style="margin: 0; font-size: 24px;">Bid Successful!</h2>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Your bid has been placed successfully for:
            </p>
            <div style="background: #f0f8ff; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #4CAF50;">
              <h3 style="margin: 0 0 10px 0; color: #333;">${productName}</h3>
              <p style="margin: 0; font-size: 14px; color: #666;">Your Bid:</p>
              <h3 style="margin: 5px 0 0 0; color: #4CAF50; font-size: 28px;">${price} USD</h3>
            </div>
            <div style="background: #fffbea; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #ffa500;">
              <p style="margin: 0; font-size: 14px; color: #856404;">
                <strong>Note:</strong> You will be notified if there are any changes to the auction status.
              </p>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${productLink}" style="display: inline-block; background: #4CAF50; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Track Product →</a>
            </div>
          </div>
          <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
            <p>ThinkLab Auction System</p>
          </div>
        </div>
      `,
    })
  );

  // 3. Send to previous highest bidder (if any) - Notify they've been outbid
  if (oldBidderEmail && oldBidderEmail !== bidderEmail) {
    emailPromises.push(
      sendCustomEmail({
        to: oldBidderEmail,
        subject: `You've Been Outbid: "${productName}"`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h2 style="margin: 0; font-size: 24px;">Action Required!</h2>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <p style="font-size: 16px; color: #333; line-height: 1.6;">
                Someone just placed a higher bid than yours on:
              </p>
              <div style="background: #fff5f5; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #ff6b6b;">
                <h3 style="margin: 0 0 10px 0; color: #333;">${productName}</h3>
                <p style="margin: 0; font-size: 14px; color: #666;">Current Price:</p>
                <h3 style="margin: 5px 0 0 0; color: #ff6b6b; font-size: 28px;">${price} USD</h3>
              </div>
              <div style="background: #e8f5e9; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p style="margin: 0; font-size: 14px; color: #2e7d32;">
                  <strong>Don't miss out!</strong> Place a new bid now to reclaim your leading position!
                </p>
              </div>
              <div style="text-align: center; margin-top: 30px;">
                <a href="${productLink}" style="display: inline-block; background: #ff6b6b; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Bid Again Now →</a>
              </div>
            </div>
            <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
              <p>ThinkLab Auction System</p>
            </div>
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

// Bidder rejected from auction
export const sendBidRejectedEmail = async (
  email: string, // Bidder
  productName: string,
  productLink: string
) => {
  await sendCustomEmail({
    to: email,
    subject: `You've Been Denied Bidding Access: "${productName}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h2 style="margin: 0; font-size: 24px;">Important Notice</h2>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            The seller has denied you access to bid on:
          </p>
          <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #6c757d;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${productName}</h3>
          </div>
          <div style="background: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; font-size: 14px; color: #856404;">
              <strong>Notice:</strong> You can no longer place bids on this product. All your previous bids have been removed.
            </p>
          </div>
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            If you have any questions, please contact the seller or our support team.
          </p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${productLink}" style="display: inline-block; background: #6c757d; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">View Product →</a>
          </div>
        </div>
        <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
          <p>ThinkLab Auction System</p>
        </div>
      </div>
    `,
  });
};

// Auction ended without winner
export const sendAuctionEndedNoWinnerEmail = async (
  email: string, // Seller
  productName: string,
  productLink: string
) => {
  await sendCustomEmail({
    to: email,
    subject: `Auction Ended with No Bids: "${productName}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h2 style="margin: 0; font-size: 24px;">Auction Ended</h2>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Your auction has ended:
          </p>
          <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #6c757d;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${productName}</h3>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Status: <strong>Expired</strong></p>
          </div>
          <div style="background: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; font-size: 14px; color: #856404;">
              <strong>Information:</strong> Your product did not receive any bids.
            </p>
          </div>
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            You can review the product details or relist this product with a new starting price.
          </p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${productLink}" style="display: inline-block; background: #6c757d; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">View Product →</a>
          </div>
        </div>
        <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
          <p>ThinkLab Auction System</p>
        </div>
      </div>
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

  // Send to seller
  promises.push(
    sendCustomEmail({
      to: sellerEmail,
      subject: `Congratulations! Product Sold: "${productName}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: #333; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h2 style="margin: 0; font-size: 28px;">Congratulations!</h2>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Your product has been sold successfully</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Your auction has ended successfully!
            </p>
            <div style="background: #f0f8ff; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #FFD700;">
              <h3 style="margin: 0 0 10px 0; color: #333;">${productName}</h3>
              <p style="margin: 0; font-size: 14px; color: #666;">Final Price:</p>
              <h3 style="margin: 5px 0 0 0; color: #FFA500; font-size: 28px;">${price} USD</h3>
            </div>
            <div style="background: #e8f5e9; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #4CAF50;">
              <p style="margin: 0; font-size: 14px; color: #2e7d32;">
                <strong>Next Step:</strong> Please contact the buyer to arrange delivery and complete the transaction.
              </p>
            </div>
            <p style="font-size: 14px; color: #666; line-height: 1.6;">
              You can view order details and communicate with the buyer in your order management page.
            </p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${productLink}" style="display: inline-block; background: #FFA500; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">View Order Details →</a>
            </div>
          </div>
          <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
            <p>ThinkLab Auction System</p>
          </div>
        </div>
      `,
    })
  );

  // Send to winner
  promises.push(
    sendCustomEmail({
      to: winnerEmail,
      subject: `Congratulations! You Won: "${productName}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h2 style="margin: 0; font-size: 28px;">Congratulations!</h2>
            <p style="margin: 10px 0 0 0; font-size: 16px;">You won the auction</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Congratulations! You won the auction for:
            </p>
            <div style="background: #f0f8ff; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #4CAF50;">
              <h3 style="margin: 0 0 10px 0; color: #333;">${productName}</h3>
              <p style="margin: 0; font-size: 14px; color: #666;">Winning Bid:</p>
              <h3 style="margin: 5px 0 0 0; color: #4CAF50; font-size: 28px;">${price} USD</h3>
            </div>
            <div style="background: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #ffc107;">
              <p style="margin: 0; font-size: 14px; color: #856404;">
                <strong>Important:</strong> Please make payment and contact the seller within 48 hours to complete the transaction.
              </p>
            </div>
            <p style="font-size: 14px; color: #666; line-height: 1.6;">
              You can view order details, make payment, and communicate with the seller in your order management page.
            </p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${productLink}" style="display: inline-block; background: #4CAF50; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Pay Now →</a>
            </div>
          </div>
          <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
            <p>ThinkLab Auction System</p>
          </div>
        </div>
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
    subject: `New Question on Your Product: "${productName}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h2 style="margin: 0; font-size: 24px;">New Question Received</h2>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            You received a new question about your product:
          </p>
          <div style="background: #f0f8ff; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #007bff;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${productName}</h3>
          </div>
          <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #8D0000;">
            <p style="margin: 0; font-size: 14px; color: #666;"><strong>Question:</strong></p>
            <p style="margin: 10px 0 0 0; font-size: 15px; color: #333; line-height: 1.6;">${question}</p>
          </div>
          <div style="background: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; font-size: 14px; color: #856404;">
              <strong>Tip:</strong> Quick responses help build trust with potential buyers!
            </p>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${productLink}" style="display: inline-block; background: #007bff; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Reply Now →</a>
          </div>
        </div>
        <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
          <p>ThinkLab Auction System</p>
        </div>
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
    subject: `Seller Replied to Your Question: "${productName}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #218838 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h2 style="margin: 0; font-size: 24px;">New Answer Available</h2>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            The seller has responded to a question about a product you're interested in:
          </p>
          <div style="background: #f0f8ff; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #28a745;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${productName}</h3>
          </div>
          <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #dee2e6;">
              <p style="margin: 0 0 5px 0; font-size: 12px; color: #6c757d; text-transform: uppercase; font-weight: bold;">Question</p>
              <p style="margin: 0; font-size: 15px; color: #333; line-height: 1.6;">${question}</p>
            </div>
            <div>
              <p style="margin: 0 0 5px 0; font-size: 12px; color: #6c757d; text-transform: uppercase; font-weight: bold;">Answer</p>
              <p style="margin: 0; font-size: 15px; color: #333; line-height: 1.6; font-weight: 500;">${answer}</p>
            </div>
          </div>
          <div style="background: #e8f5e9; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #28a745;">
            <p style="margin: 0; font-size: 14px; color: #2e7d32;">
              <strong>Interested?</strong> Check out the full discussion and place your bid!
            </p>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${productLink}" style="display: inline-block; background: #28a745; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">View Discussion →</a>
          </div>
        </div>
        <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
          <p>ThinkLab Auction System</p>
        </div>
      </div>
    `,
  });
};
