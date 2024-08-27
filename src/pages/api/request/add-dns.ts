import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const dnsTypeMap: { [key: string]: number } = {
  a: 1,
  aaa: 2,
  cname: 3,
  txt: 4,
  ptr: 5,
  ns: 6,
  mx: 7,
  soa: 8,
  cca: 9,
  srv: 10,
  other: 11,
};

const dnsTypeFields: { [key: string]: { [key: string]: 'string' | 'number' } } = {
  a: { address: 'string', ttl: 'number' },
  aaa: { address: 'string', ttl: 'number' },
  cname: { cname: 'string', ttl: 'number' },
  txt: { txt: 'string', ttl: 'number' },
  ptr: { ptrdname: 'string', ttl: 'number' },
  ns: { nsdname: 'string', ttl: 'number' },
  mx: { exchange: 'string', priority: 'number', ttl: 'number' },
  soa: { mname: 'string', rname: 'string', serial: 'number', refresh: 'number', retry: 'number', expire: 'number', minimum: 'number' },
  cca: { flags: 'number', tag: 'string', value: 'string', ttl: 'number' },
  srv: { service: 'string', proto: 'string', name: 'string', priority: 'number', weight: 'number', port: 'number', target: 'string', ttl: 'number' },
  other: { content: 'string' },
};

async function getDnsTableName(dnsTypeId: number): Promise<string | null> {
  const dnsType = await prisma.dns_type.findUnique({
    where: { id: dnsTypeId },
  });
  return dnsType?.table_name || null;
}

async function getFullDomainName(domainId: number): Promise<string> {
  let domainParts: string[] = [];
  let currentDomain = await prisma.domain.findUnique({ where: { id: domainId } });

  while (currentDomain) {
    domainParts.push(currentDomain.domain_name); // Changed unshift to push
    currentDomain = currentDomain.parent_domain_id
      ? await prisma.domain.findUnique({ where: { id: currentDomain.parent_domain_id } })
      : null;
  }

  return domainParts.join('.');
}


function validateAndConvertValues(values: any, expectedFields: { [key: string]: 'string' | 'number' }) {
  for (const [key, expectedType] of Object.entries(expectedFields)) {
    if (values[key] !== undefined) {
      if (expectedType === 'number' && typeof values[key] === 'string' && /^\d+$/.test(values[key])) {
        values[key] = parseInt(values[key], 10);
      }
      if (typeof values[key] !== expectedType) {
        throw new Error(`Expected a ${expectedType} for ${key}, but got a ${typeof values[key]}`);
      }
    }
  }
  return values;
}

export default async function addDns(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, msg: 'Method not allowed', data: {} });
  }

  const { request_token, dns_records } = req.body;

  const missingFields = [];
  if (!request_token) missingFields.push('request_token');
  if (!dns_records) missingFields.push('dns_records');

  if (missingFields.length > 0) {
    return res.status(400).json({ success: false, msg: `Missing required fields: ${missingFields.join(', ')}`, data: {} });
  }

  try {
    const request = await prisma.request.findUnique({
      where: { request_token: String(request_token) },
    });

    if (!request) {
      return res.status(404).json({ success: false, msg: 'Request not found', data: {} });
    }

    for (const record of dns_records) {
      const { type, values, request_domain_id } = record;
      const dnsTypeId = dnsTypeMap[type.toLowerCase()];

      if (!dnsTypeId) {
        return res.status(400).json({ success: false, msg: `Invalid DNS record type: ${type}`, data: {} });
      }

      const requestDomain = await prisma.request_domain.findUnique({
        where: { id: request_domain_id },
        include: { domain: true },
      });

      if (!requestDomain) {
        return res.status(404).json({ success: false, msg: 'Request domain not found', data: {} });
      }

      const tableName = await getDnsTableName(dnsTypeId);
      const fqdn = await getFullDomainName(requestDomain.domain_id);

      if (!tableName) {
        return res.status(400).json({ success: false, msg: `DNS record type not found for: ${type}`, data: {} });
      }

      try {
        validateAndConvertValues(values, dnsTypeFields[type.toLowerCase()]);
      } catch (error) {
        if (error instanceof Error) {
          return res.status(400).json({
            success: false,
            msg: `In the Domain ${fqdn}, the ${type.toUpperCase()}'s value for ${error.message}`,
            data: {}
          });
        }
      }

      // Add debug logs
      console.log(`Processing DNS record type: ${type}`);
      console.log(`Using table: ${tableName}`);

      try {
        // Access the model dynamically by casting prisma to any
        const model = (prisma as any)[tableName];
        if (!model) {
          console.error(`Model not found for table: ${tableName}`);
          return res.status(500).json({
            success: false,
            msg: `Failed to create DNS record. Type: ${type}, Table: ${tableName}, Error: Model not found.`,
            data: {}
          });
        }

        const createdDnsRecordType = await model.create({
          data: values,
        });

        const createdDnsRecord = await prisma.dns_record.create({
          data: {
            dns_type_id: dnsTypeId,
            dns_record_id: createdDnsRecordType.id,
          },
        });

        await prisma.request_dns_record.create({
          data: {
            request_domain_id: Number(request_domain_id),
            dns_record_id: createdDnsRecord.id,
          },
        });
      } catch (innerError) {
        if (innerError instanceof Error) {
          return res.status(500).json({
            success: false,
            msg: `Failed to create DNS record. Type: ${type}, Table: ${tableName}, Error: ${innerError.message}`,
            data: {}
          });
        } else {
          return res.status(500).json({
            success: false,
            msg: `Failed to create DNS record. Type: ${type}, Table: ${tableName}, Unknown error occurred.`,
            data: {}
          });
        }
      }
    }

    res.status(201).json({ success: true, msg: 'DNS records added successfully', data: {} });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ success: false, msg: `DNS addition failed: ${error.message}`, data: {} });
    } else {
      res.status(500).json({ success: false, msg: 'DNS addition failed: Unknown error', data: {} });
    }
  }
}
