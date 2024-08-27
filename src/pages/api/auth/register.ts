import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function registerUser(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, msg: 'Method not allowed', data: {} });
  }

  const { username, password, userId } = req.body;

  if (!username || !password || !userId) {
    return res.status(400).json({ success: false, msg: 'Username, password, and userId are required', data: {} });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    const newAuthUser = await prisma.auth_user.create({
      data: {
        username,
        password: hashedPassword,
        user: {
          connect: { id: userId }
        }
      }
    });
    res.status(201).json({ success: true, msg: 'User registered successfully', data: { id: newAuthUser.id, username: newAuthUser.username, userId: newAuthUser.user_id } });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ success: false, msg: `User registration failed: ${error.message}`, data: {} });
    } else {
      res.status(400).json({ success: false, msg: 'User registration failed: Unknown error', data: {} });
    }
  }
}
