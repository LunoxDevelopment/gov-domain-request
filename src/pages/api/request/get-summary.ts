import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import Cors from 'cors';

const prisma = new PrismaClient();

// Initialize the cors middleware
const cors = Cors({
  methods: ['GET', 'HEAD'],
  origin: '*',
});


function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: Function) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

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

  return domainParts.reverse().join('.');
}

type DNSRecordDetails = {
  id: number;
  ttl?: number | null;
  value?: string | null;
  m_name?: string | null;
  r_name?: string | null;
  serial?: number | null;
  refresh?: number | null;
  retry?: number | null;
  expire?: number | null;
  min_ttl?: number | null;
  flag?: number | null;
  tag?: string | null;
  service?: string | null;
  weight?: number | null;
  port?: number | null;
  target?: string | null;
};

async function getDNSRecordDetails(dnsType: string, dnsRecordId: number): Promise<DNSRecordDetails | null> {
  switch (dnsType) {
    case 'A':
      return await prisma.dns_a_record.findUnique({ where: { id: dnsRecordId } });
    case 'AAAA':
      return await prisma.dns_aaaa_record.findUnique({ where: { id: dnsRecordId } });
    case 'CNAME':
      return await prisma.dns_cname_record.findUnique({ where: { id: dnsRecordId } });
    case 'TXT':
      return await prisma.dns_txt_record.findUnique({ where: { id: dnsRecordId } });
    case 'PTR':
      return await prisma.dns_ptr_record.findUnique({ where: { id: dnsRecordId } });
    case 'NS':
      return await prisma.dns_ns_record.findUnique({ where: { id: dnsRecordId } });
    case 'MX':
      return await prisma.dns_mx_record.findUnique({ where: { id: dnsRecordId } });
    case 'SOA':
      return await prisma.dns_soa_record.findUnique({ where: { id: dnsRecordId } });
    case 'SRV':
      return await prisma.dns_srv_record.findUnique({ where: { id: dnsRecordId } });
    case 'CCA':
      return await prisma.cca_record.findUnique({ where: { id: dnsRecordId } });
    default:
      return null;
  }
}

async function getDNSRecords(requestDomainId: number) {
  const requestDNSRecords = await prisma.request_dns_record.findMany({
    where: { request_domain_id: requestDomainId },
    include: { dns_record: true },
  });

  const dnsRecords = await Promise.all(
    requestDNSRecords.map(async (record) => {
      const dnsType = await prisma.dns_type.findUnique({ where: { id: record.dns_record.dns_type_id } });
      if (!dnsType) return null;
      const dnsRecordDetails = await getDNSRecordDetails(dnsType.name, record.dns_record.dns_record_id);
      if (dnsRecordDetails) {
        const cleanedRecordDetails: { [key: string]: any } = {};
        for (const [key, value] of Object.entries(dnsRecordDetails)) {
          if (value !== null) {
            cleanedRecordDetails[key] = value;
          }
        }
        return {
          dns_record_id: record.dns_record.id, // ID of the dns_record table
          type_record_id: dnsRecordDetails.id, // ID of the specific DNS record type table
          type: dnsType.name,
          ...cleanedRecordDetails,
        };
      }
      return null;
    })
  );

  return dnsRecords.filter(record => record !== null);
}

async function getUserDetails(userId: number | null) {
  if (userId === null) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const { id, full_name, nic, mobile, email, designation } = user;

  const userDetails: { [key: string]: any } = { id, full_name, nic, mobile, email, designation };
  // Remove null values
  Object.keys(userDetails).forEach(key => userDetails[key] === null && delete userDetails[key]);

  return userDetails;
}

export default async function getSummary(req: NextApiRequest, res: NextApiResponse) {
  // Run the middleware
  await runMiddleware(req, res, cors);

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, msg: 'method_not_allowed', data: {} });
  }

  const { requestToken } = req.query;

  if (!requestToken) {
    return res.status(400).json({ success: false, msg: 'request_token_required', data: {} });
  }

  try {
    const request = await prisma.request.findUnique({ where: { request_token: String(requestToken) } });

    if (!request) {
      return res.status(404).json({ success: false, msg: 'request_not_found', data: {} });
    }

    let organization_name = '';

    try {
      const orgResponse = await fetch(`${process.env.GOV_API_HOST}/api/organization/get-org-name?site_code=${request.org_site_code}`);
      const orgData = await orgResponse.json();
      organization_name = orgData.data.name || '';
    } catch (orgError) {
      // Handle error and keep organization_name as a blank string
      organization_name = ''; 
    }

    const requestDomains = await prisma.request_domain.findMany({
      where: { request_id: request.id },
      include: { domain: true },
    });

    const domains = await Promise.all(
      requestDomains.map(async (requestDomain) => ({
        domain_id: requestDomain.domain_id,
        request_domain_id: requestDomain.id,
        fqdn: await getFullDomainName(requestDomain.domain_id),
        dns_records: await getDNSRecords(requestDomain.id),
        reason: requestDomain.reason,
        include_www: requestDomain.include_www,
      }))
    );

    const organization_head = await getUserDetails(request.owner_user_id);
    const administrator = await getUserDetails(request.administrator_user_id);
    const technical_contact = await getUserDetails(request.technical_user_id);
    const content_developer = await getUserDetails(request.content_developer_user_id);
    const hosting_coordinator = await getUserDetails(request.hosting_coordinator_user_id);

    const summary: { [key: string]: any } = {
      request_id: request.id,
      site_code: request.org_site_code,
      organization_name,
      request_reason: request.request_reason,
      address: request.address,
      email: request.email,
      contact_no: request.contact_no,
      requested_domains: domains,
      organization_head,
      administrator,
      technical_contact,
      content_developer,
      hosting_provider: request.hosting_place,
      hosting_coordinator,
    };

    // Remove null values from summary
    Object.keys(summary).forEach(key => summary[key] === null && delete summary[key]);

    res.status(200).json({ success: true, msg: 'summary_retrieved_successfully', data: summary });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ success: false, msg: `failed_to_retrieve_summary: ${error.message}`, data: {} });
    } else {
      res.status(400).json({ success: false, msg: 'failed_to_retrieve_summary: unknown_error', data: {} });
    }
  }
}
