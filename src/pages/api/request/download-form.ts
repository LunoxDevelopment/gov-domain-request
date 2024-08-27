import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import Cors from 'cors';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// Initialize the cors middleware
const cors = Cors({
  methods: ['GET'],
  origin: '*', // Allow all origins
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

export default async function downloadForm(req: NextApiRequest, res: NextApiResponse) {
  // Run the middleware
  await runMiddleware(req, res, cors);

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, msg: 'method_not_allowed', data: {} });
  }

  const { requestToken, type } = req.query;

  if (!requestToken || (type !== 'cover_letter' && type !== 'request_form')) {
    return res.status(400).json({ success: false, msg: 'invalid_parameters', data: {} });
  }

  try {
    const request = await prisma.request.findUnique({
      where: { request_token: String(requestToken) },
      select: {
        request_form_path: true,
        cover_letter_path: true,
      },
    });

    if (!request) {
      return res.status(404).json({ success: false, msg: 'request_not_found', data: {} });
    }

    let filePath: string | null = null;

    if (type === 'request_form') {
      filePath = request.request_form_path;
    } else if (type === 'cover_letter') {
      filePath = request.cover_letter_path;
    }

    if (!filePath) {
      return res.status(404).json({ success: false, msg: 'file_not_found', data: {} });
    }

    // Correct the base directory
    filePath = path.join(process.cwd(), 'src', 'public', filePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, msg: 'file_not_found_on_server', data: {} });
    }

    // Set headers to trigger the file download in the browser
    res.setHeader('Content-Disposition', `attachment; filename=${path.basename(filePath)}`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // Send the file for download
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ success: false, msg: `failed_to_download_file: ${error.message}`, data: {} });
    } else {
      res.status(500).json({ success: false, msg: 'failed_to_download_file: unknown_error', data: {} });
    }
  }
}
