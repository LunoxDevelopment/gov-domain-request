import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, msg: 'Method not allowed' });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, msg: 'Token is required' });
  }

  try {
    const request = await prisma.request.findUnique({
      where: { request_token: token },
    });

    if (!request) {
      return res.status(400).json({ success: false, msg: 'Invalid token' });
    }

    res.status(200).json({
      success: true,
      data: {
        site_code: request.org_site_code,
        request_id: request.id,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, msg: 'Internal server error' });
  }
}
