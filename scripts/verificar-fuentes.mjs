// Compara cada disco con las fuentes externas y reporta lo que no coincide. No modifica los datos.
// Respeta el límite de MusicBrainz: una consulta por segundo.
import { cargarGenero } from './datos.mjs';

const CABECERAS = { 'User-Agent': 'banco-de-musica/0.1 (proyecto educativo)', Accept: 'application/json' };
const pausa = ms => new Promise(r => setTimeout(r, ms));
const normalizar = s => String(s || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/volume/g, 'vol').replace(/[^a-z0-9]/g, '');
const coincide = (a, b) => { const x = normalizar(a), y = normalizar(b); return Boolean(x && y) && (x.includes(y) || y.includes(x)); };

async function json(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: CABECERAS, signal: AbortSignal.timeout(20000) });
      if (r.status === 429 || r.status === 503) { await pausa(4000); continue; }
      return r.ok ? await r.json() : { _estado: r.status };
    } catch { await pausa(1500); }
  }
  return { _estado: 'sin respuesta' };
}

const g = cargarGenero('jazz');
let problemas = 0;
let confirmados = 0;
const avisar = (d, msg) => { problemas++; console.log(`  ! ${d.id}: ${msg}`); };

for (const d of g.discos) {
  const mb = d.ids.musicbrainz ? await json(`https://musicbrainz.org/ws/2/release-group/${d.ids.musicbrainz}?fmt=json`) : {};
  if (!d.ids.musicbrainz) console.log(`  · ${d.id}: sin ficha en MusicBrainz`);
  else if (mb._estado) avisar(d, `MusicBrainz respondió ${mb._estado}`);
  else if (!coincide(mb.title, d.titulo) && !coincide(mb.title, d.tituloOriginal)) avisar(d, `el título en MusicBrainz es "${mb.title}"`);
  else {
    confirmados++;
    const anioMb = Number(String(mb['first-release-date']).slice(0, 4));
    const explicado = d.discrepancias.some(x => x.campo === 'edición');
    if (anioMb && anioMb !== d.edicion.anio && !explicado) avisar(d, `MusicBrainz da ${anioMb}, la ficha ${d.edicion.anio} y no hay discrepancia anotada`);
  }
  if (d.ids.musicbrainz) await pausa(1100);

  if (d.ids.discogsMaster) {
    const dg = await json(`https://api.discogs.com/masters/${d.ids.discogsMaster}`);
    if (dg._estado) avisar(d, `Discogs respondió ${dg._estado}`);
    else if (!coincide(dg.title, d.titulo) && !coincide(dg.title, d.tituloOriginal)) avisar(d, `el título en Discogs es "${dg.title}" (master ${d.ids.discogsMaster})`);
    await pausa(1100);
  }

  if (d.spotify.estado === 'verificado') {
    const sp = await json(`https://open.spotify.com/oembed?url=${encodeURIComponent(d.spotify.url)}`);
    if (sp._estado) avisar(d, `Spotify respondió ${sp._estado}`);
    else if (sp.title !== d.spotify.tituloEnSpotify) avisar(d, `el título en Spotify es "${sp.title}", la ficha dice "${d.spotify.tituloEnSpotify}"`);
  }
}

for (const m of g.musicos.filter(x => x.spotify)) {
  const sp = await json(`https://open.spotify.com/oembed?url=${encodeURIComponent(m.spotify)}`);
  if (sp._estado) { problemas++; console.log(`  ! ${m.id}: Spotify respondió ${sp._estado}`); }
  else if (!coincide(sp.title, m.nombre)) { problemas++; console.log(`  ! ${m.id}: el artista en Spotify es "${sp.title}"`); }
}

console.log(`\n${g.discos.length} discos revisados, ${confirmados} confirmados en MusicBrainz, ${problemas} avisos.`);
process.exitCode = problemas ? 1 : 0;
