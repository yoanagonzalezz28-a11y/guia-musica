// Busca en la API de Spotify el link exacto de los discos que todavía no lo tienen.
// Uso: npm run spotify   (lee SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET de .env)
//
// - Retoma desde donde quedó: el avance se guarda en datos/spotify-busqueda.json.
// - Aplica solo los resultados seguros (coincide el artista y el título es el mismo disco).
// - Los dudosos quedan con su link candidato en docs/sin-spotify.md, para revisar a mano.
// - Si Spotify pide esperar (error 429) más de dos minutos, guarda el avance, dice hasta cuándo
//   hay que esperar y termina. Se vuelve a correr el mismo comando después de esa hora.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const J = path.join(RAIZ, 'datos', 'jazz');
const AVANCE = path.join(RAIZ, 'datos', 'spotify-busqueda.json');
const DOC = path.join(RAIZ, 'docs', 'sin-spotify.md');
const ESPERA_MAXIMA = 120; // segundos que el script acepta esperar por su cuenta
const leer = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const pausa = ms => new Promise(r => setTimeout(r, ms));
const res = fs.existsSync(AVANCE) ? leer(AVANCE) : {};
const guardar = () => fs.writeFileSync(AVANCE, JSON.stringify(res, null, 1) + '\n');

if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
  console.error('Faltan SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET en .env.');
  process.exit(1);
}

// ---------- API ----------
let token = null, vence = 0;
async function obtenerToken() {
  if (token && Date.now() < vence) return token;
  const r = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: 'Basic ' + Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64') },
    body: 'grant_type=client_credentials',
  });
  if (!r.ok) throw new Error(`Spotify no dio el token (${r.status}). Revisá las credenciales de .env.`);
  const j = await r.json();
  token = j.access_token; vence = Date.now() + (j.expires_in - 60) * 1000;
  return token;
}
class Limite extends Error {}
// Devuelve los álbumes encontrados, o null si la consulta falló (ese disco queda para la próxima vuelta).
async function buscar(q) {
  for (let i = 0; i < 5; ) {
    let r;
    try {
      // La API acepta como máximo 10 resultados por búsqueda.
      r = await fetch(`https://api.spotify.com/v1/search?type=album&limit=10&q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${await obtenerToken()}` } });
    } catch { i++; await pausa(5000); continue; }
    if (r.status === 429) {
      const seg = +r.headers.get('retry-after') || 30;
      if (seg > ESPERA_MAXIMA) throw new Limite(new Date(Date.now() + seg * 1000).toLocaleString('es-AR'));
      await pausa(seg * 1000 + 1000);
      continue;
    }
    if (r.status === 401) { token = null; i++; continue; }
    if (!r.ok) { i++; await pausa(2000); continue; }
    await pausa(1000); // una consulta por segundo, para no disparar el límite
    return (await r.json()).albums?.items || [];
  }
  return null;
}

// ---------- Normalización y variantes ----------
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
const RUIDO = /\b(remaster(ed)?( \d{4})?|\d{4} remaster(ed)?|deluxe( edition)?|expanded( edition)?|edition|reissue|mono|stereo|version|anniversary|bonus tracks?|rudy van gelder|rvg|live|en vivo|the)\b/g;
const base = s => norm(String(s).replace(/\(.*?\)|\[.*?\]/g, ' ')).replace(RUIDO, ' ').replace(/\s+/g, ' ').trim();
const sinSubtitulo = s => String(s).split(/:| – | - /)[0].trim();
const sinVol = s => String(s).replace(/,?\s*vol(ume|\.)?\s*\d+/i, '').trim();
const artistaBase = s => norm(s).replace(/\b(the )?(trio|quartet|quintet|sextet|septet|octet|orchestra|big band|group|grupo|band|ensemble|and his [a-z ]+|and the [a-z ]+|y su [a-z ]+)\b.*$/, '').trim();

