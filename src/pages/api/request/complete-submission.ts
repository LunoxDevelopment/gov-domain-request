import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

interface DnsRecord {
  type: string;
  address?: string;
  ttl?: number;
  cname?: string;
  txt?: string;
  ptrdname?: string;
  nsdname?: string;
  exchange?: string;
  priority?: number;
  mname?: string;
  rname?: string;
  serial?: number;
  refresh?: number;
  retry?: number;
  expire?: number;
  minimum?: number;
  flags?: number;
  tag?: string;
  value?: string;
  service?: string;
  proto?: string;
  name?: string;
  weight?: number;
  port?: number;
  target?: string;
  content?: string;
}

interface RequestedDomain {
  fqdn: string;
  dns_records: DnsRecord[];
}

interface Summary {
  organization_name: string;
  requested_domains: RequestedDomain[];
  administrator: {
    full_name: string;
    designation: string;
    email: string;
    mobile: string;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, msg: 'Method not allowed' });
  }

  const { request_token } = req.body;

  if (!request_token) {
    return res.status(400).json({ success: false, msg: 'Request token is required' });
  }

  try {
    const request = await prisma.request.findUnique({
      where: { request_token },
    });

    if (!request) {
      return res.status(400).json({ success: false, msg: 'Request not found' });
    }

    const coverLetterPath = request.uploaded_cover_letter_path || request.cover_letter_path;
    const requestFormPath = request.uploaded_request_form_path || request.request_form_path;

    if (!coverLetterPath || !requestFormPath) {
      return res.status(400).json({ success: false, msg: 'Both cover letter and request form must be uploaded' });
    }

    const uploadedFormsStatus = await prisma.request_status.findFirst({
      where: { name: 'Uploaded Forms' },
    });

    if (!uploadedFormsStatus) {
      return res.status(500).json({ success: false, msg: 'Uploaded Forms status not found' });
    }

    await prisma.request.update({
      where: { request_token },
      data: { request_status_id: uploadedFormsStatus.id },
    });

    const summaryResponse = await fetch(`${process.env.GOV_LK_HOST}/api/request/get-summary?requestToken=${request_token}`);
    const summaryData = await summaryResponse.json();
    if (!summaryData.success) {
      throw new Error('Failed to retrieve request summary');
    }

    const summary: Summary = summaryData.data;

    const coverLetterDir = path.join(process.cwd(), 'public', 'media', 'domain-request', 'uploads', 'cover-letter');
    const requestFormDir = path.join(process.cwd(), 'public', 'media', 'domain-request', 'uploads', 'request-form');

    const coverLetterAbsolutePath = path.join(coverLetterDir, path.basename(coverLetterPath));
    const requestFormAbsolutePath = path.join(requestFormDir, path.basename(requestFormPath));

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST as string,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER as string,
        pass: process.env.SMTP_PASS as string,
      },
      requireTLS: process.env.SMTP_REQUIRE_TLS === 'true',
      tls: {
        rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED === 'true',
      },
    });

    const formatDnsRecord = (record: DnsRecord) => {
      switch (record.type.toLowerCase()) {
        case 'a':
        case 'aaa':
          return `  • ${record.type.toUpperCase()}: Address: ${record.address}, TTL: ${record.ttl}`;
        case 'cname':
          return `  • ${record.type.toUpperCase()}: CNAME: ${record.cname}, TTL: ${record.ttl}`;
        case 'txt':
          return `  • ${record.type.toUpperCase()}: TXT: ${record.txt}, TTL: ${record.ttl}`;
        case 'ptr':
          return `  • ${record.type.toUpperCase()}: PTRDNAME: ${record.ptrdname}, TTL: ${record.ttl}`;
        case 'ns':
          return `  • ${record.type.toUpperCase()}: NSDNAME: ${record.nsdname}, TTL: ${record.ttl}`;
        case 'mx':
          return `  • ${record.type.toUpperCase()}: Exchange: ${record.exchange}, Priority: ${record.priority}, TTL: ${record.ttl}`;
        case 'soa':
          return `  • ${record.type.toUpperCase()}: MNAME: ${record.mname}, RNAME: ${record.rname}, Serial: ${record.serial}, Refresh: ${record.refresh}, Retry: ${record.retry}, Expire: ${record.expire}, Minimum: ${record.minimum}`;
        case 'cca':
          return `  • ${record.type.toUpperCase()}: Flags: ${record.flags}, Tag: ${record.tag}, Value: ${record.value}, TTL: ${record.ttl}`;
        case 'srv':
          return `  • ${record.type.toUpperCase()}: Service: ${record.service}, Proto: ${record.proto}, Name: ${record.name}, Priority: ${record.priority}, Weight: ${record.weight}, Port: ${record.port}, Target: ${record.target}, TTL: ${record.ttl}`;
        case 'other':
          return `  • ${record.type.toUpperCase()}: Content: ${record.content}`;
        default:
          return `  • ${record.type.toUpperCase()}: ${JSON.stringify(record)}`;
      }
    };

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.UPLOAD_NOTIFY_EMAIL,
      subject: `Domain Request - **${summary.organization_name}** - ${summary.requested_domains.map((domain) => domain.fqdn).join(', ')}`,
      text: `**Organization Name**: ${summary.organization_name}
**Domains Requesting**:
${summary.requested_domains.map((domain) => `- **${domain.fqdn}**`).join('\n')}
**Resource Records**:
${summary.requested_domains.map((domain) => `**Domain**: **${domain.fqdn}**
${domain.dns_records.map(formatDnsRecord).join('\n')}`).join('\n\n')}
**Administrative Contact Information**:
**Name**: ${summary.administrator.full_name}
**Designation**: ${summary.administrator.designation}
**Email**: ${summary.administrator.email}
**Mobile**: ${summary.administrator.mobile}`,
      attachments: [
        {
          filename: `Cover_Letter_${path.basename(coverLetterPath)}`,
          path: coverLetterAbsolutePath,
        },
        {
          filename: `Request_Form_${path.basename(requestFormPath)}`,
          path: requestFormAbsolutePath,
        },
      ],
    };

    await transporter.sendMail(mailOptions);

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
