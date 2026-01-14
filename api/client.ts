import type { VercelRequest, VercelResponse } from '@vercel/node';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

async function fetchAirtable(tableIdOrName: string, filterFormula?: string) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableIdOrName)}${
    filterFormula ? `?filterByFormula=${encodeURIComponent(filterFormula)}` : ''
  }`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Airtable API error: ${response.statusText}`);
  }

  return await response.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { clientId } = req.query;

    if (!clientId || typeof clientId !== 'string') {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    // Fetch client data
    const clientFormula = `RECORD_ID() = '${clientId}'`;
    const clientRes = await fetchAirtable('Clients', clientFormula);

    if (clientRes.records.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const clientRec = clientRes.records[0];
    const companyName = clientRec.fields['Nom du client'] || 'Société Inconnue';
    const safeCompanyName = companyName.replace(/'/g, "\\'");

    const client = {
      id: clientRec.id,
      companyName: companyName,
      logoUrl: clientRec.fields['Logo']?.[0]?.url || '',
      email: clientRec.fields['Email contact principal'] || '',
      status: clientRec.fields['Statut'] || 'Actif',
      type: clientRec.fields['Type de client'] || '',
      driveTournage: clientRec.fields['Drive Tournage'] || ''
    };

    // Fetch contracts
    const contractFormula = `FIND('${safeCompanyName}', {Clients}) > 0`;
    const contractRes = await fetchAirtable('Contrats', contractFormula);
    const contracts = contractRes.records.map((rec: any) => ({
      id: rec.id,
      name: rec.fields['Nom du contrat'] || '',
      type: rec.fields['Type de contrat'] || '',
      status: rec.fields['Statut du contrat'] || rec.fields['Statut contrat'] || 'Actif',
      totalVideos: rec.fields['Vidéos prévues'] || 0,
      deliveredVideos: rec.fields['Vidéos livrées'] || 0,
      startDate: rec.fields['Date de début'] || '',
      endDate: rec.fields['Date de fin'] || '',
      progressionPercent: rec.fields['Progression accomplissement du contrat %'] || 0,
      contractFileUrl: rec.fields['Contrat']?.[0]?.url || '',
      contractFileName: rec.fields['Contrat']?.[0]?.filename || ''
    }));

    // Fetch videos
    const videoFormula = `FIND('${safeCompanyName}', ARRAYJOIN({Lien client vidéo})) > 0`;
    const videoRes = await fetchAirtable('Vidéos', videoFormula);
    const videos = videoRes.records.map((rec: any) => ({
      id: rec.id,
      title: rec.fields['Titre vidéo'] || 'Sans titre',
      format: rec.fields['Format vidéo'] || '',
      language: rec.fields['Langue'] || '',
      status: rec.fields['Statut production'] || '📝 1. À brief',
      videoUrl: rec.fields['Lien Vidéo'] || rec.fields['Lien vidéo'] || rec.fields['Lien Video'] || '',
      driveUrl: rec.fields['Lien Drive'] || rec.fields['Lien drive'] || '',
      driveSessionUrl: rec.fields['Lien Drive Session (from Sessions de tournage)']?.[0] || '',
      priority: rec.fields['Priorité'] || '',
      progress: rec.fields['% Avancement'] || 0,
      deadline: rec.fields['Deadline V1'] || '',
      deliveryDate: rec.fields['Date livraison réelle'] || '',
      invoiceNumber: rec.fields['N° Facture'] || '',
      rushUrl: rec.fields['Lien rushes'] || rec.fields['Lien Rushes'] || rec.fields['Lien Rush'] || ''
    }));

    // Fetch team members
    const teamFormula = `FIND('${safeCompanyName}', ARRAYJOIN({Clients liés})) > 0`;
    const teamRes = await fetchAirtable('Équipe', teamFormula);
    const team = teamRes.records.map((rec: any) => ({
      id: rec.id,
      name: rec.fields['Nom complet'] || '',
      roles: rec.fields['Rôles'] || [],
      email: rec.fields['E-mail'] || '',
      whatsapp: rec.fields['WhatsApp'] || '',
      photoUrl: rec.fields['Photo']?.[0]?.url || ''
    }));

    return res.status(200).json({
      client,
      contracts,
      videos,
      team
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
