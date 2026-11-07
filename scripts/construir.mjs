// Genera el sitio estático en dist/. Sin dependencias: `node scripts/construir.mjs`.
import fs from 'node:fs';
import path from 'node:path';
import { RAIZ, cargarGenero, cargarGeneros, cargarFuentes, validar, discosDe, tocoCon, musicosEnAmbas, episodiosDe } from './datos.mjs';

const DIST = path.join(RAIZ, 'dist');
const SITIO = 'Banco de música';
const fuentes = cargarFuentes();
const generos = cargarGeneros();
const g = cargarGenero('jazz');

const errores = validar(g, fuentes);
if (errores.length) {
  console.error(`No se construyó el sitio. ${errores.length} error(es) en los datos:\n- ${errores.join('\n- ')}`);
  process.exit(1);
}

// ---------- Utilidades ----------
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sinCitas = s => String(s ?? '').replace(/\[\^[a-z0-9-]+\]/g, '').replace(/\*/g, '');
const unir = (lista, ultimo = ' y ') => lista.length < 2 ? lista.join('') : `${lista.slice(0, -1).join(', ')}${ultimo}${lista.at(-1)}`;
const rangoAnios = (a, b) => (a === b ? `${a}` : `${a}–${b}`);
const aniosVida = m => `${m.nacimiento.anio}–${m.muerte?.anio ?? ''}`;
const anioDisco = d => d.edicion.anio;

const URL = {
  jazz: () => 'jazz/',
  corrientes: () => 'jazz/corrientes/',
  corriente: id => `jazz/corrientes/${id}/`,
  musicos: () => 'jazz/musicos/',
  musico: id => `jazz/musicos/${id}/`,
  discos: () => 'jazz/discos/',
  disco: id => `jazz/discos/${id}/`,
  regiones: () => 'jazz/regiones/',
  region: id => `jazz/regiones/${id}/`,
  comparaciones: () => 'jazz/comparar/',
  comparacion: id => `jazz/comparar/${id}/`,
  podcasts: () => 'jazz/podcasts/',
  marcas: () => 'mis-marcas/',
  acerca: () => 'acerca/',
};

// Cada página arma sus propias notas: la primera fuente citada es la 1, y así.
function nuevoContexto(ruta) {
  const niveles = ruta.split('/').filter(Boolean).length;
  const raiz = '../'.repeat(niveles);
  const citas = [];
  return {
    raiz,
    a: destino => raiz + destino,
    citas,
    texto(s) {
      return esc(s)
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/\[\^([a-z0-9-]+)\]/g, (_, id) => {
          let n = citas.indexOf(id) + 1;
          if (!n) { citas.push(id); n = citas.length; }
          return `<sup class="cita"><a href="#fuente-${n}" aria-label="Fuente ${n}">${n}</a></sup>`;
        });
    },
  };
}

// ---------- Piezas compartidas ----------
const tintaVars = c => `--tinta-c:${c.tinta};--tinta-c-texto:${c.tintaTexto}`;
const NEUTRA = { tinta: '#4a5560', tintaTexto: '#ffffff' };
const corrienteDe = d => (d.corrientes.length ? g.por.corriente.get(d.corrientes[0]) : NEUTRA);
const NIVEL_ORDEN = ['musico', 'guia-critica', 'especialista', 'prensa', 'referencia'];
const NIVEL_TEXTO = { musico: 'Músicos', 'guia-critica': 'Guía crítica', especialista: 'Especialista', prensa: 'Prensa', referencia: 'Referencia' };
const ACCESO_TEXTO = { completa: 'Texto leído', extracto: 'Solo extracto', indirecta: 'Citado por terceros' };
const etiquetaRedescubrimiento = () => '<span class="etiqueta">Redescubrimiento</span>';

const fechaCorta = f => (f ? new Date(`${f}T12:00:00Z`).toLocaleDateString('es-AR', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }) : '');

// El orden de prioridad lo pidió Yoana: Spotify exacto, búsqueda en Spotify y, si no está ahí, el link original.
function accesoEpisodio(e) {
  if (e.spotify.estado === 'verificado') return { url: e.spotify.url, texto: 'Escuchar en Spotify', estado: 'Link exacto verificado' };
  if (e.spotify.estado === 'busqueda') return { url: `https://open.spotify.com/search/${encodeURIComponent(e.spotify.consulta)}/episodes`, texto: 'Buscar en Spotify', estado: 'Abre una búsqueda en Spotify' };
  return { url: e.original, texto: 'Escuchar', estado: 'No confirmado en Spotify' };
}

function tarjetaEpisodio(e) {
  const a = accesoEpisodio(e);
  const mostrarOriginal = e.original && a.url !== e.original;
  const verificado = e.verificacion.estado === 'verificado';
  return `<li class="episodio" data-programa="${esc(e.programa.id)}" data-spotify="${e.spotify.estado}">
    <span class="episodio-titulo">${esc(e.titulo)}</span>
    <span class="episodio-meta">${esc(e.programa.nombre)}${e.codigo ? ` · ${esc(e.codigo)}` : ''}${e.fecha ? ` · ${esc(fechaCorta(e.fecha))}` : ''}${e.duracionMin ? ` · ${e.duracionMin} min` : ''}</span>
    <span class="episodio-acciones"><a class="boton boton-chico" href="${esc(a.url)}" rel="noopener">${a.texto}</a>${mostrarOriginal ? ` <a href="${esc(e.original)}" rel="noopener">Link original</a>` : ''}</span>
    <span class="episodio-estado ${verificado ? 'ok' : 'alerta'}">${a.estado}${verificado ? `. Comprobado el ${esc(e.verificacion.fecha)}` : '. El link no respondió en la última comprobación'}</span>
  </li>`;
}

function bloquePodcasts(ctx, tipo, id, visibles = 4) {
  const lista = episodiosDe(g, tipo, id);
  if (!lista.length) return '';
  const resto = lista.slice(visibles);
  return `<section class="bloque podcasts-ficha"><h2>Para escuchar sobre esto</h2>
    <ul class="episodios">${lista.slice(0, visibles).map(tarjetaEpisodio).join('')}</ul>
    ${resto.length ? `<details class="mas-episodios"><summary>Ver ${resto.length} ${resto.length === 1 ? 'episodio más' : 'episodios más'}</summary><ul class="episodios">${resto.map(tarjetaEpisodio).join('')}</ul></details>` : ''}
    <p class="ayuda"><a href="${ctx.a(URL.podcasts())}">Todos los podcasts</a></p></section>`;
}

