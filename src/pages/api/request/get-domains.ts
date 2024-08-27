import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getFullDomainName(domainId: number): Promise<string> {
  let domainParts: string[] = [];
  let currentDomain = await prisma.domain.findUnique({ where: { id: domainId } });

  while (currentDomain) {
    domainParts.push(currentDomain.domain_name);
    currentDomain = currentDomain.parent_domain_id
      ? await prisma.domain.findUnique({ where: { id: currentDomain.parent_domain_id } })
      : null;
  }

  return domainParts.join('.');
}

export default async function getDomains(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, msg: 'Method not allowed', data: {} });
  }

  const { requestToken } = req.body;

  if (!requestToken) {
    return res.status(400).json({ success: false, msg: 'requestToken is required', data: {} });
  }

  try {
    const request = await prisma.request.findUnique({ where: { request_token: String(requestToken) } });

    if (!request) {
      return res.status(404).json({ success: false, msg: 'Request not found', data: {} });
    }

    const requestDomains = await prisma.request_domain.findMany({ where: { request_id: request.id } });

    const domainsWithFqdn = await Promise.all(requestDomains.map(async (requestDomain) => {
      const fqdn = await getFullDomainName(requestDomain.domain_id);
      return {
        request_domain_id: requestDomain.id,
        fqdn: fqdn,
      };
    }));

    res.status(200).json({
      success: true,
      data: domainsWithFqdn,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ success: false, msg: `Failed to fetch domains: ${error.message}`, data: {} });
    } else {
      res.status(400).json({ success: false, msg: 'Failed to fetch domains: Unknown error', data: {} });
    }
  }
}
