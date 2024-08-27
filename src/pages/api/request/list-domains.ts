import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getFullDomainName(domainId: number): Promise<string> {
  const domainParts: string[] = [];
  let currentDomain = await prisma.domain.findUnique({ where: { id: domainId } });

  while (currentDomain) {
    domainParts.unshift(currentDomain.domain_name);
    if (currentDomain.parent_domain_id) {
      currentDomain = await prisma.domain.findUnique({ where: { id: currentDomain.parent_domain_id } });
    } else {
      currentDomain = null;
    }
  }

  return domainParts.join('.');
}

export default async function listDomains(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, msg: 'Method not allowed', data: {} });
  }

  const { requestToken } = req.query;

  if (!requestToken) {
    return res.status(400).json({ success: false, msg: 'Request token is required', data: {} });
  }

  try {
    const request = await prisma.request.findUnique({ where: { request_token: String(requestToken) } });

    if (!request) {
      return res.status(404).json({ success: false, msg: 'Request not found', data: {} });
    }

    const requestDomains = await prisma.request_domain.findMany({
      where: { request_id: request.id },
      include: { domain: true },
    });

    const domains = await Promise.all(
      requestDomains.map(async (requestDomain) => ({
        id: requestDomain.id,
        fqdn: await getFullDomainName(requestDomain.domain_id),
        reason: requestDomain.reason,
        type: requestDomain.type,
        include_www: requestDomain.include_www,
      }))
    );

    res.status(200).json({ success: true, msg: 'Domains retrieved successfully', data: domains });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ success: false, msg: `Failed to retrieve domains: ${error.message}`, data: {} });
    } else {
      res.status(400).json({ success: false, msg: 'Failed to retrieve domains: Unknown error', data: {} });
    }
  }
}
