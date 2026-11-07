// Vuelve a comprobar los links de todos los episodios y actualiza la fecha de verificación.
// Spotify: confirma con oEmbed que el episodio existe. Original: confirma que el link responde.
import fs from 'node:fs';
import path from 'node:path';
import { RAIZ } from './datos.mjs';

const DIR = path.join(RAIZ, 'datos', 'jazz', 'podcasts');
const CABECERAS = { 'User-Agent': 'banco-de-musica/0.1 (proyecto educativo)', Accept: '*/*' };
const HOY = new Date().toISOString().slice(0, 10);
const pausa = ms => new Promise(r => setTimeout(r, ms));
const responde = async url => {
  try {
    const r = await fetch(url, { headers: CABECERAS, redirect: 'follow', signal: AbortSignal.timeout(20000) });
    await r.arrayBuffer();
    return { ok: r.ok, http: r.status };
  } catch (e) { return { ok: false, http: e.name }; }
};

let revisados = 0;
const problemas = [];
for (const archivo of fs.readdirSync(DIR).filter(f => f.endsWith('.json'))) {
  const ruta = path.join(DIR, archivo);
  const programa = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  for (const e of programa.episodios) {
    const exacto = e.spotify.estado === 'verificado'
      ? await responde(`https://open.spotify.com/oembed?url=${encodeURIComponent(e.spotify.url)}`)
      : null;
    const original = e.original ? await responde(e.original) : null;
    const comprobado = exacto || original;
    const ok = Boolean(comprobado?.ok) && (!exacto || !original || exacto.ok);
    e.verificacion = { estado: ok ? 'verificado' : 'no-responde', http: comprobado?.http ?? null, fecha: HOY };
    if (!ok) problemas.push(`${programa.nombre}: ${e.titulo} (${comprobado?.http})`);
    revisados++;
    await pausa(250);
  }
  fs.writeFileSync(ruta, `${JSON.stringify(programa, null, 2)}\n`);
}
console.log(`${revisados} episodios revisados, ${problemas.length} con problemas.`);
problemas.forEach(p => console.log(`  ! ${p}`));
process.exitCode = problemas.length ? 1 : 0;
