import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function submitContacts(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, msg: 'Method not allowed', data: {} });
  }

  const {
    request_id,
    request_token,
    owner_user_id,
    administrator_user_id,
    technical_user_id,
    content_developer_user_id,
    hosting_coordinator_user_id,
    hosting_place,
    address,
    email,
    contact_no
  } = req.body;

  // Validate the presence of either request_id or request_token
  if (!request_id && !request_token) {
    return res.status(400).json({ success: false, msg: 'Either request_id or request_token is required', data: {} });
  }

  // Validate contact number
  if (contact_no) {
    const contactNoStr = contact_no.toString();
    if (!/^[0-9]{10}$/.test(contactNoStr) || !contactNoStr.startsWith('0')) {
      return res.status(400).json({ success: false, msg: 'Invalid contact number. It should start with 0 and contain exactly 10 digits.', data: {} });
    }
  }

  // Validate email
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, msg: 'Invalid email format.', data: {} });
    }
  }

  try {
    // Find the request by id or token
    const request = await prisma.request.findFirst({
      where: {
        OR: [
          { id: request_id },
          { request_token: request_token }
        ]
      }
    });

    if (!request) {
      return res.status(404).json({ success: false, msg: 'Request not found', data: {} });
    }

    // Update the request with provided user IDs, hosting place, address, email, and contact number
    await prisma.request.update({
      where: { id: request.id },
      data: {
        owner_user_id: owner_user_id ? parseInt(owner_user_id) : request.owner_user_id,
        administrator_user_id: administrator_user_id ? parseInt(administrator_user_id) : request.administrator_user_id,
        technical_user_id: technical_user_id ? parseInt(technical_user_id) : request.technical_user_id,
        content_developer_user_id: content_developer_user_id ? parseInt(content_developer_user_id) : request.content_developer_user_id,
        hosting_coordinator_user_id: hosting_coordinator_user_id ? parseInt(hosting_coordinator_user_id) : request.hosting_coordinator_user_id,
        hosting_place: hosting_place || request.hosting_place,
        address: address || request.address,
        email: email || request.email,
        contact_no: contact_no ? parseInt(contact_no) : request.contact_no
      },
    });

    res.status(200).json({ success: true, msg: 'Request updated successfully' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ success: false, msg: `Request update failed: ${error.message}`, data: {} });
    } else {
      res.status(400).json({ success: false, msg: 'Request update failed: Unknown error', data: {} });
    }
  }
}
