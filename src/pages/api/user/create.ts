import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper functions for validation
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateMobile = (mobile: string): boolean => {
  const mobileRegex = /^0\d{9}$/;
  return mobileRegex.test(mobile);
};

const validateNic = (nic: string): boolean => {
  const nicType1Regex = /^\d{9}[vVxX]$/;
  const nicType2Regex = /^(19|20)\d{10}$/;

  if (nicType1Regex.test(nic)) {
    return true;
  } else if (nicType2Regex.test(nic)) {
    return true;
  }
  return false;
};

const formatNic = (nic: string): string => {
  if (nic.length === 10) {
    return nic.toLowerCase();
  }
  return nic;
};

export default async function createUser(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, msg: 'Method not allowed', data: {} });
  }

  const { fullName, email, mobile, nic, employee, designation } = req.body;

  // Required field validation
  if (!fullName) {
    return res.status(400).json({ success: false, msg: 'Full name is required', data: {} });
  }

  // Validate email if provided
  if (email && !validateEmail(email)) {
    return res.status(400).json({ success: false, msg: 'Invalid email format', data: {} });
  }

  // Validate mobile if provided
  if (mobile && !validateMobile(mobile)) {
    return res.status(400).json({ success: false, msg: 'Invalid mobile format. Mobile must start with 0 and have 10 digits', data: {} });
  }

  // Validate NIC if provided
  if (nic && !validateNic(nic)) {
    return res.status(400).json({ success: false, msg: 'Invalid NIC format', data: {} });
  }

  try {
    const userData: any = {
      full_name: fullName,
    };

    // Add optional fields if present in the payload
    if (email) userData.email = email;
    if (mobile) userData.mobile = parseInt(mobile, 10);
    if (nic) userData.nic = formatNic(nic);
    if (typeof employee === 'boolean') userData.employee = employee;
    if (designation) userData.designation = designation;

    const newUser = await prisma.user.create({
      data: userData,
    });

    res.status(201).json({ 
      success: true, 
      msg: 'User created successfully', 
      data: { 
        id: newUser.id,
        fullName: newUser.full_name
      } 
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ success: false, msg: `User creation failed: ${error.message}`, data: {} });
    } else {
      res.status(400).json({ success: false, msg: 'User creation failed: Unknown error', data: {} });
    }
  }
}