const musicos = new Map(fs.readdirSync(`${J}/musicos`).map(f => leer(`${J}/musicos/${f}`)).map(m => [m.id, m]));
const corrientes = fs.readdirSync(`${J}/corrientes`).map(f => leer(`${J}/corrientes/${f}`));
const esencial = new Map(); for (const c of corrientes) for (const e of c.discosEsenciales) esencial.set(e.disco, `para empezar ${c.nombre}`);
const clave = new Map(); for (const m of musicos.values()) for (const e of m.epocas) if (!clave.has(e.discoClave.disco)) clave.set(e.discoClave.disco, `disco clave de ${m.nombre}`);
const cinco = new Map(); for (const m of musicos.values()) for (const d of m.discosEsenciales || []) if (!cinco.has(d)) cinco.set(d, `esencial de ${m.nombre}`);
const nombreC = Object.fromEntries(corrientes.map(c => [c.id, c.nombre]));
const importanciaDe = d => (esencial.has(d.id) || clave.has(d.id) ? 'Alta' : cinco.has(d.id) ? 'Media' : 'Baja');

function artistasDe(d) {
  const a = new Set([d.credito, d.credito.replace(/\(.*?\)/g, '').trim()]);
  for (const m of d.credito.matchAll(/\(([^)]+)\)/g)) a.add(m[1]);
  for (const id of d.lideres) if (musicos.has(id)) a.add(musicos.get(id).nombre);
  for (const parte of d.credito.split(/ y | and | & |, /)) a.add(parte.trim());
  return [...a].filter(Boolean);
}
function titulosDe(d) {
  const t = new Set([d.titulo, sinSubtitulo(d.titulo), sinVol(d.titulo), sinVol(sinSubtitulo(d.titulo)), d.titulo.replace(/\(.*?\)/g, '').trim()]);
  if (d.tituloOriginal) t.add(d.tituloOriginal);
  return [...t].filter(Boolean);
}

// Criterio (desde el 10/11/2026): si el artista coincide y el título es muy parecido, se aplica.
// "Muy parecido" ignora subtítulos, "Remastered", "Deluxe", "Vol.", tildes, mayúsculas y el orden de las palabras.
// Se aceptan reediciones y versiones ampliadas. Un simple solo vale si el disco del banco es anterior a 1950
// (en esa época cada "disco" del banco suele ser un tema de 78 rpm); si no, es el tema del título y no el álbum.
const palabras = s => new Set(base(sinSubtitulo(s)).split(' ').filter(w => w && w !== 'vol' && w !== 'volume'));
function parecidos(a, b) {
  const A = palabras(a), B = palabras(b);
  if (!A.size || !B.size) return false;
  // Si los números no coinciden (Vol. 1 y Vol. 2, Jazz batá y Jazz batá 2), es otro disco.
  const nums = X => [...X].filter(w => /^d+$/.test(w)).sort().join(' ');
  if (nums(A) !== nums(B)) return false;
  const comunes = [...A].filter(w => B.has(w)).length;
  return comunes / Math.min(A.size, B.size) >= 0.8 && comunes / Math.max(A.size, B.size) >= 0.5;
}
const mismoArtista = (x, y) => x === y || (x.length > 3 && y.length > 3 && (x.includes(y) || y.includes(x))) ||
  (() => { const A = new Set(x.split(' ')), B = new Set(y.split(' ')); const c = [...A].filter(w => w.length > 2 && B.has(w)).length; return c >= 2 || (c === 1 && Math.min(A.size, B.size) === 1); })();
function evaluar(d, items) {
  const artistas = artistasDe(d).map(artistaBase).filter(Boolean);
  const titulos = titulosDe(d).filter(Boolean);
  const anio = d.edicion.anio;
  const candidatos = [];
  for (const a of items) {
    if (!a) continue;
    if (!a.artists.map(x => artistaBase(x.name)).some(x => artistas.some(y => mismoArtista(x, y)))) continue;
    const exacto = titulos.map(base).includes(base(a.name));
    if (!exacto && !titulos.some(t => parecidos(t, a.name))) continue;
    if (a.album_type === 'single' && a.total_tracks < 4 && anio >= 1950) continue;
    const anioA = +String(a.release_date).slice(0, 4);
    candidatos.push({ url: `https://open.spotify.com/album/${a.id}`, titulo: a.name, artistas: a.artists.map(x => x.name).join(', '), anio: anioA, pistas: a.total_tracks, exacto, remaster: /remaster/i.test(a.name) });
  }
  if (!candidatos.length) return null;
  candidatos.sort((x, y) => (y.exacto - x.exacto) || ((y.anio === anio) - (x.anio === anio)) || (y.remaster - x.remaster) || (y.pistas - x.pistas));
  const { remaster, exacto, ...c } = candidatos[0];
  return { estado: exacto && (c.anio === anio || anio >= 1950) ? 'seguro' : 'similitud', ...c, criterio: 2 };
}

