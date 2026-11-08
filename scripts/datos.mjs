// Carga los JSON de datos/, calcula las relaciones inversas y valida todo el conjunto.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const coleccion = dir => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().map(f => ({ ...leer(path.join(dir, f)), _archivo: f }));
};

export function cargarGenero(id) {
  const dir = path.join(RAIZ, 'datos', id);
  const g = {
    ...leer(path.join(dir, 'genero.json')),
    corrientes: coleccion(path.join(dir, 'corrientes')),
    regiones: coleccion(path.join(dir, 'regiones')),
    musicos: coleccion(path.join(dir, 'musicos')),
    discos: coleccion(path.join(dir, 'discos')),
    comparaciones: coleccion(path.join(dir, 'comparaciones')),
    podcasts: coleccion(path.join(dir, 'podcasts')),
    audiovisual: coleccion(path.join(dir, 'audiovisual')),
  };
  g.por = {
    corriente: new Map(g.corrientes.map(x => [x.id, x])),
    region: new Map(g.regiones.map(x => [x.id, x])),
    musico: new Map(g.musicos.map(x => [x.id, x])),
    disco: new Map(g.discos.map(x => [x.id, x])),
  };
  g.episodios = g.podcasts.flatMap(p => p.episodios.map(e => ({ ...e, programa: p })));
  resolverTemas(g);
  return g;
}

const claveTema = s => String(s).toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^a-z0-9]+/g, ' ').trim();

// Un tema se conecta solo con una ficha cuando existe: así un episodio no hay que tocarlo al cargar a su músico.
function resolverTemas(g) {
  const indice = new Map();
  const sumar = (nombre, tipo, id) => {
    const k = claveTema(nombre);
    if (!indice.has(k)) indice.set(k, []);
    indice.get(k).push([tipo, id]);
  };
  g.corrientes.forEach(c => [c.nombre, ...(c.alias || [])].forEach(n => sumar(n, 'corriente', c.id)));
  g.regiones.forEach(r => sumar(r.nombre, 'region', r.id));
  g.musicos.forEach(m => sumar(m.nombre, 'musico', m.id));
  g.discos.forEach(d => sumar(d.titulo, 'disco', d.id));
  for (const e of g.episodios) {
    e.refs = { corriente: [], region: [], musico: [], disco: [] };
    e.temasSinFicha = [];
    for (const t of e.temas) {
      const hallados = indice.get(claveTema(t));
      if (!hallados) { e.temasSinFicha.push(t); continue; }
      hallados.forEach(([tipo, id]) => { if (!e.refs[tipo].includes(id)) e.refs[tipo].push(id); });
    }
  }
}

// Primero lo que se puede escuchar con un toque, y dentro de eso lo más reciente.
export function episodiosDe(g, tipo, id) {
  const peso = e => (e.spotify.estado === 'verificado' ? 0 : e.spotify.estado === 'busqueda' ? 1 : 2);
  return g.episodios
    .filter(e => e.refs[tipo].includes(id))
    .sort((a, b) => peso(a) - peso(b) || String(b.fecha).localeCompare(String(a.fecha)));
}

export const cargarFuentes = () => leer(path.join(RAIZ, 'datos', 'fuentes.json'));
export const cargarGeneros = () => leer(path.join(RAIZ, 'datos', 'generos.json'));

// Relaciones que nunca se escriben a mano: siempre salen de la lista de músicos de cada disco.
export const discosDe = (g, musicoId) => g.discos.filter(d => d.musicos.some(m => m.musico === musicoId));

export function tocoCon(g, musicoId) {
  const veces = new Map();
  for (const d of discosDe(g, musicoId)) {
    for (const m of new Set(d.musicos.map(x => x.musico).filter(Boolean))) {
      if (m !== musicoId) veces.set(m, (veces.get(m) || 0) + 1);
    }
  }
  return [...veces].sort((a, b) => b[1] - a[1]).map(([id, n]) => ({ id, n }));
}

