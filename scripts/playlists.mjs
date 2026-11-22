// Crea y actualiza en la cuenta de Spotify de Yoana las playlists del banco:
//   "Banco de música · Recorrido completo": un tema de cada disco con link de Spotify, por año de grabación.
//   "Banco de música · <época>": lo mismo, solo con los discos de esa época.
// Uso: npm run playlists   (la primera vez pide autorizar en el navegador; ver docs/estado.md)
//
// - El tema de cada disco se elige una sola vez y queda en datos/spotify-playlists.json: al volver a correr,
//   los ya elegidos no cambian y solo se eligen los de los discos nuevos.
// - Cómo se elige: el tema que nombra la reseña (entre comillas); si no nombra ninguno, el primero que devuelve la
//   búsqueda de temas de Spotify para ese álbum (la API ya no da la popularidad, pero la búsqueda ordena en buena
//   parte por ella); si la búsqueda no sirve, el que se llama como el disco o el primero del álbum.
// - El script nunca les cambia el nombre ni la visibilidad (Spotify las crea públicas aunque se pida otra cosa, y la
//   API no deja cambiarlo: se hace en la app). Su contenido sí lo maneja el script: si falta o sobra algo, la
//   playlist se reescribe en el orden correcto (los cambios a mano se pisan).
// - Los botones del sitio aparecen después de "npm run playlists -- --publicar".
// - Una consulta por segundo como máximo. Si Spotify pide esperar más de dos minutos, guarda el avance, dice hasta
//   cuándo y termina; se vuelve a correr el mismo comando después.
// - El token de la cuenta queda en .spotify-sesion.json, que está en .gitignore.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const J = path.join(RAIZ, 'datos', 'jazz');
const ESTADO = path.join(RAIZ, 'datos', 'spotify-playlists.json');
const SESION = path.join(RAIZ, '.spotify-sesion.json');
const REDIRECCION = 'http://127.0.0.1:8080/callback';
const PERMISOS = 'playlist-modify-private playlist-modify-public playlist-read-private';
const ESPERA_MAXIMA = 120;
const PREFIJO = 'Banco de música · ';
const SITIO = 'https://yoanagonzalezz28-a11y.github.io/guia-musica/';

const leer = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const pausa = ms => new Promise(r => setTimeout(r, ms));
const estado = fs.existsSync(ESTADO) ? leer(ESTADO) : {};
estado.temas ||= {}; estado.playlists ||= {};
const guardar = () => fs.writeFileSync(ESTADO, JSON.stringify(estado, null, 1) + '\n');
const { SPOTIFY_CLIENT_ID: ID, SPOTIFY_CLIENT_SECRET: SECRETO } = process.env;
if (!ID || !SECRETO) { console.error('Faltan SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET en .env.'); process.exit(1); }

