import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Debug endpoint to check environment variables (remove after testing)
  return res.status(200).json({
    hasApiKey: !!process.env.AIRTABLE_API_KEY,
    hasBaseId: !!process.env.AIRTABLE_BASE_ID,
    apiKeyPrefix: process.env.AIRTABLE_API_KEY ? process.env.AIRTABLE_API_KEY.substring(0, 8) + '...' : 'MISSING',
    baseIdPrefix: process.env.AIRTABLE_BASE_ID ? process.env.AIRTABLE_BASE_ID.substring(0, 8) + '...' : 'MISSING',
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('AIRTABLE') || k.includes('VITE'))
  });
}
