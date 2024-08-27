import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export default async function loginHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, msg: 'Method not allowed', data: {} });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, msg: 'Username and password are required', data: {} });
  }

  try {
    const user = await prisma.auth_user.findUnique({
      where: { username },
      include: { user: true },
    });

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ success: false, msg: 'Invalid username or password', data: {} });
    }

    const token = jwt.sign(
      { id: user.user.id, username: user.username },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      success: true,
      msg: 'Authentication successful',
      data: { token, user: { id: user.user.id, fullName: user.user.full_name, email: user.user.email } }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, msg: `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`, data: {} });
  }
}
