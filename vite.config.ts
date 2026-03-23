import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';

function airtableProxy(apiKey: string, baseId: string): Plugin {
  return {
    name: 'airtable-proxy',
    configureServer(server) {
      server.middlewares.use('/api/airtable', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          res.writeHead(200);
          res.end();
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const { action, tableName, filterFormula, recordId, fields } = JSON.parse(body);

            let url: string;
            let method = 'GET';
            let fetchBody: string | undefined;

            if (action === 'fetch') {
              url = filterFormula
                ? `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?filterByFormula=${encodeURIComponent(filterFormula)}`
                : `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;
            } else if (action === 'create') {
              url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;
              method = 'POST';
              fetchBody = JSON.stringify({ fields });
            } else if (action === 'update') {
              url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}/${recordId}`;
              method = 'PATCH';
              fetchBody = JSON.stringify({ fields });
            } else {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Action non reconnue' }));
              return;
            }

            const airtableRes = await fetch(url, {
              method,
              headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              },
              body: fetchBody
            });

            const data = await airtableRes.json();
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.writeHead(airtableRes.ok ? 200 : airtableRes.status);
            res.end(JSON.stringify(data));
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message || 'Erreur serveur' }));
          }
        });
      });
    }
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        airtableProxy(
          env.VITE_AIRTABLE_API_KEY || env.AIRTABLE_API_KEY || '',
          env.VITE_AIRTABLE_BASE_ID || env.AIRTABLE_BASE_ID || ''
        )
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
