import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, msg: 'Method not allowed' });
  }

  const { request_token } = req.body;

  if (!request_token) {
    return res.status(400).json({ success: false, msg: 'Request token is required' });
  }

  try {
    const updatedRequest = await prisma.request.update({
      where: { request_token },
      data: { request_status_id: 6 },
    });

    if (!updatedRequest) {
      return res.status(400).json({ success: false, msg: 'Request not found or could not be updated' });
    }

    res.status(200).json({ success: true, msg: 'Request submission completed successfully' });
  } catch (error) {
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error('Error completing request submission:', errorMessage);
    res.status(400).json({ success: false, msg: 'Error completing request submission', error: errorMessage });
  }
}
