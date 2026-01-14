import type { VercelRequest, VercelResponse } from '@vercel/node';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { videoId, title, comment, type } = req.body;

    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Feedbacks`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          'Vidéo': [videoId],
          'Titre': title,
          'Commentaire': comment,
          'Type': type
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create feedback');
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error: any) {
    console.error('Feedback API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
