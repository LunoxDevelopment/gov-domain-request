import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, domain as DomainType } from '@prisma/client';

const prisma = new PrismaClient();

async function findOrCreateDomain(domainParts: string[]): Promise<number> {
  let parentDomainId: number | null = null;

  for (const part of domainParts) {
    let domain: DomainType | null = await prisma.domain.findFirst({
      where: {
        domain_name: part,
        parent_domain_id: parentDomainId,
      },
    });

    if (!domain) {
      domain = await prisma.domain.create({
        data: {
          domain_name: part,
          parent_domain_id: parentDomainId,
        },
      });
    }

    parentDomainId = domain.id;
  }

  return parentDomainId!;
}

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

export default async function addDomain(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, msg: 'Method not allowed', data: {} });
  }

  const { requestId, requestToken, fqdn, reason, type, include_www } = req.body;

  const missingFields = [];
  if (!requestId && !requestToken) missingFields.push('requestId or requestToken');
  if (!fqdn) missingFields.push('fqdn');
  if (!reason) missingFields.push('reason');
  if (!type) missingFields.push('type');

  if (missingFields.length > 0) {
    return res.status(400).json({ success: false, msg: `You are required to insert the following fields: ${missingFields.join(', ')}`, data: {} });
  }

  try {
    let request;
    if (requestId) {
      request = await prisma.request.findUnique({ where: { id: Number(requestId) } });
    } else if (requestToken) {
      request = await prisma.request.findUnique({ where: { request_token: String(requestToken) } });
    }

    if (!request) {
      return res.status(404).json({ success: false, msg: 'Request not found', data: {} });
    }

    const domainParts = fqdn.split('.').reverse(); // Correct order for saving
    const topLevelDomainId = await findOrCreateDomain(domainParts);

    const newRequestDomain = await prisma.request_domain.create({
      data: {
        request_id: request.id,
        domain_id: topLevelDomainId,
        reason,
        type,
        include_www: include_www ?? false,
      },
    });

    const fullDomainName = await getFullDomainName(topLevelDomainId);

    res.status(201).json({
      success: true,
      msg: 'Domain added successfully',
      data: {
        request_domain_id: newRequestDomain.id,
        domain_id: topLevelDomainId,
        fqdn: fullDomainName,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ success: false, msg: `Domain addition failed: ${error.message}`, data: {} });
    } else {
      res.status(400).json({ success: false, msg: 'Domain addition failed: Unknown error', data: {} });
    }
  }
}