export function musicosEnAmbas(g, a, b) {
  const en = c => new Set(g.discos.filter(d => d.corrientes.includes(c)).flatMap(d => d.musicos.map(m => m.musico)).filter(Boolean));
  const ea = en(a), eb = en(b);
  return [...ea].filter(id => eb.has(id));
}

const CITA = /\[\^([a-z0-9-]+)\]/g;
const ACCESOS = new Set(['completa', 'extracto', 'indirecta']);
const NIVELES = new Set(['musico', 'guia-critica', 'especialista', 'prensa', 'referencia']);

// Cada disco y cada músico necesita al menos dos fuentes distintas.
export function fuentesDe(x) {
  const ids = new Set((x.respaldo || []).map(r => r.fuente));
  (x.fuentes || []).forEach(f => ids.add(f));
  if (x.ids?.wikipedia) ids.add(`wikipedia:${x.ids.wikipedia}`);
  return ids;
}
const REV = new Set(['borrador', 'revisado']);

export function validar(g, fuentes) {
  const errores = [];
  const avisos = [];
  const err = (donde, msg) => errores.push(`${donde}: ${msg}`);
  const aviso = (donde, msg) => avisos.push(`${donde}: ${msg}`);
  for (const [id, f] of Object.entries(fuentes)) {
    if (!NIVELES.has(f.nivel)) aviso(`fuente ${id}`, 'nivel inválido');
    if (f.url && !/^https?:\/\/[^\s]+$/.test(f.url)) err(`fuente ${id}`, `link mal formado: ${f.url}`);
  }

  const revisarTexto = (donde, valor) => {
    if (typeof valor === 'string') {
      for (const [, id] of valor.matchAll(CITA)) {
        if (!fuentes[id]) err(donde, `cita una fuente que no existe: ${id}`);
        else if (fuentes[id].estado !== 'consultada') aviso(donde, `cita "${id}", que todavía no se consultó`);
      }
    } else if (Array.isArray(valor)) valor.forEach(v => revisarTexto(donde, v));
    else if (valor && typeof valor === 'object') Object.values(valor).forEach(v => revisarTexto(donde, v));
  };
  const revisarRespaldo = (donde, x) => {
    for (const r of x.respaldo || []) {
      if (!fuentes[r.fuente]) err(donde, `fuente de respaldo inexistente: ${r.fuente}`);
      if (!ACCESOS.has(r.acceso)) aviso(donde, `acceso inválido en ${r.fuente}: debe ser completa, extracto o indirecta`);
      if (!r.aporta) aviso(donde, `el respaldo ${r.fuente} necesita decir qué aporta`);
    }
    const n = fuentesDe(x).size;
    if (n === 0) aviso(donde, 'no tiene ninguna fuente');
    if (n < 2 && x.verificacion !== 'sin-verificar') aviso(donde, `tiene ${n} fuente(s): marcala como verificacion "sin-verificar"`);
    if (x.redescubrimiento && !x.redescubrimiento.motivo) aviso(donde, 'un redescubrimiento necesita explicar el motivo');
  };
  const existe = (donde, mapa, id, tipo) => { if (!mapa.has(id)) err(donde, `${tipo} inexistente: ${id}`); };
  const base = (donde, x) => {
    if (x._archivo !== `${x.id}.json`) err(donde, `el id "${x.id}" no coincide con el archivo ${x._archivo}`);
    if (!REV.has(x.revision?.estado)) aviso(donde, 'revision.estado debe ser "borrador" o "revisado"');
    const { _archivo, ...resto } = x;
    revisarTexto(donde, resto);
  };

  for (const c of g.corrientes) {
    const d = `corriente ${c.id}`;
    base(d, c);
    if (c.periodo.desde > c.periodo.hasta) err(d, 'el período termina antes de empezar');
    c.deriva.forEach(x => existe(d, g.por.corriente, x, 'corriente'));
    c.regiones.forEach(x => existe(d, g.por.region, x, 'región'));
    c.musicos.forEach(x => existe(d, g.por.musico, x, 'músico'));
    c.discosEsenciales.forEach(x => existe(d, g.por.disco, x.disco, 'disco'));
    if (!c.sinRedescubrimiento && !g.discos.some(x => x.corrientes.includes(c.id) && x.redescubrimiento)) aviso(d, 'necesita al menos un disco con la etiqueta redescubrimiento, o explicar por qué no en sinRedescubrimiento');
  }

  for (const r of g.regiones) {
    const d = `región ${r.id}`;
    base(d, r);
    r.corrientes.forEach(x => existe(d, g.por.corriente, x, 'corriente'));
    r.musicos.forEach(x => existe(d, g.por.musico, x, 'músico'));
    r.discos.forEach(x => existe(d, g.por.disco, x, 'disco'));
    if (!r.sellos?.length) aviso(d, 'necesita sellos, clubes o instituciones de la escena local');
    if (!r.escenaActual?.length) aviso(d, 'necesita músicos activos en escenaActual');
    for (const e of r.escenaActual || []) {
      const de = `${d}, ${e.nombre}`;
      if (!Number.isInteger(e.ultimaActividad)) aviso(de, 'necesita el año de su última actividad documentada');
      if (new Set(e.fuentes).size < 2) aviso(de, 'necesita al menos dos fuentes');
      e.fuentes.forEach(f => { if (!fuentes[f]) err(de, `fuente inexistente: ${f}`); });
    }
  }

  for (const x of g.discos) {
    const d = `disco ${x.id}`;
    base(d, x);
    if (!['estudio', 'vivo'].includes(x.tipo)) aviso(d, 'tipo debe ser "estudio" o "vivo"');
    if (x.grabacion.desde > x.grabacion.hasta) err(d, 'la grabación termina antes de empezar');
    if (x.edicion.anio < x.grabacion.desde) err(d, `se edita (${x.edicion.anio}) antes de grabarse (${x.grabacion.desde})`);
    if (!x.corrientes.length && !(x.corrientePendiente && x.regiones?.length)) aviso(d, 'necesita una corriente, o una corrientePendiente y una región');
    revisarRespaldo(d, x);
    x.corrientes.forEach(c => existe(d, g.por.corriente, c, 'corriente'));
    (x.regiones || []).forEach(r => existe(d, g.por.region, r, 'región'));
    x.lideres.forEach(l => {
      existe(d, g.por.musico, l, 'músico');
      if (!x.musicos.some(m => m.musico === l)) aviso(d, `el líder ${l} no aparece entre los músicos`);
    });
    x.musicos.forEach(m => {
      if (m.musico) existe(d, g.por.musico, m.musico, 'músico');
      if (!m.nombre || !m.instrumento) aviso(d, 'cada músico necesita nombre e instrumento');
    });
    if (x.spotify.estado === 'verificado') {
      if (!/^https:\/\/open\.spotify\.com\/album\/[A-Za-z0-9]{22}$/.test(x.spotify.url || '')) err(d, 'link de Spotify con formato inválido');
    } else if (x.spotify.estado === 'busqueda') {
      if (!x.spotify.consulta) aviso(d, 'la búsqueda de Spotify necesita una consulta');
    } else aviso(d, 'spotify.estado debe ser "verificado" o "busqueda"');
  }

  for (const m of g.musicos) {
    const d = `músico ${m.id}`;
    base(d, m);
    m.corrientes.forEach(c => existe(d, g.por.corriente, c, 'corriente'));
    m.regiones.forEach(r => existe(d, g.por.region, r, 'región'));
    (m.fuentes || []).forEach(f => { if (!fuentes[f]) err(d, `fuente inexistente: ${f}`); });
    revisarRespaldo(d, m);
    if (!m.epocas.length) aviso(d, 'necesita al menos una época');
    const enEpocas = new Set();
    for (const e of m.epocas) {
      const de = `${d}, época "${e.titulo}"`;
      if (e.desde > e.hasta) err(de, 'termina antes de empezar');
      if (!e.discoClave?.explicacion) aviso(de, 'el disco clave necesita una explicación');
      for (const id of [e.discoClave.disco, ...e.discos]) {
        const disco = g.por.disco.get(id);
        if (!disco) { err(de, `disco inexistente: ${id}`); continue; }
        enEpocas.add(id);
        if (!disco.musicos.some(p => p.musico === m.id)) aviso(de, `"${id}" no lo lista entre sus músicos`);
      }
    }
    for (const disco of g.discos) {
      if (disco.lideres.includes(m.id) && !enEpocas.has(disco.id)) aviso(d, `lidera "${disco.id}" pero no está en ninguna época`);
    }
  }

  for (const p of g.podcasts) {
    const d = `podcast ${p.id}`;
    if (p._archivo !== `${p.id}.json`) err(d, 'el id no coincide con el archivo');
    if (!p.nombre || !p.descripcion || !p.idioma) aviso(d, 'necesita nombre, descripción e idioma');
    const vistos = new Set();
    for (const e of p.episodios) {
      const de = `${d}, ${e.titulo}`;
      if (vistos.has(e.id)) err(de, 'id de episodio repetido');
      vistos.add(e.id);
      if (!['verificado', 'busqueda', 'sin-confirmar'].includes(e.spotify?.estado)) aviso(de, 'spotify.estado inválido');
      if (e.spotify?.estado === 'verificado' && !/^https:\/\/open\.spotify\.com\/episode\/[A-Za-z0-9]{22}$/.test(e.spotify.url || '')) err(de, 'link de Spotify con formato inválido');
      if (e.spotify?.estado === 'busqueda' && !p.spotify) aviso(de, 'solo se busca en Spotify si el programa está confirmado ahí');
      if (e.spotify?.estado !== 'verificado' && !e.original) aviso(de, 'sin Spotify exacto necesita el link original');
      if (!e.verificacion?.estado) aviso(de, 'necesita el estado de verificación');
    }
  }

  // Películas, documentales, series y videos. De YouTube entran solo canales oficiales o con permiso.
  const TIPOS_AV = ['pelicula', 'documental', 'serie', 'concierto', 'video'];
  for (const x of g.audiovisual) {
    const d = `audiovisual ${x.id}`;
    if (x._archivo !== `${x.id}.json`) err(d, 'el id no coincide con el archivo');
    if (!TIPOS_AV.includes(x.tipo)) err(d, `tipo inválido "${x.tipo}"`);
    if (!x.titulo || !x.descripcion) aviso(d, 'necesita título y descripción');
    if (!Number.isInteger(x.anio) || x.anio < 1890 || x.anio > new Date().getFullYear()) err(d, `año imposible: ${x.anio}`);
    (x.musicos || []).forEach(id => existe(d, g.por.musico, id, 'músico'));
    (x.corrientes || []).forEach(id => existe(d, g.por.corriente, id, 'corriente'));
    if (!(x.musicos || []).length && !(x.corrientes || []).length) aviso(d, 'no está conectado con ninguna ficha');
    if (x.youtube && (!/^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}$/.test(x.youtube.url) || !x.youtube.canal)) err(d, 'link de YouTube con formato inválido o sin canal');
    for (const w of x.donde || []) if (w.url && !/^https:\/\/\S+$/.test(w.url)) err(d, `link mal formado: ${w.url}`);
  }

  for (const c of g.comparaciones) {
    const d = `comparación ${c.id}`;
    base(d, c);
    existe(d, g.por.corriente, c.a, 'corriente');
    existe(d, g.por.corriente, c.b, 'corriente');
    c.escuchaParalela.forEach(p => { existe(d, g.por.disco, p.a.disco, 'disco'); existe(d, g.por.disco, p.b.disco, 'disco'); });
  }

  return { errores, avisos };
}