function bloqueRespaldo(x) {
  const lista = [...(x.respaldo || [])].sort((a, b) => NIVEL_ORDEN.indexOf(fuentes[a.fuente].nivel) - NIVEL_ORDEN.indexOf(fuentes[b.fuente].nivel));
  if (!lista.length) return '';
  return `<section class="respaldo"><h2>Qué dicen</h2><ul>${lista.map(r => {
    const f = fuentes[r.fuente];
    return `<li><p>${esc(r.aporta)}</p><p class="respaldo-fuente">${f.url ? `<a href="${esc(f.url)}" rel="noopener">${esc(f.titulo)}</a>` : esc(f.titulo)} <span>${NIVEL_TEXTO[f.nivel]} · ${ACCESO_TEXTO[r.acceso]}</span></p></li>`;
  }).join('')}</ul></section>`;
}
const enlaceMusico = (ctx, id) => { const m = g.por.musico.get(id); return `<a href="${ctx.a(URL.musico(id))}">${esc(m.nombre)}</a>`; };
const enlaceCorriente = (ctx, id) => { const c = g.por.corriente.get(id); return `<a href="${ctx.a(URL.corriente(id))}">${esc(c.nombre)}</a>`; };
const enlaceRegion = (ctx, id) => { const r = g.por.region.get(id); return `<a href="${ctx.a(URL.region(id))}">${esc(r.nombre)}</a>`; };
const enlaceSpotify = d => d.spotify.estado === 'verificado'
  ? { url: d.spotify.url, texto: 'Escuchar en Spotify', verificado: true }
  : { url: `https://open.spotify.com/search/${encodeURIComponent(d.spotify.consulta)}/albums`, texto: 'Buscar en Spotify', verificado: false };

function filaDisco(ctx, d, extra = '') {
  const c = corrienteDe(d);
  return `<li class="fila-disco" style="${tintaVars(c)}" data-corriente="${esc(d.corrientes.join(' '))}" data-tipo="${d.tipo}" data-redescubrimiento="${d.redescubrimiento ? 'si' : 'no'}" data-marca-fila="disco:${d.id}">
    <span class="fila-disco-anio">${anioDisco(d)}</span>
    <span class="fila-disco-cuerpo"><span><a class="fila-disco-titulo" href="${ctx.a(URL.disco(d.id))}">${esc(d.titulo)}</a>${d.redescubrimiento ? ` ${etiquetaRedescubrimiento()}` : ''}</span>
    <span class="fila-disco-meta">${esc(d.credito)} · ${esc(d.sello)} · ${d.tipo === 'vivo' ? 'en vivo' : 'estudio'}</span>${extra}</span>
    <span class="fila-disco-marca" data-marca-chip="disco:${d.id}"></span>
  </li>`;
}

// La firma visual del sitio: cada corriente es una barra de tinta a escala de tiempo.
// Donde dos barras se pisan aparece el color de la mezcla, igual que en una impresión a dos tintas.
function barrasDeTinta(corrientes, [ini, fin], ctx, { cruce, enlazar = true } = {}) {
  const pos = a => ((a - ini) / (fin - ini)) * 100;
  const decadas = [];
  for (let a = Math.ceil(ini / 5) * 5; a <= fin; a += 5) decadas.push(a);
  const orden = [...corrientes].sort((x, y) => x.periodo.desde - y.periodo.desde);
  let solape = '';
  let notaSolape = '';
  let margenCruce = 0;
  if (cruce && orden.length === 2) {
    const d = Math.max(orden[0].periodo.desde, orden[1].periodo.desde), h = Math.min(orden[0].periodo.hasta, orden[1].periodo.hasta);
    if (d < h) solape = `<div class="tintas-cruce" style="left:${pos(d)}%;width:${pos(h) - pos(d)}%;background:${cruce}"><span>${d}–${h}<br>conviven</span></div>`;
    if (d < h) { notaSolape = `<p class="tintas-nota">Conviven entre ${d} y ${h}.</p>`; margenCruce = pos(h) - pos(d); }
  }
  const barras = orden.map((c, i) => {
    const contenido = `<span class="tinta-nombre">${esc(c.nombre)}</span><span class="tinta-anios">c. ${rangoAnios(c.periodo.desde, c.periodo.hasta)}</span>`;
    const estilo = `${tintaVars(c)};left:${pos(c.periodo.desde)}%;width:${pos(c.periodo.hasta) - pos(c.periodo.desde)}%;top:${(i * 100) / orden.length}%;height:${100 / orden.length}%${i === 1 && margenCruce ? `;padding-left:calc(${margenCruce}% + 10px)` : ''}`;
    return enlazar
      ? `<a class="tinta" style="${estilo}" href="${ctx.a(URL.corriente(c.id))}">${contenido}</a>`
      : `<div class="tinta" style="${estilo}">${contenido}</div>`;
  }).join('');
  return `<div class="tintas" data-filas="${orden.length}" style="--filas:${orden.length}">
    <div class="tintas-marco">${barras}${solape}</div>
    <div class="tintas-escala" aria-hidden="true">${decadas.map(a => `<span style="left:${pos(a)}%">${a}</span>`).join('')}</div>
    ${notaSolape}
  </div>`;
}

// Cada disco es un punto en su año de edición. El trazo llega hasta el año de grabación.
function mapaDeDiscos(ctx, corrientes, discos, [ini, fin]) {
  const pos = a => ((a - ini) / (fin - ini)) * 100;
  const SEPARACION = 1.6;
  return corrientes.map(c => {
    const propios = discos.filter(d => d.corrientes[0] === c.id).sort((a, b) => a.edicion.anio - b.edicion.anio || a.grabacion.desde - b.grabacion.desde);
    const carriles = [];
    const puntos = propios.map(d => {
      const desde = Math.min(d.grabacion.desde, d.edicion.anio);
      let n = carriles.findIndex(fin => desde >= fin + SEPARACION);
      if (n < 0) { n = carriles.length; carriles.push(0); }
      carriles[n] = Math.min(d.edicion.anio, fin);
      const izq = pos(desde), der = Math.min(pos(d.edicion.anio), 100);
      const titulo = `${d.titulo} · ${d.credito}, ${d.edicion.anio}`;
      const trazo = der > izq ? `<span class="trazo" style="left:${izq}%;width:${der - izq}%;--y:${n}"></span>` : '';
      return `${trazo}<a class="punto ${der > 60 ? 'punto-der' : ''}" style="--x:${der}%;--y:${n}" href="${ctx.a(URL.disco(d.id))}" aria-label="${esc(titulo)}" data-titulo="${esc(titulo)}"><i></i></a>`;
    }).join('');
    return `<div class="mapa-fila" style="${tintaVars(c)};--carriles:${carriles.length};--tramos:${(fin - ini) / 5}"><h3 class="mapa-nombre">${esc(c.nombre)}</h3><div class="mapa-pista">${puntos}</div></div>`;
  }).join('');
}

