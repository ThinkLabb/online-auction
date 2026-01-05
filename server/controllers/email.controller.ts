import type { Request, Response } from 'express';
import { errorResponse, successResponse } from '../utils/response';
import * as mailService from '../services/mail.service.ts';
import jwt from 'jsonwebtoken';

export const sendMail = async (req: Request, res: Response) => {
  try {
    const result = await mailService.send(req.body);

    if (!result.success) {
      return res.status(500).json(errorResponse(result.message));
    } else {
      return res.status(201).json(successResponse(null, result.message));
    }
  } catch (e) {
    return res.status(500).json(errorResponse(String(e)));
  }
};

export const verifyCode = async (req: Request, res: Response) => {
  try {
    const result = await mailService.verify(req.body);

    if (!result.success) {
      return res.status(500).json(errorResponse(result.message));
    } else {
      const secret = process.env.JWT_SECRET;
      if (!secret) throw new Error('JWT_SECRET is not set');
      const token = jwt.sign({ info: req.body, message: result.message }, secret, {
        expiresIn: '5m',
      });

      res.cookie('reset_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 5,
        sameSite: 'strict',
      });

      return res.status(201).json(successResponse(null, result.message));
    }
  } catch (e) {
    return res.status(500).json(errorResponse(String(e)));
  }
};
