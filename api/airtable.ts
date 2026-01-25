import type { VercelRequest, VercelResponse } from '@vercel/node';

// Configuration Airtable (sécurisée côté serveur)
const AIRTABLE_CONFIG = {
  apiKey: process.env.VITE_AIRTABLE_API_KEY || process.env.AIRTABLE_API_KEY,
  baseId: process.env.VITE_AIRTABLE_BASE_ID || process.env.AIRTABLE_BASE_ID
};

// Helper pour faire des requêtes à Airtable
const fetchAirtable = async (
  tableName: string,
  filterFormula: string = "",
  method: string = "GET",
  body?: any
) => {
  const url = filterFormula 
    ? `https://api.airtable.com/v0/${AIRTABLE_CONFIG.baseId}/${encodeURIComponent(tableName)}?filterByFormula=${encodeURIComponent(filterFormula)}`
    : `https://api.airtable.com/v0/${AIRTABLE_CONFIG.baseId}/${encodeURIComponent(tableName)}`;
  
  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${AIRTABLE_CONFIG.apiKey}`,
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Erreur de connexion Airtable");
  }

  return response.json();
};

// Handler principal de l'API
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action, tableName, filterFormula, recordId, fields } = req.body || {};

    // GET - Récupérer des enregistrements
    if (action === 'fetch') {
      const data = await fetchAirtable(tableName, filterFormula);
      return res.status(200).json(data);
    }

    // POST - Créer un enregistrement
    if (action === 'create') {
      const data = await fetchAirtable(tableName, '', 'POST', { fields });
      return res.status(200).json(data);
    }

    // PATCH - Mettre à jour un enregistrement
    if (action === 'update') {
      const url = `https://api.airtable.com/v0/${AIRTABLE_CONFIG.baseId}/${encodeURIComponent(tableName)}/${recordId}`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${AIRTABLE_CONFIG.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Erreur lors de la mise à jour");
      }

      const data = await response.json();
      return res.status(200).json(data);
    }

    return res.status(400).json({ error: 'Action non reconnue' });

  } catch (error: any) {
    console.error('Erreur API:', error);
    return res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
}
