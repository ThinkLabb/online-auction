import type { NextFunction, Request, Response } from 'express';
import * as authService from '../services/auth.services.ts';
import { errorResponse, successResponse } from '../utils/response.ts';
import jwt, { JwtPayload } from 'jsonwebtoken';

export const register = async (req: Request, res: Response) => {
  try {
    const result = await authService.create(req.body);

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
      .json(successResponse({ name: user.name, email: user.email }, result.message));
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
      .json(successResponse({ name: user.name, email: user.email }, data.message));
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
    res.locals.authenticated = true;

    next();
  } catch (e) {
    return res.status(500).json(errorResponse(String(e)));
  }
};

export const getSellerAuthentication = function (req: Request, res: Response, next: NextFunction) {
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
    if (payload.role !== 'seller') {
      return res.sendStatus(403);
    }
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

export const getAccount = async (req: Request, res: Response) => {
   try {
    const user = res.locals.user;
    return res.status(200).json(successResponse({name: user.name, email: user.email}, "Get account successfully!" ))

  } catch (e) {
    return res.status(500).json(errorResponse(String(e)));
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const cookies = req.cookies
    for (let cookie in cookies) {
      res.cookie(cookie, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(0),
        path: '/'
      });
    }
    res.status(200).json(successResponse(null, 'Logged out, all cookies cleared' ));
  } catch(e) {
    return res.status(500).json(errorResponse(String(e)));
  }
}