// Los dudosos de la primera vuelta ya tienen su candidato: se vuelven a juzgar con el criterio nuevo sin consultar la API.
for (const [id, r] of Object.entries(res)) {
  if (r.estado !== 'dudoso') continue;
  const d = fs.existsSync(`${J}/discos/${id}.json`) ? leer(`${J}/discos/${id}.json`) : null;
  if (!d) continue;
  const simple = /simple/.test(r.motivo || '');
  res[id] = simple && d.edicion.anio >= 1950 ? { estado: 'no', revisar: true } : { ...r, estado: 'similitud', criterio: 2 };
}
// Los que no aparecieron con el criterio viejo se vuelven a buscar una vez con el nuevo.
for (const [id, r] of Object.entries(res)) if (r.estado === 'no' && r.criterio !== 2) delete res[id];

// ---------- Búsqueda ----------
const discos = () => fs.readdirSync(`${J}/discos`).map(f => leer(`${J}/discos/${f}`));
const porBuscar = discos().filter(d => !['verificado', 'fuera'].includes(d.spotify.estado) && !res[d.id]);
console.log(`${Object.keys(res).length} discos ya buscados; quedan ${porBuscar.length}.`);
let n = 0, limitado = null;
try {
  for (const d of porBuscar) {
    const artistas = artistasDe(d), titulos = titulosDe(d);
    const plan = [];
    for (const t of titulos) for (const a of artistas) plan.push(`album:"${t.replace(/"/g, '')}" artist:"${a.replace(/"/g, '')}"`);
    for (const t of titulos) plan.push(`${t} ${artistas[artistas.length > 1 ? 1 : 0]}`);
    let mejor = null, fallo = false;
    for (const q of [...new Set(plan)].slice(0, 12)) {
      const items = await buscar(q);
      if (items === null) { fallo = true; break; }
      const r = evaluar(d, items);
      if (r && (!mejor || (mejor.estado === 'similitud' && r.estado === 'seguro'))) mejor = r;
      if (mejor?.estado === 'seguro') break;
    }
    if (fallo && !mejor) continue; // sin respuesta: queda para la próxima vuelta
    res[d.id] = mejor || { estado: 'no', criterio: 2 };
    if (++n % 25 === 0) { guardar(); console.log(`${n} de ${porBuscar.length}`); }
  }
} catch (e) {
  if (!(e instanceof Limite)) throw e;
  limitado = e.message;
}
guardar();

// ---------- Aplicar y escribir la lista ----------
let aplicados = 0; const dudosos = [], sin = [], pendientes = [], similitud = [];
for (const d of discos()) {
  if (['verificado', 'fuera'].includes(d.spotify.estado)) continue;
  const r = res[d.id];
  const x = { d, importancia: importanciaDe(d), motivo: esencial.get(d.id) || clave.get(d.id) || cinco.get(d.id) || (d.corrientes[0] ? `discografía de ${nombreC[d.corrientes[0]]}` : ''), r };
  if (r?.estado === 'seguro' || r?.estado === 'similitud') {
    // "porSimilitud" queda solo en los datos: el sitio no lo muestra.
    d.spotify = { estado: 'verificado', url: r.url, tituloEnSpotify: r.titulo, via: 'api-spotify', ...(r.estado === 'similitud' ? { porSimilitud: true } : {}) };
    fs.writeFileSync(`${J}/discos/${d.id}.json`, JSON.stringify(d, null, 2) + '\n'); aplicados++;
    if (r.estado === 'similitud') similitud.push(x);
  } else if (r?.estado === 'dudoso') dudosos.push(x);
  else if (r?.estado === 'no') sin.push(x);
  else pendientes.push(x);
}
const orden = { Alta: 0, Media: 1, Baja: 2 };
for (const l of [dudosos, sin, pendientes]) l.sort((a, b) => orden[a.importancia] - orden[b.importancia] || a.d.edicion.anio - b.d.edicion.anio);
const cuenta = (l, k) => l.filter(x => x.importancia === k).length;
const resumen = l => `${l.length} (${cuenta(l, 'Alta')} alta, ${cuenta(l, 'Media')} media, ${cuenta(l, 'Baja')} baja)`;
const limpio = s => String(s).replace(/\|/g, '/');
const fila = x => `| ${limpio(x.d.titulo)} | ${limpio(x.d.credito)} | ${x.d.edicion.anio} | ${x.importancia} | ${x.motivo} |`;
const totalApi = discos().filter(d => d.spotify.via === 'api-spotify').length;
const totalSimilitud = discos().filter(d => d.spotify.porSimilitud).length;
// Muestra para revisar: uno de cada tantos, para que entren unos veinte.
const todosSimilitud = discos().filter(d => d.spotify.porSimilitud).sort((a, b) => a.edicion.anio - b.edicion.anio);
const paso = Math.max(1, Math.ceil(todosSimilitud.length / 20));
const muestra = todosSimilitud.filter((_, i) => i % paso === 0);
fs.writeFileSync(DOC, `# Discos sin link exacto de Spotify

Actualizado el ${new Date().toISOString().slice(0, 10)} con \`npm run spotify\` (búsqueda en la API de Spotify).

- **Encontrados y aplicados con la API:** ${totalApi}, de los cuales ${totalSimilitud} se aplicaron por similitud.
- **Dudosos, para revisar:** ${resumen(dudosos)}. No se aplicaron.
- **Sin aparecer:** ${resumen(sin)}.${pendientes.length ? `\n- **Todavía sin buscar:** ${pendientes.length}. Spotify limitó las consultas; hay que volver a correr \`npm run spotify\`${limitado ? ` después del ${limitado}` : ''}.` : ''}