// ---------- Autorización (flujo "authorization code" con la Redirect URI de la app) ----------
let sesion = fs.existsSync(SESION) ? leer(SESION) : null;
const guardarSesion = () => fs.writeFileSync(SESION, JSON.stringify(sesion, null, 1) + '\n');
async function pedirToken(cuerpo) {
  const r = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: 'Basic ' + Buffer.from(`${ID}:${SECRETO}`).toString('base64') },
    body: new URLSearchParams(cuerpo),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Spotify no dio el token (${r.status} ${j.error || ''} ${j.error_description || ''}).`);
  return j;
}
function autorizar() {
  const clave = crypto.randomBytes(16).toString('hex');
  const url = `https://accounts.spotify.com/authorize?${new URLSearchParams({ client_id: ID, response_type: 'code', redirect_uri: REDIRECCION, scope: PERMISOS, state: clave, show_dialog: 'true' })}`;
  return new Promise((resolver, rechazar) => {
    const servidor = http.createServer(async (req, res) => {
      const u = new URL(req.url, REDIRECCION);
      if (u.pathname !== '/callback') { res.writeHead(404); return res.end(); }
      const responder = (txt, ok) => { res.writeHead(ok ? 200 : 400, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(`<!doctype html><meta charset="utf-8"><title>Banco de música</title><body style="font:18px system-ui;padding:40px"><p>${txt}</p></body>`); };
      if (u.searchParams.get('state') !== clave) return responder('Este link no corresponde a esta autorización. Volvé a la terminal.', false);
      if (u.searchParams.get('error')) { responder('No se autorizó. Podés cerrar esta pestaña.', false); servidor.close(); return rechazar(new Error(`Spotify respondió: ${u.searchParams.get('error')}.`)); }
      try {
        const t = await pedirToken({ grant_type: 'authorization_code', code: u.searchParams.get('code'), redirect_uri: REDIRECCION });
        sesion = { refresh_token: t.refresh_token, access_token: t.access_token, vence: Date.now() + (t.expires_in - 60) * 1000, permisos: t.scope };
        responder('Listo: el Banco de música ya puede crear las playlists. Podés cerrar esta pestaña y volver a la terminal.', true);
        servidor.close(); resolver();
      } catch (e) { responder('No se pudo terminar la autorización. Mirá la terminal.', false); servidor.close(); rechazar(e); }
    });
    servidor.on('error', e => rechazar(e.code === 'EADDRINUSE' ? new Error('El puerto 8080 está ocupado: cerrá el programa que lo usa y volvé a correr el script.') : e));
    servidor.listen(8080, '127.0.0.1', () => {
      console.log(`\nAutorización de Spotify. Abrí este link en el navegador (con la cuenta de Spotify donde querés las playlists):\n\n${url}\n\nEspero hasta 10 minutos...`);
    });
    setTimeout(() => { servidor.close(); rechazar(new Error('Pasaron 10 minutos sin autorizar. Volvé a correr el script.')); }, 10 * 60 * 1000).unref();
  });
}
async function tokenDeCuenta() {
  if (sesion?.access_token && Date.now() < sesion.vence) return sesion.access_token;
  const t = await pedirToken({ grant_type: 'refresh_token', refresh_token: sesion.refresh_token });
  sesion = { ...sesion, access_token: t.access_token, vence: Date.now() + (t.expires_in - 60) * 1000, ...(t.refresh_token ? { refresh_token: t.refresh_token } : {}) };
  guardarSesion();
  return sesion.access_token;
}

