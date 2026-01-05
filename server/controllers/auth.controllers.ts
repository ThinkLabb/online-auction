import type { NextFunction, Request, Response } from 'express';
import * as authService from '../services/auth.services.ts';
import { errorResponse, successResponse } from '../utils/response.ts';
import jwt, { JwtPayload } from 'jsonwebtoken';
import db from '../services/database.ts';
import { getOrderByUserID } from '../services/payment.services.ts';

export const register = async (req: Request, res: Response) => {
  try {
    const recaptchaToken = req.body.recaptchaToken;

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.RECAPTCHA_SECRET}&response=${recaptchaToken}`,
    });

    const data = await response.json();

    if (!data.success) {
      return res.status(400).json(errorResponse('reCAPTCHA failed'));
    }

    const userdata = {
      name: req.body.name,
      email: req.body.email,
      address: req.body.address,
      password: req.body.password,
      code: req.body.code,
    };
    const result = await authService.create(userdata);

    if (!result.success || !result.user) {
      return res.status(400).json(errorResponse(result.message));
    }

    const user = result.user;

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not set');
    const token = jwt.sign(
      { id: user.user_id, name: user.name, email: user.email, role: user.role },
      secret,
      { expiresIn: '1h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60,
    });

    return res
      .status(201)
      .json(
        successResponse(
          { id: String(user.user_id), name: user.name, email: user.email },
          result.message
        )
      );
  } catch (e) {
    return res.status(500).json(errorResponse(String(e)));
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const data = await authService.authenticateUser({ email, password });

    if (!data.success || !data.user) {
      return res.status(400).json(errorResponse(data.message));
    }

    const user = data.user;

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not set');

    const token = jwt.sign(
      { id: user.user_id, name: user.name, email: user.email, role: user.role },
      secret,
      { expiresIn: '1h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60,
    });

    return res
      .status(200)
      .json(
        successResponse(
          { id: String(user.user_id), name: user.name, email: user.email, role: user.role },
          data.message
        )
      );
  } catch (e) {
    return res.status(500).json(errorResponse(String(e)));
  }
};

export const getAuthentication = function (req: Request, res: Response, next: NextFunction) {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }
    interface UserPayload extends JwtPayload {
      id: string;
      name: string;
      email: string;
      role: string;
    }
    const payload: UserPayload = jwt.verify(req.cookies.token, secret) as UserPayload;
    res.locals.user = payload;
    console.log(res.locals.user.id);
    res.locals.authenticated = true;

    next();
  } catch (e) {
    return res.status(500).json(errorResponse(String(e)));
  }
};

export const getSellerAuthentication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;

    const user = await db.prisma.user.findUnique({
      where: { email: decoded.email },
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.role !== 'seller') {
      return res.sendStatus(403);
    }

    const newPayload = {
      id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const newToken = jwt.sign(
      { id: user.user_id, name: user.name, email: user.email, role: user.role },
      secret,
      { expiresIn: '1h' }
    );

    res.cookie('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60,
    });

    res.locals.user = newPayload;
    res.locals.authenticated = true;

    next();
  } catch (e) {
    console.error('Auth Middleware Error:', e);
    return res.status(403).json({ success: false, message: 'Session expired or invalid' });
  }
};

export const getPublicAuthentication = function (req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.cookies.token) {
      next();
      return;
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }
    interface UserPayload extends JwtPayload {
      id: string;
      name: string;
      email: string;
      role: string;
    }
    const payload: UserPayload = jwt.verify(req.cookies.token, secret) as UserPayload;
    res.locals.user = payload;
    res.locals.authenticated = true;

    next();
  } catch (e) {
    return res.status(500).json(errorResponse(String(e)));
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    if (!req.cookies.reset_token) {
      return res.status(401).json({ message: 'Token missing' });
    }

    const result = await authService.changePassword(req.body);

    if (!result.success) {
      return res.status(500).json(errorResponse(result.message));
    }

    return res.status(200).json(successResponse(result.updateUser, result.message));
  } catch (e) {
    return res.status(500).json(errorResponse(e));
  }
};

// Verify old password before changing password
export const verifyUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = await req.body;
    const data = await authService.authenticateUser({ email, password });

    if (!data.success || !data.user) {
      return res.status(400).json(errorResponse(data.message));
    }

    const secret = process.env.JWT_SECRET!;
    if (!secret) throw new Error('JWT_SECRET is not set');

    const token = jwt.sign({ info: req.body, message: data.message }, secret, { expiresIn: '5m' });

    res.cookie('reset_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 5,
      sameSite: 'strict',
    });

    return res.status(200).json(successResponse(null, 'Correct password'));
  } catch (e) {
    return res.status(500).json(errorResponse(String(e)));
  }
};

export const getAccount = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user;
    console.log('id:', user.id);
    const orders = await getOrderByUserID(user.id);
    console.log('orders', orders);
    return res
      .status(200)
      .json(
        successResponse(
          { name: user.name, email: user.email, role: user.role, orders: orders },
          'Get account successfully!'
        )
      );
  } catch (e) {
    return res.status(500).json(errorResponse(String(e)));
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const cookies = req.cookies;
    for (let cookie in cookies) {
      res.cookie(cookie, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(0),
        path: '/',
      });
    }
    res.status(200).json(successResponse(null, 'Logged out, all cookies cleared'));
  } catch (e) {
    return res.status(500).json(errorResponse(String(e)));
  }
};

export const checkAdmin = function (req: Request, res: Response, next: NextFunction) {
  try {
    const user = res.locals.user;
    if (user.role !== 'admin') {
      return res.status(500).json(errorResponse('Your are not admin'));
    }
    next();
  } catch (e) {
    return res.status(500).json(errorResponse(String(e)));
  }
};

export const socialLogin = async (req: Request, res: Response) => {
  try {
    const { provider, token: socialToken } = req.body;

    if (provider !== 'google') {
      return res.status(400).json(errorResponse('Provider not supported yet'));
    }

    // 1. Xác thực token qua service
    const socialData = await authService.verifyGoogleToken(socialToken);

    // 2. Tìm hoặc tạo user qua service
    const user = await authService.findOrCreateSocialUser(socialData.email, socialData.name);

    // 3. Tạo JWT Token
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not set');

    const jwtToken = jwt.sign(
      { id: user.user_id, name: user.name, email: user.email, role: user.role },
      secret,
      { expiresIn: '1h' }
    );

    // 4. Thiết lập Cookie
    res.cookie('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60,
      sameSite: 'strict',
    });

    return res
      .status(200)
      .json(
        successResponse(
          { id: String(user.user_id), name: user.name, email: user.email },
          'Social login successful'
        )
      );
  } catch (e) {
    console.error('Social Login Error:', e);
    return res.status(500).json(errorResponse(String(e)));
  }
};
