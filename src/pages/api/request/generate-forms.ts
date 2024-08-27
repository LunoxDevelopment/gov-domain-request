import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import Cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const prisma = new PrismaClient();
const execPromise = promisify(exec);

// Initialize the cors middleware
const cors = Cors({
  methods: ['POST'],
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

export default async function generateForms(req: NextApiRequest, res: NextApiResponse) {
  // Run the middleware
  await runMiddleware(req, res, cors);

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, msg: 'method_not_allowed', data: {} });
  }

  const { requestToken } = req.body;

  if (!requestToken) {
    return res.status(400).json({ success: false, msg: 'request_token_required', data: {} });
  }

  try {
    const request = await prisma.request.findUnique({
      where: { request_token: requestToken },
      select: {
        id: true,
        request_token: true,
        org_site_code: true,
        created_at: true,
        request_reason: true,
        request_status_id: true,
        owner_user_id: true,
        administrator_user_id: true,
        technical_user_id: true,
        content_developer_user_id: true,
        hosting_coordinator_user_id: true,
        hosting_place: true,
        address: true,
        email: true,
        contact_no: true,
        request_form_path: true,
        cover_letter_path: true,
      }
    });

    if (!request) {
      return res.status(404).json({ success: false, msg: 'request_not_found', data: {} });
    }

    // Check if the forms are already generated
    if (request.request_form_path && request.cover_letter_path) {
      return res.status(200).json({
        success: true,
        msg: 'forms_already_generated',
        data: {
          request_form_path: request.request_form_path,
          cover_letter_path: request.cover_letter_path
        }
      });
    }

    const scriptPath = path.join(process.cwd(), 'utils', 'generate_domain_request_forms.py');
    const command = `python3 "${scriptPath}" -t ${requestToken}`;


    // Execute the Python script
    const { stdout, stderr } = await execPromise(command);

    if (stderr) {
      throw new Error(stderr);
    }

    // Filter stdout to find paths
    const outputLines = stdout.trim().split('\n');
    let requestFormPath = outputLines.find(line => line.includes('Request_Form_'));
    let coverLetterPath = outputLines.find(line => line.includes('Cover_Letter_'));

    if (!requestFormPath || !coverLetterPath) {
      throw new Error('Could not find generated file paths in script output.');
    }

    // Normalize and clean paths
    requestFormPath = path.normalize(requestFormPath).replace(/\\/g, '/').replace(/\r/g, '').replace('/public', '');
    coverLetterPath = path.normalize(coverLetterPath).replace(/\\/g, '/').replace(/\r/g, '').replace('/public', '');

    // Update the database with the paths of the generated forms
    await prisma.request.update({
      where: { request_token: requestToken },
      data: {
        request_form_path: requestFormPath,
        cover_letter_path: coverLetterPath,
      },
    });

    res.status(200).json({
      success: true,
      msg: 'forms_generated_successfully',
      data: {
        request_form_path: requestFormPath,
        cover_letter_path: coverLetterPath
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ success: false, msg: `failed_to_generate_forms: ${error.message}`, data: {} });
    } else {
      res.status(400).json({ success: false, msg: 'failed_to_generate_forms: unknown_error', data: {} });
    }
  }
}
