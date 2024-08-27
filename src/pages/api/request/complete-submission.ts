import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

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
    // Fetch request details including uploaded documents
    const request = await prisma.request.findUnique({
      where: { request_token },
      include: {
        documents: true, // Assuming there's a documents model related to requests
      },
    });

    if (!request) {
      return res.status(400).json({ success: false, msg: 'Request not found' });
    }

    // Check if both cover letter and request letter are uploaded
    const coverLetter = request.documents.find(doc => doc.type === 'cover_letter');
    const requestLetter = request.documents.find(doc => doc.type === 'request_letter');

    if (!coverLetter || !requestLetter) {
      return res.status(400).json({ success: false, msg: 'Both cover letter and request letter must be uploaded' });
    }

    // Update the request status to "Uploaded Forms"
    const uploadedFormsStatus = await prisma.request_status.findUnique({
      where: { name: 'Uploaded Forms' },
    });

    if (!uploadedFormsStatus) {
      return res.status(500).json({ success: false, msg: 'Uploaded Forms status not found' });
    }

    await prisma.request.update({
      where: { request_token },
      data: { request_status_id: uploadedFormsStatus.id },
    });

    // Fetch summary details using a relative URL
    const summaryResponse = await fetch(`/api/request/get-summary?requestToken=${request_token}`);
    const summaryData = await summaryResponse.json();
    if (!summaryData.success) {
      throw new Error('Failed to retrieve request summary');
    }

    const summary = summaryData.data;

    // Prepare email details
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Assuming the document file paths are stored in the database as `filepath`
    const coverLetterPath = path.join(process.cwd(), 'src', coverLetter.filepath);
    const requestLetterPath = path.join(process.cwd(), 'src', requestLetter.filepath);

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: 'helpdesk.noc.gov.lk',
      subject: `Domain Request - ${summary.organization_name} - ${summary.requested_domains.map(domain => domain.fqdn).join(', ')}`,
      text: `Organization Name: ${summary.organization_name}\nDomains Requesting: ${summary.requested_domains.map(domain => domain.fqdn).join(', ')}\nResource Records: ${summary.requested_domains.map(domain => `Domain: ${domain.fqdn}, DNS: ${domain.dns_records.map(record => `${record.type} - ${record.value}`).join(', ')}`).join('\n')}\nAdministrative Contact Information:\nName: ${summary.administrator.full_name}\nDesignation: ${summary.administrator.designation}\nEmail: ${summary.administrator.email}\nMobile: ${summary.administrator.mobile}`,
      attachments: [
        {
          filename: path.basename(coverLetter.filepath),
          path: coverLetterPath,
        },
        {
          filename: path.basename(requestLetter.filepath),
          path: requestLetterPath,
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
