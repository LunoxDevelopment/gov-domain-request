import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Function to generate a random token of 10 lowercase letters
function generateToken(): string {
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  let token = '';
  for (let i = 0; i < 10; i++) {
    token += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return token;
}

export default async function createRequest(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, msg: 'Method not allowed', data: {} });
  }

  const { site_code } = req.body;

  if (!site_code) {
    return res.status(400).json({ success: false, msg: 'Site code is required', data: {} });
  }

  try {
    let request_token: string | undefined = undefined;
    let tokenExists = true;

    while (tokenExists) {
      const generatedToken = generateToken();
      const existingRequest = await prisma.request.findUnique({
        where: { request_token: generatedToken },
      });
      if (!existingRequest) {
        request_token = generatedToken;
        tokenExists = false;
      }
    }

    // Ensure that request_token is defined
    if (!request_token) {
      throw new Error('Failed to generate a unique token');
    }

    const newRequest = await prisma.request.create({
      data: {
        request_token,
        org_site_code: site_code,
      } as any,
    });

    res.status(201).json({ success: true, msg: 'Request created successfully', data: { id: newRequest.id, token: newRequest.request_token } });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ success: false, msg: `Request creation failed: ${error.message}`, data: {} });
    } else {
      res.status(400).json({ success: false, msg: 'Request creation failed: Unknown error', data: {} });
    }
  }
}