Cómo se buscó: por artista y título, con variantes (sin subtítulo, sin "Vol.", con el título original, sin los agregados de reedición o edición ampliada) y con el nombre del líder cuando el crédito es de un grupo. Desde el 10/11/2026 se aplica directo si coincide el artista y el título es muy parecido (sin importar subtítulos, "Remastered", "Deluxe", "Vol.", tildes, mayúsculas ni el orden de las palabras), incluidas las reediciones y versiones ampliadas. Esos casos quedan marcados en los datos como \`porSimilitud\`; el sitio no lo muestra. Un simple solo se acepta si el disco del banco es anterior a 1950.

Importancia: **alta**, disco para empezar una época o disco clave de una etapa de un músico; **media**, entre los esenciales de un músico; **baja**, completa la discografía.

## Aplicados por similitud: muestra para revisar

Son ${totalSimilitud}. Esta es una muestra de ${muestra.length}, repartida por épocas. Si alguno está mal, alcanza con decir cuál.

| Título en el banco | Artista | Año | Quedó en Spotify como |
|---|---|---|---|
${muestra.map(d => `| ${limpio(d.titulo)} | ${limpio(d.credito)} | ${d.edicion.anio} | [${limpio(d.spotify.tituloEnSpotify)}](${d.spotify.url}) |`).join('\n')}

## Dudosos: revisar el link candidato

Para aprobar uno, alcanza con decir cuál. El motivo explica por qué no se aplicó solo.

| Título | Artista | Año | Importancia | Candidato en Spotify | Motivo |
|---|---|---|---|---|---|
${dudosos.map(x => `| ${limpio(x.d.titulo)} | ${limpio(x.d.credito)} | ${x.d.edicion.anio} | ${x.importancia} | [${limpio(x.r.titulo)} (${limpio(x.r.artistas)}, ${x.r.anio})](${x.r.url}) | ${x.r.motivo} |`).join('\n')}

## Sin aparecer en Spotify

| Título | Artista | Año | Importancia | Por qué está |
|---|---|---|---|---|
${sin.map(fila).join('\n')}
${pendientes.length ? `\n## Todavía sin buscar\n\n| Título | Artista | Año | Importancia | Por qué está |\n|---|---|---|---|---|\n${pendientes.map(fila).join('\n')}\n` : ''}`);

console.log(`Aplicados ahora: ${aplicados}. Dudosos: ${resumen(dudosos)}. Sin aparecer: ${resumen(sin)}. Sin buscar: ${pendientes.length}.`);
if (limitado) {
  console.log(`\nSpotify limitó las consultas. El avance quedó guardado. Volvé a correr "npm run spotify" después del ${limitado}.`);
  process.exitCode = 2;
} else console.log('Listo. Después: npm run construir, revisar y subir los cambios a GitHub.');