// ---------- API, a una consulta por segundo ----------
class Limite extends Error {}
class NoEncontrado extends Error {}
const bloqueos = new Map(); // tipo de consulta ("albums", "search", "playlists"…) → el aviso de Spotify
const tipoDe = ruta => ruta.replace('https://api.spotify.com/v1', '').split(/[/?]/)[1];
async function api(metodo, ruta, cuerpo) {
  if (bloqueos.has(tipoDe(ruta))) throw bloqueos.get(tipoDe(ruta));
  const url = ruta.startsWith('http') ? ruta : `https://api.spotify.com/v1${ruta}`;
  for (let intento = 0; intento < 5; ) {
    let r;
    try {
      r = await fetch(url, { method: metodo, headers: { Authorization: `Bearer ${await tokenDeCuenta()}`, ...(cuerpo ? { 'Content-Type': 'application/json' } : {}) }, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
    } catch { intento++; await pausa(5000); continue; }
    await pausa(1000);
    if (r.status === 429) {
      const seg = +r.headers.get('retry-after') || 30;
      // Spotify limita cada tipo de consulta por separado: el error dice cuál, para seguir con las otras.
      // hourCycle h23: sin eso, "es-AR" muestra 16:05 como "04:05", sin a. m. ni p. m.
      if (seg > ESPERA_MAXIMA) {
        const tipo = tipoDe(ruta);
        const e = new Limite(`${new Date(Date.now() + seg * 1000).toLocaleString('es-AR', { hourCycle: 'h23' })} (consultas de "${tipo}", ${Math.round(seg / 3600)} horas)`);
        e.tipo = tipo;
        bloqueos.set(tipo, e); // las próximas consultas de este tipo ni se intentan
        throw e;
      }
      await pausa(seg * 1000);
      continue;
    }
    if (r.status === 401) { sesion.vence = 0; intento++; continue; }
    if (r.status >= 500) { intento++; await pausa(3000); continue; }
    const texto = await r.text();
    if (r.status === 404) throw new NoEncontrado(`${metodo} ${ruta.split('?')[0]}: 404`);
    if (!r.ok) throw new Error(`Spotify respondió ${r.status} en ${metodo} ${ruta.split('?')[0]}: ${texto.slice(0, 200)}`);
    return texto ? JSON.parse(texto) : null;
  }
  throw new Error(`Spotify no respondió en ${metodo} ${ruta.split('?')[0]} después de varios intentos.`);
}
// En 2026 Spotify renombró algunas rutas de playlists (/tracks → /items). Se prueba la nueva y, si no existe, la vieja.
async function apiPlaylist(metodo, id, sufijo, cuerpo) {
  try { return await api(metodo, `/playlists/${id}/items${sufijo}`, cuerpo); } catch (e) {
    if (!(e instanceof NoEncontrado)) throw e;
    return api(metodo, `/playlists/${id}/tracks${sufijo}`, cuerpo);
  }
}

// ---------- Datos del banco ----------
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
// Nombre de un tema sin los agregados de Spotify: " - Remastered 1999", " - Live", "(feat. …)", "[Take 2]".
const limpio = s => norm(String(s).split(/ - /)[0].replace(/\(.*?\)|\[.*?\]/g, ' '));
const discos = fs.readdirSync(`${J}/discos`).map(f => leer(`${J}/discos/${f}`)).filter(d => d.spotify.estado === 'verificado' && d.spotify.url);
const corrientes = fs.readdirSync(`${J}/corrientes`).map(f => leer(`${J}/corrientes/${f}`)).sort((a, b) => a.periodo.desde - b.periodo.desde || a.nombre.localeCompare(b.nombre, 'es'));
const regiones = fs.readdirSync(`${J}/regiones`).map(f => leer(`${J}/regiones/${f}`));
// Lo que va entre comillas en las reseñas y no es un tema: nombres de épocas y de regiones ("la etapa 'Swing'").
const noSonTemas = new Set([...corrientes, ...regiones].map(x => norm(x.nombre)));
const albumDe = d => (d.spotify.url.match(/album\/([A-Za-z0-9]+)/) || [])[1];
const citas = d => [...[].concat(d.comentario || []).join(' ').matchAll(/["“«]([^"”»]{2,80})["”»]/g)].map(m => limpio(m[1])).filter(c => c && !noSonTemas.has(c));
const anioGrabacion = d => d.grabacion?.desde || d.edicion.anio;
const porAnio = (a, b) => anioGrabacion(a) - anioGrabacion(b) || a.edicion.anio - b.edicion.anio || a.titulo.localeCompare(b.titulo, 'es');

// ---------- 1. Elegir el tema de cada disco ----------
async function temasDelAlbum(id) {
  const a = await api('GET', `/albums/${id}?market=from_token`);
  const temas = [...a.tracks.items];
  for (let sig = a.tracks.next; sig; ) { const p = await api('GET', sig); temas.push(...p.items); sig = p.next; }
  return { nombre: a.name, artista: a.artists?.[0]?.name || '', temas: temas.filter(t => t && t.is_playable !== false && t.uri) };
}
// Primero una sola consulta: la búsqueda de temas trae el álbum de cada resultado. Si encuentra temas de este
// álbum, elige con ellos (el de la reseña o el primero). La lista completa del álbum se pide solo si la reseña
// nombra un tema que no vino en la búsqueda y quedan temas sin ver, o si la búsqueda no encontró el álbum.
// Spotify corta por cantidad de consultas (~1000 y después casi 12 horas de espera), así que cada una cuenta.
async function elegir(d, usados) {
  if (d.spotify.dentroDe) return elegirCompleto(d, usados);
  const album = albumDe(d);
  const nombre = (d.spotify.tituloEnSpotify || d.titulo).replace(/"/g, '');
  const res = await api('GET', `/search?type=track&limit=10&q=${encodeURIComponent(`album:"${nombre}" artist:"${d.credito.replace(/"/g, '')}"`)}`);
  const vistos = (res.tracks?.items || []).filter(r => r.album?.id === album);
  const libres = vistos.filter(r => !usados.has(r.uri));
  if (!libres.length) return elegirCompleto(d, usados);
  const elegido = (t, motivo) => ({ album, id: t.id, uri: t.uri, nombre: t.name, motivo });
  const cs = citas(d);
  for (const c of cs) { const t = libres.find(t => limpio(t.name) === c); if (t) return elegido(t, 'reseña'); }
  const total = vistos[0].album.total_tracks || 0;
  if (cs.length && new Set(vistos.map(t => t.id)).size < total) {
    const completo = await elegirCompleto(d, usados, { sinBusqueda: true });
    if (completo?.motivo === 'reseña') return completo;
  }
  return elegido(libres[0], 'búsqueda de Spotify');
}
async function elegirCompleto(d, usados, { sinBusqueda = false } = {}) {
  const album = albumDe(d);
  const { nombre, artista, temas } = await temasDelAlbum(album);
  const libres = temas.filter(t => !usados.has(t.uri)); // dos discos del banco pueden compartir un álbum de Spotify
  const elegido = (t, motivo) => ({ album, id: t.id, uri: t.uri, nombre: t.name, motivo });
  if (!libres.length) return null;
  // Un tema suelto que se escucha dentro de una recopilación: es el tema del título.
  if (d.spotify.dentroDe) { const t = libres.find(t => limpio(t.name) === limpio(d.titulo)); if (t) return elegido(t, 'tema del título (dentro de una recopilación)'); }
  for (const c of citas(d)) { const t = libres.find(t => limpio(t.name) === c); if (t) return elegido(t, 'reseña'); }
  if (sinBusqueda) return null;
  const q =`album:"${nombre.replace(/"/g, '')}"${artista ? ` artist:"${artista.replace(/"/g, '')}"` : ''}`;
  // Sin "market=from_token": en la búsqueda ese parámetro pide un permiso más (user-read-private) y da 403.
  const res = await api('GET', `/search?type=track&limit=10&q=${encodeURIComponent(q)}`);
  for (const r of res.tracks?.items || []) {
    const t = r.album?.id === album ? libres.find(x => x.id === r.id) || libres.find(x => limpio(x.name) === limpio(r.name)) : libres.find(x => limpio(x.name) === limpio(r.name));
    if (t) return elegido(t, 'búsqueda de Spotify');
  }
  const titulo = libres.find(t => [nombre, d.titulo].some(n => limpio(t.name) === limpio(n)));
  return titulo ? elegido(titulo, 'tema del título') : elegido(libres[0], 'primer tema del álbum');
}

// ---------- 2. Armar las playlists ----------
async function crearPlaylist(nombre, descripcion) {
  const cuerpo = { name: nombre, description: descripcion, public: false };
  try { return await api('POST', '/me/playlists', cuerpo); } catch (e) {
    if (!(e instanceof NoEncontrado)) throw e;
    return api('POST', `/users/${encodeURIComponent(sesion.usuario)}/playlists`, cuerpo);
  }
}
async function contenidoActual(id) {
  const uris = [];
  let pagina = await apiPlaylist('GET', id, '?limit=100');
  for (;;) {
    uris.push(...pagina.items.map(x => (x.item || x.track)?.uri).filter(Boolean));
    if (!pagina.next) return uris;
    pagina = await api('GET', pagina.next);
  }
}
async function sincronizarPlaylist(clave, nombre, descripcion, lista) {
  const uris = [...new Set(lista.map(d => estado.temas[d.id]?.uri).filter(Boolean))];
  let p = estado.playlists[clave];
  if (!p) {
    const nueva = await crearPlaylist(nombre, descripcion);
    p = estado.playlists[clave] = { id: nueva.id, url: nueva.external_urls?.spotify || `https://open.spotify.com/playlist/${nueva.id}`, nombre, publica: Object.values(estado.playlists).some(x => x.publica) };
    guardar();
    console.log(`Creada: ${nombre}`);
  }
  const actual = await contenidoActual(p.id);
  if (actual.join() !== uris.join()) {
    // Se reescribe entera, de a 100 (el máximo por pedido): la primera tanda reemplaza y las demás se agregan.
    await apiPlaylist('PUT', p.id, '', { uris: uris.slice(0, 100) });
    for (let i = 100; i < uris.length; i += 100) await apiPlaylist('POST', p.id, '', { uris: uris.slice(i, i + 100) });
    console.log(`${nombre}: ${actual.length} → ${uris.length} temas`);
  }
  // La visibilidad no se lee de Spotify: en 2026 la API ignora "public: false" al crear, responde 200 al cambiarla
  // sin cambiar nada y siempre dice "public: true". "publica" (los botones del sitio) la marca Yoana con --publicar.
  Object.assign(p, { temas: uris.length });
  guardar();
}

// ---------- Principal ----------
let limitado = null;
// "npm run playlists -- --publicar": después de revisarlas y hacerlas públicas en la app de Spotify, marca todas
// como publicadas para que el sitio muestre los botones. No consulta a Spotify.
if (process.argv.includes('--publicar')) {
  for (const p of Object.values(estado.playlists)) p.publica = true;
  guardar();
  console.log(`Marcadas como publicadas: ${Object.keys(estado.playlists).length}. Ahora: npm run construir y subir los cambios.`);
  process.exit(0);
}
try {
  if (!sesion?.refresh_token || process.argv.includes('--autorizar')) { await autorizar(); guardarSesion(); }
  if (!sesion.usuario) { const yo = await api('GET', '/me'); sesion.usuario = yo.id; sesion.nombre = yo.display_name; guardarSesion(); }
  console.log(`Cuenta de Spotify: ${sesion.nombre || sesion.usuario}.`);

  // Un tema ya elegido no cambia, salvo que el disco ahora apunte a otro álbum de Spotify.
  for (const [id, t] of Object.entries(estado.temas)) { const d = discos.find(x => x.id === id); if (!d || albumDe(d) !== t.album) delete estado.temas[id]; }
  const porElegir = discos.filter(d => !estado.temas[d.id]).sort(porAnio);
  console.log(`${discos.length} discos con link de Spotify: ${discos.length - porElegir.length} con tema elegido, faltan ${porElegir.length}.`);
  const usados = new Set(Object.values(estado.temas).map(t => t.uri));
  let n = 0, aplazados = 0;
  for (const d of porElegir) {
    let t = null;
    // Un álbum que ya no existe se saltea. Si Spotify bloquea la consulta de álbumes, el disco queda para la
    // próxima y se sigue con los que se resuelven con la búsqueda. Si bloquea la búsqueda, se deja de elegir y se
    // arman las playlists con lo que hay. Cualquier otro error (permisos) frena todo.
    try { t = await elegir(d, usados); } catch (e) {
      if (e instanceof Limite) { limitado ||= e.message; if (e.tipo === 'albums') { aplazados++; continue; } break; }
      if (!(e instanceof NoEncontrado)) throw e;
      console.log(`  ${d.titulo}: el álbum ya no está en Spotify (${e.message}).`);
    }
    if (t) { estado.temas[d.id] = t; usados.add(t.uri); } else console.log(`  ${d.titulo}: sin temas disponibles en Spotify; se vuelve a intentar la próxima vez.`);
    if (++n % 25 === 0) { guardar(); console.log(`${n} de ${porElegir.length}`); }
  }
  guardar();
  if (aplazados) console.log(`${aplazados} discos necesitan la lista completa del álbum y quedan para la próxima vuelta.`);

  const conTema = discos.filter(d => estado.temas[d.id]).sort(porAnio);
  await sincronizarPlaylist('recorrido', `${PREFIJO}Recorrido completo`, `Un tema de cada disco del Banco de música, por año de grabación. ${SITIO}`, conTema);
  for (const c of corrientes) {
    const lista = conTema.filter(d => d.corrientes.includes(c.id));
    if (!lista.length) continue;
    await sincronizarPlaylist(c.id, `${PREFIJO}${c.nombre}`, `${c.nombre}: un tema de cada disco de esta época del Banco de música, por año de grabación. ${SITIO}`, lista);
  }
} catch (e) {
  guardar();
  if (!(e instanceof Limite)) { console.error(`\n${e.message}`); process.exit(1); }
  limitado = limitado ? `${limitado}; ${e.message}` : e.message;
}

const motivos = {};
for (const t of Object.values(estado.temas)) motivos[t.motivo] = (motivos[t.motivo] || 0) + 1;
console.log(`\nTemas elegidos: ${Object.keys(estado.temas).length}. ${Object.entries(motivos).map(([m, k]) => `${m}: ${k}`).join(' · ')}`);
for (const p of Object.values(estado.playlists)) console.log(`${p.nombre} — ${p.temas ?? '?'} temas — ${p.publica ? 'con botón en el sitio' : 'sin botón en el sitio'} — ${p.url}`);
const faltan = discos.filter(d => !estado.temas[d.id]).length;
if (limitado) {
  console.log(`\nSpotify limitó las consultas: ${[...bloqueos.values()].map(e => e.message).join('; ') || limitado}. Faltan ${faltan} discos. El avance quedó guardado: volvé a correr "npm run playlists" después de esa hora.`);
  process.exitCode = 2;
} else console.log(`\nListo${faltan ? ` (${faltan} discos sin tema disponible)` : ''}. Para mostrar los botones en el sitio: "npm run playlists -- --publicar" y "npm run construir".`);