function notasFuentes(ctx, extra = []) {
  const items = ctx.citas.map((id, i) => {
    const f = fuentes[id];
    return `<li id="fuente-${i + 1}">${f.url ? `<a href="${esc(f.url)}" rel="noopener">${esc(f.titulo)}</a>` : esc(f.titulo)}. Consultada el ${esc(f.consultada)}.</li>`;
  }).join('');
  if (!items && !extra.length) return '';
  return `<section class="fuentes" aria-labelledby="titulo-fuentes"><h2 id="titulo-fuentes">Fuentes</h2>
    ${items ? `<ol>${items}</ol>` : ''}${extra.join('')}
    <p class="aviso-gioia">Texto propio, en borrador. Falta cotejarlo con <cite>The History of Jazz</cite>, de Ted Gioia.</p></section>`;
}

function pagina(ruta, ctx, { titulo, descripcion, cuerpo, seccion, claseCuerpo = '', sinFuentes = false }) {
  const nav = [['Corrientes', URL.corrientes(), 'corrientes'], ['Músicos', URL.musicos(), 'musicos'], ['Discos', URL.discos(), 'discos'], ['Regiones', URL.regiones(), 'regiones'], ['Comparar', URL.comparaciones(), 'comparar'], ['Podcasts', URL.podcasts(), 'podcasts'], ['Mis marcas', URL.marcas(), 'marcas']];
  const html = `<!doctype html>
<html lang="es-AR" data-raiz="${ctx.raiz}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(titulo)}${titulo === SITIO ? '' : ` · ${SITIO}`}</title>
<meta name="robots" content="noindex">
<meta name="description" content="${esc(sinCitas(descripcion))}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='20' height='32' fill='%23FFC400'/%3E%3Crect x='12' width='20' height='32' fill='%231F2FD0'/%3E%3Crect x='12' width='8' height='32' fill='%230F4A3A'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;900&family=DM+Mono:wght@400;500&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap">
<link rel="stylesheet" href="${ctx.a('recursos/estilos.css')}">
</head>
<body class="${claseCuerpo}">
<a class="saltar" href="#contenido">Saltar al contenido</a>
<p class="aviso-prueba">Versión de prueba: los textos están en borrador.</p>
<header class="cabecera">
  <a class="marca-sitio" href="${ctx.a(URL.jazz())}">${SITIO}</a>
  <nav aria-label="Principal"><ul>${nav.map(([t, u, s]) => `<li><a href="${ctx.a(u)}"${s === seccion ? ' aria-current="page"' : ''}>${t}</a></li>`).join('')}</ul></nav>
  <div class="buscador" role="search">
    <label class="oculto" for="buscar">Buscar en el banco</label>
    <input id="buscar" type="search" placeholder="Buscar disco, músico, corriente…" autocomplete="off" aria-controls="resultados" aria-expanded="false">
    <ul id="resultados" class="resultados" hidden></ul>
  </div>
</header>
<main id="contenido">
${cuerpo}
${sinFuentes ? '' : notasFuentes(ctx)}
</main>
<footer class="pie">
  <p>${SITIO}. Datos de <a href="https://musicbrainz.org" rel="noopener">MusicBrainz</a>, <a href="https://www.discogs.com" rel="noopener">Discogs</a> y <a href="https://www.wikipedia.org" rel="noopener">Wikipedia</a>. Textos propios. <a href="${ctx.a(URL.acerca())}">Cómo se arma este banco</a>.</p>
</footer>
<script src="${ctx.a('recursos/indice.js')}"></script>
<script src="${ctx.a('recursos/marcas.js')}"></script>
<script src="${ctx.a('recursos/sitio.js')}"></script>
</body>
</html>
`;
  const destino = path.join(DIST, ruta, 'index.html');
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, html);
}

