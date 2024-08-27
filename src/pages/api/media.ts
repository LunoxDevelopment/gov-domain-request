import { NextApiRequest, NextApiResponse } from 'next';
import { join } from 'path';
import { promises as fs } from 'fs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path } = req.query;

  if (!path || Array.isArray(path)) {
    res.status(400).json({ error: 'Invalid path' });
    return;
  }

  // Define the base directory as the public/media directory within the application root
  const baseDirectory = join(process.cwd(), 'src', 'public', 'media');

  // Construct the full file path relative to the application root
  const filePath = join(baseDirectory, ...path.split('/'));

  console.log('Resolved file path:', filePath); // Log the resolved file path for debugging

  try {
    const file = await fs.readFile(filePath);
    res.setHeader('Content-Type', 'application/pdf'); // Adjust content-type based on your file type
    res.send(file);
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(404).json({ error: 'File not found' });
  }
}
