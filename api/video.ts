// Edge Function — proxy le flux vidéo Google Drive depuis notre propre domaine.
// Pourquoi : un <video> ne peut pas lire l'URL Drive en cross-origin (Google bloque,
// `uc?export=view` est déprécié) → le navigateur tombe sur l'iframe /preview de Drive,
// dont le lecteur (voile + engrenage) est non-stylable. En re-servant les octets en
// same-origin, notre <video> les lit et notre lecteur custom s'applique.
// Côté serveur, le flux Drive EST accessible (video/mp4 + support Range).

export const config = { runtime: 'edge' };

const ID_RE = /^[a-zA-Z0-9_-]{10,}$/;
const PASS_HEADERS = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified'];

export default async function handler(req: Request): Promise<Response> {
  const id = new URL(req.url).searchParams.get('id') || '';
  // Validation stricte : empêche tout SSRF, seul un id Drive alphanumérique est injecté.
  if (!ID_RE.test(id)) return new Response('Invalid id', { status: 400 });

  const range = req.headers.get('range');
  // `usercontent/download?export=download&confirm=t` sert le flux vidéo directement et
  // bypasse l'interstitiel antivirus de Google sur les fichiers > 100 Mo (`uc?export=view`
  // renvoyait une page HTML pour ces gros fichiers). Marche pour petits ET gros fichiers.
  const upstream = await fetch(`https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`, {
    headers: range ? { Range: range } : {},
    redirect: 'follow',
  });

  // 200 (complet) ou 206 (Range) = OK ; sinon on laisse le client basculer sur le fallback iframe.
  if (upstream.status !== 200 && upstream.status !== 206) {
    return new Response('Upstream unavailable', { status: 502 });
  }
  // Si Drive renvoie une page HTML (interstitiel antivirus gros fichier) au lieu de la vidéo,
  // on signale une erreur pour déclencher le fallback iframe côté client.
  const ct = upstream.headers.get('content-type') || '';
  if (ct.startsWith('text/html')) return new Response('Not a media stream', { status: 415 });

  const headers = new Headers();
  for (const h of PASS_HEADERS) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  if (!headers.has('accept-ranges')) headers.set('accept-ranges', 'bytes');
  // PAS de cache CDN : Vercel ne varie pas son cache sur le header Range et rejouerait
  // un même fragment (ex. les 1024 premiers octets) pour toutes les plages → vidéo illisible.
  headers.set('cache-control', 'no-store');

  return new Response(upstream.body, { status: upstream.status, headers });
}