// ---------- Páginas ----------
const construir = {
  inicio() {
    const ruta = '';
    const ctx = nuevoContexto(ruta);
    pagina(ruta, ctx, {
      titulo: SITIO, descripcion: 'Un banco de aprendizaje de géneros musicales, con fichas conectadas de corrientes, músicos, discos y regiones.', sinFuentes: true,
      cuerpo: `<section class="portada"><h1>${SITIO}</h1><p>Fichas conectadas para aprender géneros musicales disco por disco.</p>
      <ul class="generos">${generos.map(x => x.estado === 'activo'
        ? `<li><a href="${ctx.a(`${x.id}/`)}"><strong>${esc(x.nombre)}</strong><span>${esc(x.lema)}</span></a></li>`
        : `<li class="inactivo"><strong>${esc(x.nombre)}</strong><span>${esc(x.lema)}</span></li>`).join('')}</ul></section>`,
    });
  },

  jazz() {
    const ruta = URL.jazz();
    const ctx = nuevoContexto(ruta);
    const comp = g.comparaciones[0];
    pagina(ruta, ctx, {
      titulo: 'Jazz', descripcion: g.intro, claseCuerpo: 'inicio-jazz', sinFuentes: true,
      cuerpo: `<section class="tesis">
        <h1>Jazz</h1>
        <p class="tesis-bajada">${ctx.texto(g.intro)}</p>
        ${barrasDeTinta(g.corrientes, g.rangoLinea, ctx, { cruce: comp.tintaCruce })}
        <p class="tesis-pie">Cada barra muestra cuánto duró una corriente, y varias convivieron. <a href="${ctx.a(URL.comparacion(comp.id))}">Compará bebop y hard bop</a> para ver qué pasa donde se pisan.</p>
      </section>
      <section class="bloque"><h2>${g.discos.length} discos en el tiempo</h2>
        <p class="ayuda">Cada punto es un disco en su año de edición. Si tiene un trazo, se grabó antes de salir: el trazo llega hasta el año de grabación.</p>
        <div class="mapa">${mapaDeDiscos(ctx, g.corrientes, g.discos, g.rangoLinea)}</div>
      </section>
      <section class="bloque portal"><h2>Por dónde seguir</h2><ul class="portal-lista">
        <li><a href="${ctx.a(URL.musicos())}"><strong>${g.musicos.length} músicos</strong>Su carrera por épocas, con un disco clave en cada una.</a></li>
        <li><a href="${ctx.a(URL.discos())}"><strong>${g.discos.length} discos</strong>Filtrá por corriente o tipo, y marcá lo que ya escuchaste.</a></li>
        <li><a href="${ctx.a(URL.podcasts())}"><strong>${g.episodios.length} episodios</strong>Podcasts en español para escuchar sobre cada ficha.</a></li>
        <li><a href="${ctx.a(URL.regiones())}"><strong>Jazz del mundo</strong>Japón, Cuba y el Río de la Plata, como prueba. Hay ${g.regionesPlanificadas.length} regiones más planificadas.</a></li>
      </ul></section>`,
    });
  },

  corrientes() {
    const ruta = URL.corrientes();
    const ctx = nuevoContexto(ruta);
    pagina(ruta, ctx, {
      titulo: 'Corrientes', descripcion: 'Las corrientes del jazz cargadas hasta ahora.', seccion: 'corrientes', sinFuentes: true,
      cuerpo: `<header class="encabezado"><h1>Corrientes</h1><p>Hay ${g.corrientes.length} cargadas. Las demás se van sumando por etapas.</p></header>
      <ul class="tarjetas">${g.corrientes.map(c => `<li class="tarjeta-tinta" style="${tintaVars(c)}"><a href="${ctx.a(URL.corriente(c.id))}"><span class="tarjeta-anios">c. ${rangoAnios(c.periodo.desde, c.periodo.hasta)}</span><strong>${esc(c.nombre)}</strong><span>${esc(c.lema)}</span></a></li>`).join('')}</ul>`,
    });
  },

  corriente(c) {
    const ruta = URL.corriente(c.id);
    const ctx = nuevoContexto(ruta);
    const hijas = g.corrientes.filter(x => x.deriva.includes(c.id));
    const padres = c.deriva.map(id => enlaceCorriente(ctx, id)).concat(c.derivaPendiente.map(esc));
    const discos = g.discos.filter(d => d.corrientes.includes(c.id)).sort((a, b) => anioDisco(a) - anioDisco(b));
    const comparaciones = g.comparaciones.filter(x => x.a === c.id || x.b === c.id);
    pagina(ruta, ctx, {
      titulo: c.nombre, descripcion: `${c.lema}. ${sinCitas(c.texto[0])}`, seccion: 'corrientes',
      cuerpo: `<header class="heroe-corriente" style="${tintaVars(c)}">
        <p class="heroe-anios">c. ${rangoAnios(c.periodo.desde, c.periodo.hasta)} · ${esc(c.lugares.join(' · '))}</p>
        <h1>${esc(c.nombre)}</h1><p class="heroe-lema">${esc(c.lema)}</p>
      </header>
      <div class="columnas">
        <div class="lectura">${c.texto.map(p => `<p>${ctx.texto(p)}</p>`).join('')}
          <p class="legado"><strong>Qué dejó.</strong> ${ctx.texto(c.legado)}</p>
          <p class="parentesco">${padres.length ? `Viene de ${unir(padres)}.` : ''}${hijas.length ? ` De acá sale ${unir(hijas.map(x => enlaceCorriente(ctx, x.id)))}.` : ''}${comparaciones.map(x => ` <a href="${ctx.a(URL.comparacion(x.id))}">Compará ${esc(x.titulo.toLowerCase())}</a>.`).join('')}</p>
        </div>
        <aside class="lateral" style="${tintaVars(c)}">
          <section class="suena"><h2>Cómo suena</h2><ul>${c.suena.map(s => `<li>${ctx.texto(s)}</li>`).join('')}</ul></section>
          <section><h2>Fechas clave</h2><ol class="hitos">${c.hitos.map(h => `<li><span class="hito-fecha">${esc(h.fecha)}</span><span>${ctx.texto(h.texto)}</span></li>`).join('')}</ol></section>
        </aside>
      </div>
      <section class="bloque"><h2>Para empezar</h2><ol class="esenciales">${c.discosEsenciales.map(e => {
        const d = g.por.disco.get(e.disco);
        return `<li><a href="${ctx.a(URL.disco(d.id))}">${esc(d.titulo)}</a><span class="esencial-meta">${esc(d.credito)}, ${anioDisco(d)}</span><p>${ctx.texto(e.porque)}</p></li>`;
      }).join('')}</ol></section>
      ${discos.some(d => d.redescubrimiento) ? `<section class="bloque"><h2>Para ir más allá</h2><p class="ayuda">Discos poco conocidos que varias fuentes reivindican.</p><ul class="lista-discos">${discos.filter(d => d.redescubrimiento).map(d => filaDisco(ctx, d)).join('')}</ul></section>` : ''}
      <section class="bloque"><h2>Músicos</h2><ul class="lista-musicos">${c.musicos.map(id => tarjetaMusico(ctx, id)).join('')}</ul>
        ${c.musicosPendientes.length ? `<p class="pendientes"><strong>Fichas por escribir:</strong> ${esc(c.musicosPendientes.join(', '))}.</p>` : ''}</section>
      <section class="bloque"><h2>Todos los discos de esta corriente · ${discos.length}</h2><ul class="lista-discos">${discos.map(d => filaDisco(ctx, d)).join('')}</ul></section>
      ${bloquePodcasts(ctx, 'corriente', c.id)}`,
    });
  },

  musicos() {
    const ruta = URL.musicos();
    const ctx = nuevoContexto(ruta);
    const orden = [...g.musicos].sort((a, b) => a.nacimiento.anio - b.nacimiento.anio);
    pagina(ruta, ctx, {
      titulo: 'Músicos', descripcion: 'Músicos organizados por épocas, con un disco clave explicado en cada una.', seccion: 'musicos', sinFuentes: true,
      cuerpo: `<header class="encabezado"><h1>Músicos</h1><p>Ordenados por año de nacimiento. Cada ficha recorre la carrera por épocas, con un disco clave en cada una.</p></header>
      <ul class="lista-musicos">${orden.map(m => tarjetaMusico(ctx, m.id)).join('')}</ul>`,
    });
  },

  musico(m) {
    const ruta = URL.musico(m.id);
    const ctx = nuevoContexto(ruta);
    const propios = new Set(m.epocas.flatMap(e => [e.discoClave.disco, ...e.discos]));
    const otros = discosDe(g, m.id).filter(d => !propios.has(d.id));
    const socios = tocoCon(g, m.id);
    const principal = m.corrientes.length ? g.por.corriente.get(m.corrientes[0]) : NEUTRA;
    const spotify = m.spotify || `https://open.spotify.com/search/${encodeURIComponent(m.nombre)}/artists`;
    pagina(ruta, ctx, {
      titulo: m.nombre, descripcion: m.resumen, seccion: 'musicos',
      cuerpo: `<header class="heroe-musico" style="${tintaVars(principal)}">
        <p class="heroe-anios">${esc(aniosVida(m))} · ${esc(unir(m.instrumentos))}</p>
        <h1>${esc(m.nombre)}</h1>
        ${m.redescubrimiento ? `<p>${etiquetaRedescubrimiento()}</p>` : ''}
        <p class="heroe-datos">Nació en ${esc(m.nacimiento.lugar)}. ${m.apodo ? `Le decían ${esc(m.apodo)}. ` : ''}${m.corrientes.length ? `Corrientes: ${unir(m.corrientes.map(c => enlaceCorriente(ctx, c)))}. ` : ''}Regiones: ${unir(m.regiones.map(r => enlaceRegion(ctx, r)))}.</p>
      </header>
      <div class="lectura lectura-ancha"><p class="entrada">${ctx.texto(m.resumen)}</p>
      ${m.redescubrimiento ? `<p class="nota-datos"><strong>Por qué es un redescubrimiento.</strong> ${ctx.texto(m.redescubrimiento.motivo)}</p>` : ''}
      <p><a class="boton" href="${esc(spotify)}" rel="noopener">${m.spotify ? 'Abrir en Spotify' : 'Buscar en Spotify'}</a></p></div>
      ${m.epocasPendientes?.length ? `<p class="pendientes lectura"><strong>Etapas por cargar:</strong> ${esc(m.epocasPendientes.join(', '))}. Se suman cuando se migren sus corrientes.</p>` : ''}
      <section class="epocas" aria-label="Carrera por épocas">
        ${m.epocas.map(e => {
          const clave = g.por.disco.get(e.discoClave.disco);
          const sp = enlaceSpotify(clave);
          return `<article class="epoca" style="${tintaVars(corrienteDe(clave))}">
            <header class="epoca-cabeza"><span class="epoca-anios">${rangoAnios(e.desde, e.hasta)}</span><h2>${esc(e.titulo)}</h2></header>
            <div class="epoca-cuerpo"><p>${ctx.texto(e.texto)}</p>
            <div class="disco-clave"><span class="rotulo">Disco clave</span>
              <h3><a href="${ctx.a(URL.disco(clave.id))}">${esc(clave.titulo)}</a></h3>
              <p class="disco-clave-meta">${anioDisco(clave)} · ${esc(clave.sello)} · ${clave.tipo === 'vivo' ? 'en vivo' : 'estudio'}</p>
              <p>${ctx.texto(e.discoClave.explicacion)}</p>
              <a class="enlace-externo" href="${esc(sp.url)}" rel="noopener">${sp.texto}</a>
            </div>
            ${e.discos.length ? `<h3 class="rotulo">El resto de esta época</h3><ul class="lista-discos">${e.discos.map(id => filaDisco(ctx, g.por.disco.get(id))).join('')}</ul>` : ''}
            </div></article>`;
        }).join('')}
      </section>
      <div class="bloque">${bloqueRespaldo(m)}</div>
      ${bloquePodcasts(ctx, 'musico', m.id)}
      ${otros.length ? `<section class="bloque"><h2>También toca en</h2><ul class="lista-discos">${otros.map(d => filaDisco(ctx, d)).join('')}</ul></section>` : ''}
      ${socios.length ? `<section class="bloque"><h2>Tocó con</h2><p class="ayuda">Sale de los discos cargados, no de toda su carrera.</p><ul class="socios">${socios.map(s => `<li>${enlaceMusico(ctx, s.id)} <span>${s.n} ${s.n === 1 ? 'disco' : 'discos'}</span></li>`).join('')}</ul></section>` : ''}`,
    });
  },

  discos() {
    const ruta = URL.discos();
    const ctx = nuevoContexto(ruta);
    const orden = [...g.discos].sort((a, b) => anioDisco(a) - anioDisco(b) || a.titulo.localeCompare(b.titulo));
    pagina(ruta, ctx, {
      titulo: 'Discos', descripcion: 'Discos con año, sello, músicos, corriente y link para escuchar.', seccion: 'discos', sinFuentes: true,
      cuerpo: `<header class="encabezado"><h1>Discos</h1><p>Ordenados por año de edición.</p></header>
      <form class="filtros" data-filtros aria-label="Filtrar discos">
        <label>Corriente <select name="corriente"><option value="">Todas</option>${g.corrientes.map(c => `<option value="${c.id}">${esc(c.nombre)}</option>`).join('')}</select></label>
        <label>Tipo <select name="tipo"><option value="">Todos</option><option value="estudio">Estudio</option><option value="vivo">En vivo</option></select></label>
        <label>Etiqueta <select name="redescubrimiento"><option value="">Todas</option><option value="si">Redescubrimientos</option></select></label>
        <label>Marcas <select name="marca"><option value="">Todos</option><option value="pendiente">Sin escuchar</option><option value="escuchado">Escuchados</option></select></label>
        <output class="filtros-cuenta" aria-live="polite" data-cuenta></output>
      </form>
      <ul class="lista-discos" data-lista-filtrable>${orden.map(d => filaDisco(ctx, d)).join('')}</ul>`,
    });
  },

  disco(d) {
    const ruta = URL.disco(d.id);
    const ctx = nuevoContexto(ruta);
    const c = corrienteDe(d);
    const sp = enlaceSpotify(d);
    const grabado = d.grabacion.detalle || rangoAnios(d.grabacion.desde, d.grabacion.hasta);
    const editado = d.edicion.detalle || `${d.edicion.anio}`;
    const enlacesFuente = [
      d.ids.musicbrainz && ['MusicBrainz', `https://musicbrainz.org/release-group/${d.ids.musicbrainz}`],
      d.ids.discogsMaster && ['Discogs', `https://www.discogs.com/master/${d.ids.discogsMaster}`],
      d.ids.wikipedia && ['Wikipedia', `https://en.wikipedia.org/wiki/${d.ids.wikipedia}`],
      d.ids.wikidata && ['Wikidata', `https://www.wikidata.org/wiki/${d.ids.wikidata}`],
    ].filter(Boolean);
    const dato = (t, v) => v ? `<div><dt>${t}</dt><dd>${v}</dd></div>` : '';
    pagina(ruta, ctx, {
      titulo: `${d.titulo} (${d.credito})`, descripcion: sinCitas(d.comentario[0]), seccion: 'discos', sinFuentes: true,
      cuerpo: `<header class="heroe-disco" style="${tintaVars(c)}">
        <p class="heroe-anios">${d.edicion.anio} · ${esc(d.sello)}${d.catalogo ? ` · ${esc(d.catalogo)}` : ''}</p>
        <h1>${esc(d.titulo)}</h1><p class="heroe-lema">${esc(d.credito)}</p>${d.redescubrimiento ? `<p>${etiquetaRedescubrimiento()}</p>` : ''}
      </header>
      <div class="columnas">
        <div class="lectura">
          ${d.comentario.map(p => `<p>${ctx.texto(p)}</p>`).join('')}
          ${d.redescubrimiento ? `<p class="nota-datos"><strong>Por qué es un redescubrimiento.</strong> ${ctx.texto(d.redescubrimiento.motivo)}</p>` : ''}
          <p><a class="boton" href="${esc(sp.url)}" rel="noopener">${sp.texto}</a></p>
          ${sp.verificado
            ? (d.spotify.tituloEnSpotify !== d.titulo ? `<p class="ayuda">En Spotify figura como "${esc(d.spotify.tituloEnSpotify)}".</p>` : '')
            : '<p class="ayuda">Todavía no confirmamos un álbum exacto en Spotify, así que este link abre una búsqueda.</p>'}
          ${d.corrienteNota ? `<p class="nota-datos"><strong>Por qué está en esta corriente.</strong> ${ctx.texto(d.corrienteNota)}</p>` : ''}
          ${bloqueRespaldo(d)}
          <h2>Músicos</h2>
          <ul class="personal">${d.musicos.map(m => `<li><span class="personal-nombre">${m.musico ? enlaceMusico(ctx, m.musico) : esc(m.nombre)}</span> <span class="personal-instrumento">${esc(m.instrumento)}</span>${m.nota ? `<span class="personal-nota">${esc(m.nota)}</span>` : ''}</li>`).join('')}</ul>
          ${d.personalNota ? `<p class="ayuda">${ctx.texto(d.personalNota)}</p>` : ''}
        </div>
        <aside class="lateral" style="${tintaVars(c)}">
          <section class="marcas-disco" data-marca="disco:${d.id}" data-marca-titulo="${esc(d.titulo)}" aria-label="Tus marcas">
            <h2>Tus marcas</h2>
            <label class="marca-escuchado"><input type="checkbox" data-campo="escuchado"> Ya lo escuché</label>
            <fieldset class="marca-puntaje"><legend>Puntaje</legend>
              ${[1, 2, 3, 4, 5].map(n => `<button type="button" data-puntaje="${n}" aria-pressed="false" aria-label="${n} de 5">${n}</button>`).join('')}
            </fieldset>
            <label class="marca-nota">Nota <textarea data-campo="nota" rows="3" maxlength="2000"></textarea></label>
            <ul class="notas-anteriores" data-notas-anteriores hidden></ul>
            <p class="ayuda">Se guarda solo en este navegador. <a href="${ctx.a(URL.marcas())}">Exportar o importar</a>.</p>
          </section>
          <section><h2>Ficha</h2><dl class="ficha">
            ${dato('Tipo', `${d.tipo === 'vivo' ? 'En vivo' : 'Estudio'}${d.compilacion ? ', compilación' : ''}`)}
            ${dato('Grabado', esc(grabado))}
            ${dato('Editado', esc(editado))}
            ${dato('Lugar', esc(d.lugar))}
            ${dato('Sello', esc(d.sello))}
            ${dato('Corriente', d.corrientes.length ? unir(d.corrientes.map(x => enlaceCorriente(ctx, x))) : `${esc(d.corrientePendiente)} (por cargar)`)}
            ${d.regiones?.length ? dato('Región', unir(d.regiones.map(x => enlaceRegion(ctx, x)))) : ''}
          </dl></section>
        </aside>
      </div>
      ${bloquePodcasts(ctx, 'disco', d.id)}
      <section class="fuentes" aria-labelledby="titulo-fuentes"><h2 id="titulo-fuentes">Fuentes de este disco</h2>
        <p>${enlacesFuente.map(([t, u]) => `<a href="${esc(u)}" rel="noopener">${t}</a>`).join(' · ')}</p>
        ${d.discrepancias.length ? `<h3>Dónde no coinciden las fuentes</h3><ul>${d.discrepancias.map(x => `<li>${ctx.texto(x.texto)}</li>`).join('')}</ul>` : ''}
        ${ctx.citas.length ? `<ol>${ctx.citas.map((id, i) => `<li id="fuente-${i + 1}"><a href="${esc(fuentes[id].url)}" rel="noopener">${esc(fuentes[id].titulo)}</a></li>`).join('')}</ol>` : ''}
        <p class="aviso-gioia">Comentario propio, en borrador. Falta cotejarlo con <cite>The History of Jazz</cite>, de Ted Gioia.</p>
      </section>`,
    });
  },

  regiones() {
    const ruta = URL.regiones();
    const ctx = nuevoContexto(ruta);
    pagina(ruta, ctx, {
      titulo: 'Regiones', descripcion: 'El jazz, abierto por regiones del mundo.', seccion: 'regiones', sinFuentes: true,
      cuerpo: `<header class="encabezado"><h1>Regiones</h1><p>El jazz no es una sola historia. Japón y el Río de la Plata son pruebas para calibrar la profundidad de cada región. El resto entra en la etapa de jazz del mundo.</p></header>
      <ul class="lista-regiones">${g.regiones.map(r => `<li><a href="${ctx.a(URL.region(r.id))}"><strong>${esc(r.nombre)}</strong><span>${esc(r.resumen)}</span></a></li>`).join('')}</ul>
      <section class="bloque"><h2>Planificadas</h2><ul class="planificadas">${g.regionesPlanificadas.map(n => `<li>${esc(n)}</li>`).join('')}</ul></section>`,
    });
  },

  region(r) {
    const ruta = URL.region(r.id);
    const ctx = nuevoContexto(ruta);
    const discos = g.discos.filter(d => r.discos.includes(d.id) || d.regiones?.includes(r.id));
    pagina(ruta, ctx, {
      titulo: r.nombre, descripcion: r.resumen, seccion: 'regiones',
      cuerpo: `<header class="heroe-region"><p class="heroe-anios">Jazz del mundo</p><h1>${esc(r.nombre)}</h1><p class="heroe-lema">${esc(r.resumen)}</p></header>
      <div class="lectura lectura-ancha">${r.texto.map(p => `<p>${ctx.texto(p)}</p>`).join('')}
      ${r.corrientes.length ? `<p class="parentesco">Corrientes relacionadas: ${unir(r.corrientes.map(c => enlaceCorriente(ctx, c)))}.</p>` : ''}</div>
      <section class="bloque"><h2>Sellos y lugares</h2><ul class="sellos">${r.sellos.map(s => `<li><strong>${esc(s.nombre)}</strong><span>${ctx.texto(s.texto)}</span></li>`).join('')}</ul></section>
      <section class="bloque"><h2>Escena actual</h2><p class="ayuda">Músicos activos hoy, con su última actividad que pudimos documentar.</p><ul class="escena">${r.escenaActual.map(e => `<li><div class="escena-cabeza"><strong>${esc(e.nombre)}</strong><span>${esc(e.instrumento)}${e.base ? ` · ${esc(e.base)}` : ''}</span></div><p>${ctx.texto(e.detalle)}</p><p class="respaldo-fuente">Última actividad documentada: ${e.ultimaActividad}. Fuentes: ${e.fuentes.map(f => `<a href="${esc(fuentes[f].url)}" rel="noopener">${esc(fuentes[f].titulo)}</a>`).join(' · ')}</p></li>`).join('')}</ul></section>
      <section class="bloque"><h2>Pioneros</h2>${r.musicos.length ? `<ul class="lista-musicos">${r.musicos.map(id => tarjetaMusico(ctx, id)).join('')}</ul>` : ''}
      ${r.figurasPendientes.length ? `<p class="pendientes"><strong>Fichas por escribir:</strong> ${esc(r.figurasPendientes.join(', '))}.</p>` : ''}</section>
      ${discos.length ? `<section class="bloque"><h2>Discos</h2><ul class="lista-discos">${discos.map(d => filaDisco(ctx, d)).join('')}</ul></section>` : ''}
      ${bloquePodcasts(ctx, 'region', r.id)}`,
    });
  },

  comparaciones() {
    const ruta = URL.comparaciones();
    const ctx = nuevoContexto(ruta);
    pagina(ruta, ctx, {
      titulo: 'Comparar', descripcion: 'Páginas que ponen dos corrientes frente a frente.', seccion: 'comparar', sinFuentes: true,
      cuerpo: `<header class="encabezado"><h1>Comparar</h1><p>Dos corrientes frente a frente, con discos para escuchar en paralelo.</p></header>
      <ul class="lista-regiones">${g.comparaciones.map(x => `<li><a href="${ctx.a(URL.comparacion(x.id))}"><strong>${esc(x.titulo)}</strong><span>${esc(x.intro)}</span></a></li>`).join('')}</ul>`,
    });
  },

  comparacion(x) {
    const ruta = URL.comparacion(x.id);
    const ctx = nuevoContexto(ruta);
    const a = g.por.corriente.get(x.a), b = g.por.corriente.get(x.b);
    const cruzan = musicosEnAmbas(g, x.a, x.b);
    const [ini, fin] = g.rangoLinea;
    const celda = (corr, p) => {
      const d = g.por.disco.get(p.disco); const sp = enlaceSpotify(d);
      return `<div class="escucha-lado" style="${tintaVars(corr)}"><span class="escucha-corriente">${esc(corr.nombre)}</span><strong>"${esc(p.tema)}"</strong><span>de <a href="${ctx.a(URL.disco(d.id))}">${esc(d.titulo)}</a>, grabado en ${rangoAnios(d.grabacion.desde, d.grabacion.hasta)}</span><a class="enlace-externo" href="${esc(sp.url)}" rel="noopener">${sp.texto}</a></div>`;
    };
    pagina(ruta, ctx, {
      titulo: x.titulo, descripcion: x.intro, seccion: 'comparar',
      cuerpo: `<header class="heroe-comparar"><h1 class="oculto">${esc(x.titulo)}: comparación</h1>${barrasDeTinta([a, b], [ini, fin], ctx, { cruce: x.tintaCruce })}</header>
      <div class="lectura lectura-ancha"><p class="entrada">${ctx.texto(x.intro)}</p></div>
      <section class="bloque"><h2>Frente a frente</h2>
        <div class="tabla-scroll" tabindex="0" role="region" aria-label="Tabla comparativa"><table class="comparativa">
          <thead><tr><td></td><th scope="col" style="${tintaVars(a)}">${esc(a.nombre)}</th><th scope="col" style="${tintaVars(b)}">${esc(b.nombre)}</th></tr></thead>
          <tbody>${x.ejes.map(e => `<tr><th scope="row">${esc(e.eje)}</th><td>${ctx.texto(e.a)}</td><td>${ctx.texto(e.b)}</td></tr>`).join('')}</tbody>
        </table></div></section>
      <section class="bloque"><h2>Escuchá en paralelo</h2>
        ${x.escuchaParalela.map(p => `<div class="escucha"><div class="escucha-pares">${celda(a, p.a)}${celda(b, p.b)}</div><p class="escucha-consigna">${ctx.texto(p.consigna)}</p></div>`).join('')}
      </section>
      <section class="bloque"><h2>Quiénes cruzan de un lado al otro</h2>
        <p class="ayuda">Músicos que aparecen en discos de las dos corrientes, según lo cargado hasta ahora.</p>
        <ul class="lista-musicos">${cruzan.map(id => tarjetaMusico(ctx, id)).join('')}</ul>
      </section>`,
    });
  },

  podcasts() {
    const ruta = URL.podcasts();
    const ctx = nuevoContexto(ruta);
    const orden = [...g.podcasts].sort((a, b) => b.episodios.length - a.episodios.length);
    const total = g.episodios.length;
    const exactos = g.episodios.filter(e => e.spotify.estado === 'verificado').length;
    const verificados = g.episodios.filter(e => e.verificacion.estado === 'verificado').length;
    pagina(ruta, ctx, {
      titulo: 'Podcasts', descripcion: 'Podcasts y episodios de jazz, sobre todo en español, conectados con cada ficha.', seccion: 'podcasts', sinFuentes: true,
      cuerpo: `<header class="encabezado"><h1>Podcasts</h1><p>${total} episodios de ${orden.length} programas. ${exactos} tienen el link exacto de Spotify. Los demás abren una búsqueda en Spotify o el link original. Comprobamos que ${verificados} de los ${total} links funcionan.</p></header>
      <section class="bloque"><h2>Programas</h2><ul class="programas">${orden.map(p => `<li><strong>${esc(p.nombre)}</strong><span class="episodio-meta">${p.episodios.length} episodios${p.conductor ? ` · ${esc(p.conductor)}` : ''}${p.idioma === 'es' ? ' · en español' : ''}</span><p>${esc(p.descripcion)}</p><p class="episodio-acciones">${p.spotify ? `<a class="boton boton-chico" href="${esc(p.spotify)}" rel="noopener">Abrir en Spotify</a>` : ''}${p.web ? ` <a href="${esc(p.web)}" rel="noopener">Sitio del programa</a>` : ''}</p></li>`).join('')}</ul></section>
      <section class="bloque"><h2>Episodios</h2>
        <form class="filtros" data-filtros-episodios aria-label="Filtrar episodios">
          <label>Programa <select name="programa"><option value="">Todos</option>${orden.map(p => `<option value="${esc(p.id)}">${esc(p.nombre)}</option>`).join('')}</select></label>
          <label>Spotify <select name="spotify"><option value="">Todos</option><option value="verificado">Link exacto</option></select></label>
          <output class="filtros-cuenta" aria-live="polite" data-cuenta-episodios></output>
        </form>
        <ul class="episodios" data-lista-episodios>${[...g.episodios].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha))).map(tarjetaEpisodio).join('')}</ul>
      </section>`,
    });
  },

  marcas() {
    const ruta = URL.marcas();
    const ctx = nuevoContexto(ruta);
    pagina(ruta, ctx, {
      titulo: 'Mis marcas', descripcion: 'Lo que escuchaste, tus puntajes y tus notas, guardados en este navegador.', seccion: 'marcas', sinFuentes: true,
      cuerpo: `<header class="encabezado"><h1>Mis marcas</h1><p>Lo que marcás queda guardado en este navegador y nadie más lo ve. Si borrás los datos de navegación se pierde, así que conviene exportarlo de vez en cuando.</p></header>
      <section class="bloque panel-marcas">
        <div class="panel-acciones">
          <button type="button" class="boton" data-exportar>Exportar mis marcas</button>
          <label class="boton boton-secundario">Importar marcas<input class="oculto" type="file" accept="application/json,.json" data-importar></label>
        </div>
        <p class="estado-marcas" role="status" data-estado-marcas></p>
      </section>
      <section class="bloque"><h2 data-resumen-marcas>Tus discos marcados</h2>
        <ul class="lista-marcas" data-lista-marcas></ul>
        <p class="vacio" data-vacio-marcas hidden>Todavía no marcaste ningún disco. Entrá a <a href="${ctx.a(URL.discos())}">Discos</a>, elegí uno y marcá si ya lo escuchaste.</p>
      </section>`,
    });
  },

  acerca() {
    const ruta = URL.acerca();
    const ctx = nuevoContexto(ruta);
    const verificados = g.discos.filter(d => d.spotify.estado === 'verificado').length;
    pagina(ruta, ctx, {
      titulo: 'Cómo se arma este banco', descripcion: 'De dónde salen los datos y los textos de este sitio.', sinFuentes: true,
      cuerpo: `<header class="encabezado"><h1>Cómo se arma este banco</h1></header>
      <div class="lectura lectura-ancha">
        <h2>Los datos</h2>
        <p>Los años, sellos y músicos se cotejan con MusicBrainz, Discogs y Wikipedia. Estas fuentes a veces no coinciden, sobre todo en los años: muchos discos de los 50 salieron primero en 10 pulgadas y después en 12. Cuando pasa, la ficha lo dice y explica qué fecha usamos.</p>
        <p>Cada disco guarda por separado cuándo se grabó y cuándo se editó, porque en el bebop la diferencia puede ser de una década.</p>
        <h2>Con qué vara se elige</h2>
        <p>Cada disco y cada músico necesita al menos dos fuentes. Primero buscamos la opinión de otros músicos, como el blog de Ethan Iverson y los Blindfold Test de DownBeat; después críticos, como el Substack de Ted Gioia, y especialistas regionales. Cada ficha aclara si leímos el texto completo, si solo vimos un extracto o si la opinión llega citada por otra fuente: por ejemplo, la <cite>Penguin Guide</cite> aparece citada en Wikipedia.</p>
        <p>La etiqueta <em>Redescubrimiento</em> marca discos o músicos poco conocidos que esas fuentes reivindican, y siempre explica el motivo. Cada región incluye sellos y lugares locales, y también músicos activos hoy, con el año de su última actividad que pudimos documentar.</p>
        <h2>Los textos</h2>
        <p>Son propios y están en borrador. Cada afirmación importante enlaza a la fuente que la respalda. Solo citamos lo que efectivamente consultamos.</p>
        <p><cite>The History of Jazz</cite>, de Ted Gioia, es la referencia principal del proyecto, pero todavía no se cotejó con estos textos. Por eso no aparece citado.</p>
        <h2>Spotify</h2>
        <p>${verificados} de ${g.discos.length} discos tienen un link directo confirmado: comprobamos que el álbum existe y que el título coincide. Puede ser una reedición o una versión ampliada. Los demás abren una búsqueda en Spotify.</p>
        <h2>Podcasts</h2>
        <p>Cada episodio indica si tiene el link exacto de Spotify, si abre una búsqueda o si solo está en otra plataforma. La comprobación confirma que el link responde, no el contenido de cada episodio.</p>
        <h2>Tus marcas</h2>
        <p>Lo que marcás se guarda solo en tu navegador: el sitio no tiene cuentas ni recibe esa información.</p>
      </div>`,
    });
  },
};

