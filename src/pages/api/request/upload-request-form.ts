import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import formidable, { IncomingForm, Fields, Files, File as FormidableFile } from 'formidable';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

export const config = {
  api: {
    bodyParser: false, // Disables body parsing for this route
  },
};

const uploadDir = path.join(process.cwd(), 'public', 'media', 'domain-request', 'uploads', 'request-form');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, msg: 'Method not allowed' });
  }

  const form = new IncomingForm({
    uploadDir,
    keepExtensions: true,
    multiples: false,
  });

  form.parse(req, async (err: any, fields: Fields, files: Files) => {
    if (err) {
      console.error('Form parse error:', err);
      return res.status(400).json({ success: false, msg: 'Error parsing form data' });
    }

    const token = Array.isArray(fields.token) ? fields.token[0] : fields.token;
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!token) {
      console.error('Token is missing in the form fields');
      return res.status(400).json({ success: false, msg: 'Token is missing' });
    }

    if (!file) {
      console.error('File is missing in the form fields');
      return res.status(400).json({ success: false, msg: 'File is missing' });
    }

    if (!allowedFileTypes.includes(file.mimetype || '')) {
      console.error('Invalid file type:', file.mimetype);
      return res.status(400).json({ success: false, msg: 'Only PDF or Image files are allowed' });
    }

    try {
      const request = await prisma.request.findUnique({ where: { request_token: token } });
      if (!request) {
        console.error('Invalid token:', token);
        return res.status(400).json({ success: false, msg: 'Invalid token' });
      }

      const fileExtension = path.extname(file.originalFilename || '');
      const fileName = `${request.org_site_code}_${request.id}${fileExtension}`;
      const newFilePath = path.join('public', 'media', 'domain-request', 'uploads', 'request-form', fileName);

      fs.renameSync(file.filepath, path.join(process.cwd(), newFilePath));

      await prisma.request.update({
        where: { request_token: token },
        data: { uploaded_request_form_path: newFilePath },
      });

      res.status(200).json({ success: true, msg: 'Request form uploaded successfully' });
    } catch (error) {
      console.error('Error updating request with request form path:', error);
      res.status(400).json({ success: false, msg: 'Error updating request with request form path' });
    }
  });
}
