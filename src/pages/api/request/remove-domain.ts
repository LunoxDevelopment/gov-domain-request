import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function removeDomain(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, msg: 'Method not allowed', data: {} });
  }

  const { requestDomainId } = req.body;

  if (!requestDomainId) {
    return res.status(400).json({ success: false, msg: 'Missing required field: requestDomainId', data: {} });
  }

  try {
    const existingRequestDomain = await prisma.request_domain.findUnique({
      where: { id: requestDomainId },
    });

    if (!existingRequestDomain) {
      return res.status(404).json({ success: false, msg: 'Request domain not found', data: {} });
    }

    await prisma.request_domain.delete({
      where: { id: requestDomainId },
    });

    res.status(200).json({ success: true, msg: 'Domain removed successfully', data: {} });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ success: false, msg: `Domain removal failed: ${error.message}`, data: {} });
    } else {
      res.status(400).json({ success: false, msg: 'Domain removal failed: Unknown error', data: {} });
    }
  }
}