function tarjetaMusico(ctx, id) {
  const m = g.por.musico.get(id);
  return `<li class="tarjeta-musico"><a href="${ctx.a(URL.musico(id))}"><strong>${esc(m.nombre)}</strong><span>${esc(aniosVida(m))} · ${esc(m.instrumentos[0])}</span></a></li>`;
}

function indiceDeBusqueda() {
  const item = (tipo, titulo, sub, url, extra = '') => ({ tipo, titulo, sub, url, claves: `${titulo} ${sub} ${extra}` });
  return [
    ...g.corrientes.map(c => item('Corriente', c.nombre, c.lema, URL.corriente(c.id))),
    ...g.musicos.map(m => item('Músico', m.nombre, `${aniosVida(m)} · ${m.instrumentos.join(', ')}`, URL.musico(m.id), m.apodo || '')),
    ...g.discos.map(d => item('Disco', d.titulo, `${d.credito}, ${d.edicion.anio}`, URL.disco(d.id), `${d.sello} ${d.musicos.map(m => m.nombre).join(' ')} ${d.tipo === 'vivo' ? 'en vivo' : 'estudio'} ${d.redescubrimiento ? 'redescubrimiento' : ''}`)),
    ...g.regiones.map(r => item('Región', r.nombre, r.resumen, URL.region(r.id))),
    ...g.regiones.flatMap(r => r.escenaActual.map(e => item('Escena actual', e.nombre, `${e.instrumento} · ${r.nombre}`, URL.region(r.id)))),
    ...g.comparaciones.map(x => item('Comparación', x.titulo, 'Dos corrientes frente a frente', URL.comparacion(x.id))),
    ...g.podcasts.map(p => item('Podcast', p.nombre, p.descripcion, URL.podcasts())),
    ...g.episodios.map(e => item('Episodio', e.titulo, e.programa.nombre, URL.podcasts(), e.temas.join(' '))),
  ];
}

// ---------- Ejecución ----------
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(path.join(DIST, 'recursos'), { recursive: true });
for (const f of fs.readdirSync(path.join(RAIZ, 'sitio'))) fs.copyFileSync(path.join(RAIZ, 'sitio', f), path.join(DIST, 'recursos', f));
fs.writeFileSync(path.join(DIST, 'recursos', 'indice.js'), `window.INDICE_BUSQUEDA=${JSON.stringify(indiceDeBusqueda())};\n`);
fs.writeFileSync(path.join(DIST, '.nojekyll'), '');

construir.inicio();
construir.jazz();
construir.corrientes();
g.corrientes.forEach(construir.corriente);
construir.musicos();
g.musicos.forEach(construir.musico);
construir.discos();
g.discos.forEach(construir.disco);
construir.regiones();
g.regiones.forEach(construir.region);
construir.comparaciones();
g.comparaciones.forEach(construir.comparacion);
construir.podcasts();
construir.marcas();
construir.acerca();

const total = 10 + g.corrientes.length + g.musicos.length + g.discos.length + g.regiones.length + g.comparaciones.length;
console.log(`Listo: ${total} páginas en dist/.`);
