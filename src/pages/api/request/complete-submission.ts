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
    // Fetch request details
    const request = await prisma.request.findUnique({
      where: { request_token },
    });

    if (!request) {
      return res.status(400).json({ success: false, msg: 'Request not found' });
    }

    // Check if both cover letter and request letter are uploaded
    const coverLetterPath = request.uploaded_cover_letter_path || request.cover_letter_path;
    const requestFormPath = request.uploaded_request_form_path || request.request_form_path;

    if (!coverLetterPath || !requestFormPath) {
      return res.status(400).json({ success: false, msg: 'Both cover letter and request form must be uploaded' });
    }

    // Update the request status to "Uploaded Forms"
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

    // Fetch summary details using the GOV_LK_HOST environment variable
    const summaryResponse = await fetch(`${process.env.GOV_LK_HOST}/api/request/get-summary?requestToken=${request_token}`);
    const summaryData = await summaryResponse.json();
    if (!summaryData.success) {
      throw new Error('Failed to retrieve request summary');
    }

    const summary = summaryData.data;

    // Define upload directories
    const coverLetterDir = path.join(process.cwd(), 'public', 'media', 'domain-request', 'uploads', 'cover-letter');
    const requestFormDir = path.join(process.cwd(), 'public', 'media', 'domain-request', 'uploads', 'request-form');

    // Prepare file paths and attachment names
    const coverLetterAbsolutePath = path.join(coverLetterDir, path.basename(coverLetterPath));
    const requestFormAbsolutePath = path.join(requestFormDir, path.basename(requestFormPath));

    // Define transporter for sending emails
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER, // SMTP username
        pass: process.env.SMTP_PASS, // SMTP password
      },
    });

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.UPLOAD_NOTIFY_EMAIL,  // Use the email from .env
      subject: `Domain Request - ${summary.organization_name} - ${summary.requested_domains.map(domain => domain.fqdn).join(', ')}`,
      text: `Organization Name: ${summary.organization_name}\nDomains Requesting:\n${summary.requested_domains.map(domain => `- ${domain.fqdn}`).join('\n')}\nResource Records:\n${summary.requested_domains.map(domain => `Domain: ${domain.fqdn}\n${domain.dns_records.map(record => `  • ${record.type}: ${record.value}`).join('\n')}`).join('\n\n')}\nAdministrative Contact Information:\nName: ${summary.administrator.full_name}\nDesignation: ${summary.administrator.designation}\nEmail: ${summary.administrator.email}\nMobile: ${summary.administrator.mobile}`,
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
