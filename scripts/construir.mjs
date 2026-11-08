// Genera el sitio estático en dist/. Sin dependencias: `node scripts/construir.mjs`.
// Dirección visual: tapas y contratapas de discos de un sello de jazz de los 50 y 60.
import fs from 'node:fs';
import path from 'node:path';
import { RAIZ, cargarGenero, cargarGeneros, cargarFuentes, validar, discosDe, tocoCon, musicosEnAmbas, episodiosDe } from './datos.mjs';

const DIST = path.join(RAIZ, 'dist');
const SITIO = 'Banco de música';
const fuentes = cargarFuentes();
const generos = cargarGeneros();
const g = cargarGenero('jazz');

const { errores, avisos } = validar(g, fuentes);
if (avisos.length) console.log(`${avisos.length} aviso(s) que no bloquean. Detalle: npm run auditar.`);
if (errores.length) {
  console.error(`No se construyó el sitio. ${errores.length} error(es) en los datos:\n- ${errores.join('\n- ')}`);
  process.exit(1);
}

// ---------- Utilidades ----------
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sinCitas = s => String(s ?? '').replace(/\[\^[a-z0-9-]+\]/g, '').replace(/\*/g, '');
const unir = (lista, ultimo = ' y ') => lista.length < 2 ? lista.join('') : `${lista.slice(0, -1).join(', ')}${ultimo}${lista.at(-1)}`;
const rangoAnios = (a, b) => (a === b ? `${a}` : `${a}–${b}`);
const aniosVida = m => (m.nacimiento.anio ? `${m.nacimiento.anio}–${m.muerte?.anio ?? ''}` : 'Grupo');
const anioDisco = d => d.edicion.anio;
const hastaHoy = c => c.periodo.hasta >= new Date().getFullYear() - 1;
const finEpoca = c => (hastaHoy(c) ? 'hoy' : c.periodo.hasta);
const dos = n => String(n).padStart(2, '0');
// Spotify agrega a los títulos "(feat. ...)" con los músicos invitados: en la contratapa ya están en el personal.
// También quita los agregados de reedición: "- Remastered 1998", "- Rudy Van Gelder Edition", "- Mono".
const tituloTema = t => String(t).replace(/\s*[([](feat|with)\.?\s[^)\]]*[)\]]/gi, '').replace(/\s+-\s+[^-]*\b(remaster|remastered|edition|digital|mono|stereo)\b.*$/i, '').trim();
const duracion = s => (s ? `${Math.floor(s / 60)}:${dos(s % 60)}` : '');

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
  audiovisual: () => 'jazz/audiovisual/',
  marcas: () => 'mis-marcas/',
  acerca: () => 'acerca/',
};

// Cada página arma sus propias fuentes. En el texto no hay notas visibles:
// como mucho, un número chico y gris al final del párrafo, que lleva a la línea plegada "Fuentes (n)".
function nuevoContexto(ruta) {
  const niveles = ruta.split('/').filter(Boolean).length;
  const raiz = '../'.repeat(niveles);
  const citas = [];
  const numero = id => { let n = citas.indexOf(id) + 1; if (!n) { citas.push(id); n = citas.length; } return n; };
  return {
    raiz,
    a: destino => raiz + destino,
    citas,
    texto(s) {
      const ids = [];
      let h = esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/\[\^([a-z0-9-]+)\]/g, (_, id) => { if (!ids.includes(id)) ids.push(id); return ''; });
      h = h.replace(/\s+([.,;:)])/g, '$1').trim();
      if (!ids.length) return h;
      return `${h}<sup class="refs">${ids.map(id => { const n = numero(id); return `<a href="#fuente-${n}" aria-label="Fuente ${n}">${n}</a>`; }).join(' ')}</sup>`;
    },
  };
}

// ---------- Color de las épocas ----------
// Cada época tiene un color plano. Para usarlo como texto sobre crema o sobre negro, se ajusta hasta tener contraste suficiente.
const PAPEL_CLARO = '#f2e8d5', PAPEL_OSCURO = '#0f0d0b';
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const hex = c => `#${c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
const luminancia = h => { const [r, gg, b] = rgb(h).map(v => v / 255).map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * gg + 0.0722 * b; };
const contraste = (a, b) => { const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
function sobreFondo(color, fondo, minimo = 4) {
  const hacia = luminancia(fondo) > 0.5 ? [0, 0, 0] : [255, 255, 255];
  let c = rgb(color);
  for (let i = 0; i < 20 && contraste(hex(c), fondo) < minimo; i++) c = c.map((v, k) => v + (hacia[k] - v) * 0.12);
  return hex(c);
}
const tintaVars = c => `--tinta-c:${c.tinta};--tinta-c-texto:${c.tintaTexto};--tinta-c-claro:${sobreFondo(c.tinta, PAPEL_CLARO)};--tinta-c-oscuro:${sobreFondo(c.tinta, PAPEL_OSCURO)}`;
const NEUTRA = { tinta: '#3a342c', tintaTexto: '#f2e8d5' };
const corrienteDe = d => (d.corrientes.length ? g.por.corriente.get(d.corrientes[0]) : NEUTRA);
// El nombre de la época va escrito junto a su color: el color solo no alcanza para saber de qué época es.
const nombreEpoca = d => (d.corrientes.length ? g.por.corriente.get(d.corrientes[0]).nombre : '');
const rotuloEpoca = d => (nombreEpoca(d) ? `<span class="rotulo-epoca">${esc(nombreEpoca(d))}</span>` : '');
const ORDEN = [...g.corrientes].sort((x, y) => x.periodo.desde - y.periodo.desde || x.periodo.hasta - y.periodo.hasta);
const numeroDe = id => ORDEN.findIndex(c => c.id === id) + 1;
const largoTitular = nombre => Math.max(...String(nombre).split(/\s+/).map(p => p.length));

// ---------- Piezas compartidas ----------
const NIVEL_ORDEN = ['musico', 'guia-critica', 'especialista', 'prensa', 'referencia'];
const NIVEL_TEXTO = { musico: 'Músicos', 'guia-critica': 'Guía crítica', especialista: 'Especialista', prensa: 'Prensa', referencia: 'Referencia' };
const ACCESO_TEXTO = { completa: 'Texto leído', extracto: 'Solo extracto', indirecta: 'Citado por terceros' };
const etiquetaRedescubrimiento = (chica = false) => `<span class="etiqueta${chica ? ' etiqueta-chica' : ''}">${chica ? 'Redescubrimiento' : 'Redes&shy;cubrimiento'}</span>`;
const fechaCorta = f => (f ? new Date(`${f}T12:00:00Z`).toLocaleDateString('es-AR', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }) : '');

// Marcar ahí mismo: un disco se marca como escuchado y un músico como visto.
const marcar = (id, titulo, texto) => `<label class="marcar"><input type="checkbox" data-marcar="${id}" data-marcar-titulo="${esc(titulo)}"><span>${texto}</span></label>`;
const marcarDisco = d => marcar(`disco:${d.id}`, d.titulo, 'Escuchado');
const marcarMusico = m => marcar(`musico:${m.id}`, m.nombre, 'Visto');

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

function bloquePodcasts(ctx, tipo, id, { visibles = 4, numero } = {}) {
  const lista = episodiosDe(g, tipo, id);
  if (!lista.length) return '';
  const resto = lista.slice(visibles);
  const cuerpo = `<h2>Para escuchar sobre esto</h2>
    <ul class="episodios">${lista.slice(0, visibles).map(tarjetaEpisodio).join('')}</ul>
    ${resto.length ? `<details class="mas-episodios"><summary>Ver ${resto.length} ${resto.length === 1 ? 'episodio más' : 'episodios más'}</summary><ul class="episodios">${resto.map(tarjetaEpisodio).join('')}</ul></details>` : ''}
    <p class="ayuda"><a href="${ctx.a(URL.podcasts())}">Todos los podcasts</a></p>`;
  return numero ? numerado(numero, `<div class="podcasts-ficha">${cuerpo}</div>`) : `<section class="bloque podcasts-ficha">${cuerpo}</section>`;
}

function bloqueRespaldo(x) {
  const lista = [...(x.respaldo || [])].sort((a, b) => NIVEL_ORDEN.indexOf(fuentes[a.fuente].nivel) - NIVEL_ORDEN.indexOf(fuentes[b.fuente].nivel));
  if (!lista.length) return '';
  return `<section class="respaldo"><h3>Qué dicen las fuentes</h3><ul>${lista.map(r => {
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

// ---------- Para ver y escuchar ----------
const TIPO_AV = { pelicula: 'Película', documental: 'Documental', serie: 'Serie', concierto: 'Concierto filmado', video: 'Video en YouTube' };
const audiovisualDe = (tipo, id) => g.audiovisual.filter(x => (tipo === 'musico' ? x.musicos : x.corrientes).includes(id)).sort((a, b) => a.anio - b.anio);
function tarjetaAV(ctx, x, { conFichas = false } = {}) {
  const donde = (x.donde || []).map(w => (w.url ? `<a href="${esc(w.url)}" rel="noopener">${esc(w.texto)}</a>` : esc(w.texto)));
  const fichas = conFichas ? [...x.musicos.map(id => enlaceMusico(ctx, id)), ...x.corrientes.map(id => enlaceCorriente(ctx, id))] : [];
  return `<li class="av" data-tipo="${x.tipo}">
    <span class="av-tipo dato">${TIPO_AV[x.tipo]} · ${x.anio}</span>
    <strong class="av-titulo">${esc(x.titulo)}</strong>
    ${x.director || donde.length ? `<span class="av-meta">${x.director ? `Dirección: ${esc(x.director)}` : ''}${x.director && donde.length ? ' · ' : ''}${donde.length ? `Dónde verla: ${donde.join(', ')}` : ''}</span>` : ''}
    <p>${esc(x.descripcion)}</p>
    ${fichas.length ? `<p class="av-fichas">${unir(fichas)}</p>` : ''}
    ${x.youtube ? `<p class="av-acciones"><a class="boton boton-chico" href="${esc(x.youtube.url)}" rel="noopener">Ver en YouTube</a> <span class="dato">Canal oficial: ${esc(x.youtube.canal)}</span></p>` : ''}
  </li>`;
}
// Solo en las fichas que tienen películas, documentales o videos: en el resto queda el bloque de podcasts de siempre.
function bloqueVerYEscuchar(ctx, tipo, id, { numero } = {}) {
  const av = audiovisualDe(tipo, id);
  if (!av.length) return bloquePodcasts(ctx, tipo, id, { numero });
  const episodios = episodiosDe(g, tipo, id).slice(0, 4);
  const videos = av.filter(x => x.youtube);
  const filmes = av.filter(x => !x.youtube);
  const grupo = (titulo, cuerpo) => `<section class="av-grupo"><h3>${titulo}</h3>${cuerpo}</section>`;
  const cuerpo = `<div class="ver-y-escuchar podcasts-ficha">
    ${episodios.length ? grupo('Podcasts', `<ul class="episodios">${episodios.map(tarjetaEpisodio).join('')}</ul>`) : ''}
    ${videos.length ? grupo('Entrevistas y conciertos en YouTube', `<ul class="av-lista">${videos.map(x => tarjetaAV(ctx, x)).join('')}</ul>`) : ''}
    ${filmes.length ? grupo('Películas y documentales', `<ul class="av-lista">${filmes.map(x => tarjetaAV(ctx, x)).join('')}</ul>`) : ''}
    <p class="ayuda"><a href="${ctx.a(URL.audiovisual())}">Todo lo audiovisual del banco</a></p></div>`;
  return numero ? numerado(numero, cuerpo, 'Para ver y escuchar') : `<section class="bloque"><h2>Para ver y escuchar</h2>${cuerpo}</section>`;
}

// Bloques numerados 01, 02, 03 del afiche.
const numerado = (n, cuerpo, titulo = '') => `<section class="numerado"><span class="numerado-num" aria-hidden="true">${dos(n)}</span><div class="numerado-cuerpo">${titulo ? `<h2>${titulo}</h2>` : ''}${cuerpo}</div></section>`;

// Los discos importantes de un músico: los elegidos en discosEsenciales o, si no hay, sus discos clave y los que lidera.
function cincoDiscos(ctx, m) {
  const ids = m.discosEsenciales?.length ? m.discosEsenciales : [...new Set([...m.epocas.map(e => e.discoClave.disco), ...m.epocas.flatMap(e => e.discos)])];
  const lista = ids.map(id => g.por.disco.get(id)).filter(Boolean).slice(0, 5);
  if (!lista.length) return '';
  return `<section class="bloque cinco-discos"><h2>${lista.length === 5 ? 'Cinco discos' : 'Discos para empezar'}</h2><ol class="lista-resenas">${lista.map(d => `<li style="${tintaVars(corrienteDe(d))}">
    <h3><a href="${ctx.a(URL.disco(d.id))}">${esc(d.titulo)}</a> ${rotuloEpoca(d)} <span class="dato">${anioDisco(d)}${d.sello ? ` · ${esc(d.sello)}` : ''}</span></h3>
    <p>${ctx.texto(d.comentario[0] || '')}</p>
    ${d.resenaExtensa?.length ? `<details><summary class="dato">Leer la reseña completa</summary>${d.resenaExtensa.map(p => `<p>${ctx.texto(p)}</p>`).join('')}</details>` : ''}
    <div class="resena-pie">${marcarDisco(d)}<a class="enlace-externo" href="${esc(enlaceSpotify(d).url)}" rel="noopener">${enlaceSpotify(d).texto}</a></div></li>`).join('')}</ol></section>`;
}

function filaDisco(ctx, d) {
  const c = corrienteDe(d);
  return `<li class="fila-disco" style="${tintaVars(c)}" data-corriente="${esc(d.corrientes.join(' '))}" data-tipo="${d.tipo}" data-redescubrimiento="${d.redescubrimiento ? 'si' : 'no'}" data-marca-fila="disco:${d.id}">
    <span class="fila-disco-anio">${anioDisco(d)}</span>
    <span class="fila-disco-cuerpo"><span><a class="fila-disco-titulo" href="${ctx.a(URL.disco(d.id))}">${esc(d.titulo)}</a>${d.redescubrimiento ? ` ${etiquetaRedescubrimiento(true)}` : ''}</span>
    <span class="fila-disco-meta">${nombreEpoca(d) ? `<span class="fila-disco-epoca">${esc(nombreEpoca(d))}</span> · ` : ''}${esc(d.credito)}${d.sello ? ` · ${esc(d.sello)}` : ''} · ${d.tipo === 'vivo' ? 'en vivo' : 'estudio'}</span>
    <span class="fila-disco-marca" data-marca-chip="disco:${d.id}"></span></span>
    ${marcarDisco(d)}
  </li>`;
}

// El jazz vocal no es una corriente sino una forma de tocar que atraviesa todas: se filtra por instrumento.
const INSTRUMENTOS = [['voz', 'Voz'], ['piano', 'Piano y teclados'], ['saxo', 'Saxo'], ['trompeta', 'Trompeta y fliscorno'], ['trombon', 'Trombón y tuba'], ['clarinete', 'Clarinete y flauta'], ['guitarra', 'Guitarra'], ['bajo', 'Contrabajo y bajo'], ['bateria', 'Batería y percusión'], ['vibrafono', 'Vibráfono'], ['organo', 'Órgano'], ['cuerdas', 'Violín, oud y otras cuerdas'], ['composicion', 'Composición y dirección'], ['grupo', 'Grupos']];
const FAMILIAS = { voz: /voz|canto/, piano: /piano|teclad|sintetiz|electr/, saxo: /saxo/, trompeta: /trompeta|corneta|flisc/, trombon: /tromb|tuba/, clarinete: /clarin|flaut|oboe/, guitarra: /guitarra/, bajo: /contrabajo|bajo/, bateria: /bater|percus|conga|tabla|timbal/, vibrafono: /vibr/, organo: /órgano|organo/, cuerdas: /viol|oud|arpa|bandone|sitar|acorde/, composicion: /compos|direcc|arreglo/, grupo: /grupo|trío|trio/ };
const familiasDe = m => Object.entries(FAMILIAS).filter(([, re]) => m.instrumentos.some(i => re.test(i.toLowerCase()))).map(([k]) => k);

// Un músico cuenta como visto si se lo marca a él o a algún disco suyo: la tarjeta lleva la lista de sus discos.
function tarjetaMusico(ctx, id) {
  const m = g.por.musico.get(id);
  const discos = discosDe(g, id).map(d => d.id);
  return `<li class="tarjeta-musico" data-corriente="${esc(m.corrientes.join(' '))}" data-instrumento="${esc(familiasDe(m).join(' '))}" data-discos-de="${esc(discos.join(' '))}"><a href="${ctx.a(URL.musico(id))}"><strong>${esc(m.nombre)}</strong><span>${esc(aniosVida(m))} · ${esc(m.instrumentos[0] || '')}</span></a>${marcarMusico(m)}</li>`;
}

// ---------- Tapas de disco: las épocas ----------
function tapa(ctx, c) {
  return `<li class="tapa" style="${tintaVars(c)};--largo:${largoTitular(c.nombre)}"><a href="${ctx.a(URL.corriente(c.id))}">
    <span class="tapa-arriba"><span>N.º ${dos(numeroDe(c.id))}</span><span>${c.periodo.desde}–${finEpoca(c)}</span></span>
    <strong class="tapa-nombre">${esc(c.nombre)}</strong>
    <span class="tapa-lema">${esc(c.lema)}</span>
    <span class="sticker" data-progreso="${c.id}" aria-hidden="true"></span></a></li>`;
}
// Las corrientes que conviven quedan una al lado de la otra: cada fila es una década de inicio.
function porDecada(corrientes) {
  const grupos = new Map();
  for (const c of [...corrientes].sort((x, y) => x.periodo.desde - y.periodo.desde || x.periodo.hasta - y.periodo.hasta)) {
    const d = Math.floor(c.periodo.desde / 10) * 10;
    if (!grupos.has(d)) grupos.set(d, []);
    grupos.get(d).push(c);
  }
  return [...grupos];
}
const grillaDeTapas = ctx => `<div class="grilla-tapas">${porDecada(g.corrientes).map(([dec, lista]) => `<section class="fila-tapas" aria-label="Épocas que empiezan en los ${dec}"><h2 class="decada-rotulo">${dec}</h2><ul class="tapas">${lista.map(c => tapa(ctx, c)).join('')}</ul></section>`).join('')}</div>`;

// ---------- Tu camino: la línea completa, de Orígenes a hoy ----------
// Sale gris desde el servidor; sitio.js la colorea con las marcas guardadas en el navegador.
const totalDeEpoca = c => g.discos.filter(d => d.corrientes.includes(c.id)).length + c.musicos.filter(id => g.por.musico.has(id)).length;
const metroInicial = ctx => `<ol class="metro-linea">${ORDEN.map(c => `<li class="parada sin-empezar" data-parada="${c.id}" style="${tintaVars(c)};--p:0">
  <span class="parada-punto" aria-hidden="true"></span>
  <div><a class="parada-nombre" href="${ctx.a(URL.corriente(c.id))}">${esc(c.nombre)}</a>
  <span class="parada-datos dato"><span class="parada-anios">${c.periodo.desde}–${finEpoca(c)}</span> · <span data-parada-cuenta>0 de ${totalDeEpoca(c)}</span><span data-parada-fecha></span></span></div></li>`).join('')}</ol>
  <div class="metro-elegir" data-metro-elegir hidden></div>`;

// ---------- Comparación de dos corrientes ----------
function barrasDeTinta(corrientes, [ini, fin], ctx, { cruce, enlazar = true } = {}) {
  const pos = a => ((a - ini) / (fin - ini)) * 100;
  const decadas = [];
  for (let a = Math.ceil(ini / 5) * 5; a <= fin; a += 5) decadas.push(a);
  const orden = [...corrientes].sort((x, y) => x.periodo.desde - y.periodo.desde);
  let solape = '', notaSolape = '', margenCruce = 0;
  if (cruce && orden.length === 2) {
    const d = Math.max(orden[0].periodo.desde, orden[1].periodo.desde), h = Math.min(orden[0].periodo.hasta, orden[1].periodo.hasta);
    if (d < h) {
      solape = `<div class="tintas-cruce" style="left:${pos(d)}%;width:${pos(h) - pos(d)}%;background:${cruce}"><span>${d}–${h}<br>conviven</span></div>`;
      notaSolape = `<p class="tintas-nota dato">Conviven entre ${d} y ${h}.</p>`; margenCruce = pos(h) - pos(d);
    }
  }
  const barras = orden.map((c, i) => {
    const contenido = `<span class="tinta-nombre">${esc(c.nombre)}</span><span class="tinta-anios">c. ${rangoAnios(c.periodo.desde, c.periodo.hasta)}</span>`;
    const estilo = `${tintaVars(c)};left:${pos(c.periodo.desde)}%;width:${pos(c.periodo.hasta) - pos(c.periodo.desde)}%;top:${(i * 100) / orden.length}%;height:${100 / orden.length}%${i === 1 && margenCruce ? `;padding-left:calc(${margenCruce}% + 10px)` : ''}`;
    return enlazar ? `<a class="tinta" style="${estilo}" href="${ctx.a(URL.corriente(c.id))}">${contenido}</a>` : `<div class="tinta" style="${estilo}">${contenido}</div>`;
  }).join('');
  return `<div class="tintas" style="--filas:${orden.length}"><div class="tintas-marco">${barras}${solape}</div>
    <div class="tintas-escala" aria-hidden="true">${decadas.map(a => `<span style="left:${pos(a)}%">${a}</span>`).join('')}</div>${notaSolape}</div>`;
}

// ---------- Fuentes plegadas al pie ----------
function fuentesPlegadas(ctx, { respaldo = '', extra = [], cotejado = null } = {}) {
  const items = ctx.citas.map((id, i) => {
    const f = fuentes[id];
    return `<li id="fuente-${i + 1}">${f.url ? `<a href="${esc(f.url)}" rel="noopener">${esc(f.titulo)}</a>` : esc(f.titulo)}. Consultada el ${esc(f.consultada)}.</li>`;
  }).join('');
  const nRespaldo = (respaldo.match(/<li>/g) || []).length;
  const total = ctx.citas.length + nRespaldo + extra.reduce((n, x) => n + (x.n || 0), 0);
  if (!total && !extra.length) return '';
  const gioia = cotejado ?? ctx.citas.includes('gioia');
  return `<details class="fuentes" id="fuentes"><summary>Fuentes (${total})</summary>
    ${items ? `<ol>${items}</ol>` : ''}${respaldo}${extra.map(x => x.html).join('')}
    <p class="aviso-gioia">${gioia ? 'Texto propio, cotejado con <cite>Historia del jazz</cite>, de Ted Gioia.' : 'Texto propio, en borrador. Falta cotejarlo con <cite>Historia del jazz</cite>, de Ted Gioia.'} <a href="${ctx.a(URL.acerca())}">Sobre este banco</a>.</p></details>`;
}

function pagina(ruta, ctx, { titulo, descripcion, cuerpo, seccion, claseCuerpo = '' }) {
  const nav = [['Épocas', URL.corrientes(), 'corrientes'], ['Músicos', URL.musicos(), 'musicos'], ['Discos', URL.discos(), 'discos'], ['Regiones', URL.regiones(), 'regiones'], ['Audiovisual', URL.audiovisual(), 'audiovisual'], ['Comparar', URL.comparaciones(), 'comparar'], ['Mis marcas', URL.marcas(), 'marcas']];
  const html = `<!doctype html>
<html lang="es-AR" data-raiz="${ctx.raiz}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(titulo)}${titulo === SITIO ? '' : ` · ${SITIO}`}</title>
<meta name="robots" content="noindex">
<meta name="description" content="${esc(sinCitas(descripcion))}">
<script>try{if(localStorage.getItem('banco-musica:tema')==='oscuro')document.documentElement.dataset.theme='dark'}catch(e){}</script>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%2316130f'/%3E%3Ccircle cx='16' cy='16' r='6' fill='%23c2301f'/%3E%3Ccircle cx='16' cy='16' r='1.5' fill='%23f2e8d5'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=League+Gothic&display=swap">
<link rel="stylesheet" href="${ctx.a('recursos/estilos.css')}">
</head>
<body class="${claseCuerpo}">
<a class="saltar" href="#contenido">Saltar al contenido</a>
<p class="aviso-prueba">Versión de prueba: los textos están en borrador.</p>
<header class="cabecera">
  <a class="marca-sitio" href="${ctx.a(URL.jazz())}">Banco de <span>música</span></a>
  <nav aria-label="Principal"><ul>${nav.map(([t, u, s]) => `<li><a href="${ctx.a(u)}"${s === seccion ? ' aria-current="page"' : ''}>${t}</a></li>`).join('')}</ul></nav>
  <div class="herramientas">
    <div class="buscador" role="search">
      <label class="oculto" for="buscar">Buscar en el banco</label>
      <input id="buscar" type="search" placeholder="Buscar disco, músico, época…" autocomplete="off" aria-controls="resultados" aria-expanded="false">
      <ul id="resultados" class="resultados" hidden></ul>
    </div>
    <button type="button" class="tema" data-tema aria-pressed="false">Oscuro</button>
  </div>
</header>
<main id="contenido">
${cuerpo}
</main>
<footer class="pie">
  <p>${SITIO}. Datos de <a href="https://musicbrainz.org" rel="noopener">MusicBrainz</a>, <a href="https://www.discogs.com" rel="noopener">Discogs</a>, <a href="https://www.wikipedia.org" rel="noopener">Wikipedia</a> y Spotify. Textos propios. <a href="${ctx.a(URL.acerca())}">Sobre este banco</a>.</p>
</footer>
<script src="${ctx.a('recursos/indice.js')}"></script>
<script src="${ctx.a('recursos/camino.js')}"></script>
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
      titulo: SITIO, descripcion: 'Un banco de aprendizaje de géneros musicales, con fichas conectadas de épocas, músicos, discos y regiones.',
      cuerpo: `<section class="portada"><h1>${SITIO}</h1><p>Fichas conectadas para aprender un género disco por disco.</p>
      <ul class="generos">${generos.map(x => x.estado === 'activo'
        ? `<li><a href="${ctx.a(`${x.id}/`)}"><strong>${esc(x.nombre)}</strong><span class="dato">${esc(x.lema)}</span></a></li>`
        : `<li class="inactivo"><strong>${esc(x.nombre)}</strong><span class="dato">${esc(x.lema)}</span></li>`).join('')}</ul></section>`,
    });
  },

  jazz() {
    const ruta = URL.jazz();
    const ctx = nuevoContexto(ruta);
    pagina(ruta, ctx, {
      titulo: 'Jazz', descripcion: 'El camino del jazz, época por época.', claseCuerpo: 'inicio-jazz',
      cuerpo: `<header class="genero-cabeza"><h1>Jazz</h1><p>El camino del jazz</p></header>
      ${grillaDeTapas(ctx)}
      <p class="presentacion">${g.corrientes.length} épocas, de Nueva Orleans a hoy. Cada tapa abre una época con su historia, sus músicos y sus discos.</p>
      <section class="camino" aria-labelledby="titulo-camino"><h2 id="titulo-camino">Tu camino</h2>
        <p class="ayuda">Cada parada toma su color cuando marcás algo de esa época y se llena cuando la marcás como estudiada.</p>
        <div class="metro" data-metro>${metroInicial(ctx)}</div>
      </section>`,
    });
  },

  corrientes() {
    const ruta = URL.corrientes();
    const ctx = nuevoContexto(ruta);
    pagina(ruta, ctx, {
      titulo: 'Épocas', descripcion: 'Las épocas del jazz, ordenadas por el año en que empiezan.', seccion: 'corrientes',
      cuerpo: `<header class="encabezado" style="--largo:6"><h1>Épocas</h1><p>${g.corrientes.length} épocas, ordenadas por el año en que empiezan. Las que conviven en el tiempo quedan una al lado de la otra.</p></header>
      ${grillaDeTapas(ctx)}`,
    });
  },

  corriente(c) {
    const ruta = URL.corriente(c.id);
    const ctx = nuevoContexto(ruta);
    const hijas = g.corrientes.filter(x => x.deriva.includes(c.id));
    const padres = c.deriva.map(id => enlaceCorriente(ctx, id)).concat(c.derivaPendiente.map(esc));
    const discos = g.discos.filter(d => d.corrientes.includes(c.id)).sort((a, b) => anioDisco(a) - anioDisco(b));
    const comparaciones = g.comparaciones.filter(x => x.a === c.id || x.b === c.id);
    let n = 0;
    const bloques = [
      numerado(++n, `<div class="lectura">${c.texto.map(p => `<p>${ctx.texto(p)}</p>`).join('')}
        <p class="legado"><strong>Qué dejó.</strong> ${ctx.texto(c.legado)}</p>
        ${padres.length || hijas.length ? `<p>${padres.length ? `Viene de ${unir(padres)}.` : ''}${hijas.length ? ` De acá sale ${unir(hijas.map(x => enlaceCorriente(ctx, x.id)))}.` : ''}</p>` : ''}</div>`, 'La historia'),
      numerado(++n, `<ul class="suena">${c.suena.map(s => `<li>${ctx.texto(s)}</li>`).join('')}</ul>`, 'Cómo suena'),
      c.discosEsenciales.length ? numerado(++n, `<ol class="esenciales">${c.discosEsenciales.map(e => {
        const d = g.por.disco.get(e.disco);
        return `<li class="esencial"><span class="dato">${esc(d.credito)} · ${anioDisco(d)}</span><h3><a href="${ctx.a(URL.disco(d.id))}">${esc(d.titulo)}</a></h3><p>${ctx.texto(e.porque)}</p>${marcarDisco(d)}</li>`;
      }).join('')}</ol>`, 'Para empezar') : '',
      numerado(++n, `<ul class="lista-musicos">${c.musicos.filter(id => g.por.musico.has(id)).map(id => tarjetaMusico(ctx, id)).join('')}</ul>
        ${c.musicosPendientes.length ? `<p class="pendientes"><strong>Fichas por escribir:</strong> ${esc(c.musicosPendientes.join(', '))}.</p>` : ''}`, 'Músicos'),
      numerado(++n, `<p class="ayuda">${discos.length} discos. Marcá los que vas escuchando: tu camino se llena con ellos.</p><ul class="lista-discos">${discos.map(d => filaDisco(ctx, d)).join('')}</ul>`, 'Los discos'),
      bloqueVerYEscuchar(ctx, 'corriente', c.id, { numero: ++n }),
    ].filter(Boolean).join('');
    // "Época estudiada" está arriba, en el afiche, y otra vez al final. No hace falta marcar todos los discos.
    const botonEstudiada = `<button type="button" class="boton-completar" data-completar="corriente:${c.id}" data-completar-titulo="${esc(c.nombre)}" aria-pressed="false">Época estudiada</button>`;
    pagina(ruta, ctx, {
      titulo: c.nombre, descripcion: `${c.lema}. ${sinCitas(c.texto[0])}`, seccion: 'corrientes',
      cuerpo: `<div style="${tintaVars(c)}">
      <header class="afiche">
        <p class="afiche-datos dato"><span>N.º ${dos(numeroDe(c.id))} de ${g.corrientes.length}</span><span>${esc(c.lugares.join(' · '))}</span></p>
        <p class="afiche-anios" aria-label="De ${c.periodo.desde} a ${finEpoca(c)}">${c.periodo.desde}–${hastaHoy(c) ? 'hoy' : String(c.periodo.hasta).slice(2)}</p>
        <h1 style="--largo:${largoTitular(c.nombre)}">${esc(c.nombre)}</h1>
        <p class="afiche-lema">${esc(c.lema)}</p>
        <div class="afiche-banda" aria-hidden="true"></div>
        <div class="completar-arriba">${botonEstudiada}<span class="completar-fecha dato" data-completar-fecha></span></div>
        <ol class="hitos-linea" aria-label="Fechas clave">${c.hitos.map(h => `<li><span class="hito-fecha dato">${esc(h.fecha)}</span><p>${ctx.texto(h.texto)}</p></li>`).join('')}</ol>
      </header>
      ${bloques}
      ${comparaciones.map(x => `<a class="comparar-enlace" href="${ctx.a(URL.comparacion(x.id))}"><span class="dato">Comparar</span> ${esc(x.titulo)}</a>`).join('')}
      <section class="completar" aria-label="Estado de la época">
        ${botonEstudiada}
        <p class="completar-fecha dato" data-completar-fecha></p>
        <p class="ayuda">No hace falta marcar todos los discos: tocalo cuando sientas que la estudiaste. Se puede desmarcar.</p>
      </section>
      ${fuentesPlegadas(ctx, { respaldo: bloqueRespaldo(c) })}
      </div>`,
    });
  },

  musicos() {
    const ruta = URL.musicos();
    const ctx = nuevoContexto(ruta);
    const orden = [...g.musicos].sort((a, b) => (a.nacimiento.anio ?? 9999) - (b.nacimiento.anio ?? 9999) || a.nombre.localeCompare(b.nombre));
    pagina(ruta, ctx, {
      titulo: 'Músicos', descripcion: 'Músicos organizados por épocas, con cinco discos para cada uno.', seccion: 'musicos',
      cuerpo: `<header class="encabezado" style="--largo:7"><h1>Músicos</h1><p>${g.musicos.length} músicos y grupos, ordenados por año de nacimiento. Cada ficha recorre la carrera por épocas y propone cinco discos.</p></header>
      <form class="filtros" data-filtros-musicos aria-label="Filtrar músicos">
        <label>Época <select name="corriente"><option value="">Todas</option>${ORDEN.map(c => `<option value="${c.id}">${esc(c.nombre)}</option>`).join('')}</select></label>
        <label>Instrumento <select name="instrumento"><option value="">Todos</option>${INSTRUMENTOS.map(([v, n]) => `<option value="${v}">${n}</option>`).join('')}</select></label>
        <output class="filtros-cuenta" aria-live="polite" data-cuenta-musicos></output>
      </form>
      <ul class="lista-musicos" data-lista-musicos>${orden.map(m => tarjetaMusico(ctx, m.id)).join('')}</ul>`,
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
    const discos = discosDe(g, m.id).map(d => d.id);
    pagina(ruta, ctx, {
      titulo: m.nombre, descripcion: m.resumen, seccion: 'musicos',
      cuerpo: `<div style="${tintaVars(principal)}">
      <header class="heroe-musico">
        <p class="heroe-anios dato">${esc(aniosVida(m))} · ${esc(unir(m.instrumentos))}</p>
        <h1 style="--largo:${largoTitular(m.nombre)}">${esc(m.nombre)}</h1>
        ${m.redescubrimiento ? `<p>${etiquetaRedescubrimiento(true)}</p>` : ''}
        <p class="heroe-datos">${m.nacimiento.lugar ? `Nació en ${esc(m.nacimiento.lugar)}. ` : ''}${m.apodo ? `Le decían ${esc(m.apodo)}. ` : ''}${m.corrientes.length ? `${m.corrientes.length === 1 ? 'Época' : 'Épocas'}: ${unir(m.corrientes.map(c => enlaceCorriente(ctx, c)))}. ` : ''}${m.regiones.length ? `Regiones: ${unir(m.regiones.map(r => enlaceRegion(ctx, r)))}.` : ''}</p>
        <div class="afiche-banda" aria-hidden="true"></div>
        <div class="musico-acciones" data-discos-de="${esc(discos.join(' '))}">${marcarMusico(m)}<a class="boton boton-chico" href="${esc(spotify)}" rel="noopener">${m.spotify ? 'Abrir en Spotify' : 'Buscar en Spotify'}</a></div>
      </header>
      <div class="lectura bloque"><p class="entrada">${ctx.texto(m.resumen)}</p>
      ${m.redescubrimiento ? `<p class="nota-datos"><strong>Por qué es un redescubrimiento.</strong> ${ctx.texto(m.redescubrimiento.motivo)}</p>` : ''}</div>
      ${m.epocasPendientes?.length ? `<p class="pendientes lectura"><strong>Etapas por cargar:</strong> ${esc(m.epocasPendientes.join(', '))}.</p>` : ''}
      ${m.epocas.length ? `<section class="bloque" aria-label="Carrera por épocas"><h2>Su carrera</h2><div class="epocas">
        ${m.epocas.map(e => {
          const clave = g.por.disco.get(e.discoClave.disco);
          const sp = enlaceSpotify(clave);
          return `<article class="epoca" style="${tintaVars(corrienteDe(clave))}">
            <header class="epoca-cabeza"><span class="epoca-anios">${rangoAnios(e.desde, e.hasta)}</span><h3>${esc(e.titulo)}</h3></header>
            <div class="epoca-cuerpo">${e.texto ? `<p>${ctx.texto(e.texto)}</p>` : ''}
            <div class="disco-clave">${rotuloEpoca(clave)}<span class="dato">Disco clave · ${anioDisco(clave)}${clave.sello ? ` · ${esc(clave.sello)}` : ''}</span>
              <h4><a href="${ctx.a(URL.disco(clave.id))}">${esc(clave.titulo)}</a></h4>
              <p>${ctx.texto(e.discoClave.explicacion)}</p>
              <a class="enlace-externo" href="${esc(sp.url)}" rel="noopener">${sp.texto}</a>
            </div>
            ${e.discos.length ? `<span class="rotulo">El resto de esta época</span><ul class="lista-discos">${e.discos.map(id => filaDisco(ctx, g.por.disco.get(id))).join('')}</ul>` : ''}
            </div></article>`;
        }).join('')}</div></section>` : ''}
      ${cincoDiscos(ctx, m)}
      ${bloqueVerYEscuchar(ctx, 'musico', m.id)}
      ${otros.length ? `<section class="bloque"><h2>También toca en</h2><ul class="lista-discos">${otros.map(d => filaDisco(ctx, d)).join('')}</ul></section>` : ''}
      ${socios.length ? `<section class="bloque"><h2>Tocó con</h2><p class="ayuda">Sale de los discos cargados, no de toda su carrera.</p><ul class="socios">${socios.map(s => `<li>${enlaceMusico(ctx, s.id)} <span>${s.n} ${s.n === 1 ? 'disco' : 'discos'}</span></li>`).join('')}</ul></section>` : ''}
      <p class="discografia-completa"><a class="boton" href="${esc(spotify)}" rel="noopener">Ir a la discografía completa${m.spotify ? '' : ' (búsqueda en Spotify)'}</a></p>
      ${fuentesPlegadas(ctx, { respaldo: bloqueRespaldo(m) })}
      </div>`,
    });
  },

  discos() {
    const ruta = URL.discos();
    const ctx = nuevoContexto(ruta);
    const orden = [...g.discos].sort((a, b) => anioDisco(a) - anioDisco(b) || a.titulo.localeCompare(b.titulo));
    pagina(ruta, ctx, {
      titulo: 'Discos', descripcion: 'Discos con año, sello, músicos, época y link para escuchar.', seccion: 'discos',
      cuerpo: `<header class="encabezado" style="--largo:6"><h1>Discos</h1><p>${g.discos.length} discos, ordenados por año de edición.</p></header>
      <form class="filtros" data-filtros aria-label="Filtrar discos">
        <label>Época <select name="corriente"><option value="">Todas</option>${ORDEN.map(c => `<option value="${c.id}">${esc(c.nombre)}</option>`).join('')}</select></label>
        <label>Tipo <select name="tipo"><option value="">Todos</option><option value="estudio">Estudio</option><option value="vivo">En vivo</option></select></label>
        <label>Etiqueta <select name="redescubrimiento"><option value="">Todas</option><option value="si">Redescubrimientos</option></select></label>
        <label>Marcas <select name="marca"><option value="">Todos</option><option value="pendiente">Sin escuchar</option><option value="escuchado">Escuchados</option></select></label>
        <output class="filtros-cuenta" aria-live="polite" data-cuenta></output>
      </form>
      <ul class="lista-discos" data-lista-filtrable>${orden.map(d => filaDisco(ctx, d)).join('')}</ul>`,
    });
  },

  // La ficha de un disco es la contratapa de un LP: catálogo, sello, año, formato, músicos y temas.
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
    const notas = `${d.comentario.map(p => `<p>${ctx.texto(p)}</p>`).join('')}
      ${d.resenaExtensa?.length ? `<span class="rotulo">En detalle</span>${d.resenaExtensa.map(p => `<p>${ctx.texto(p)}</p>`).join('')}` : ''}
      ${d.redescubrimiento ? `<p class="nota-datos"><strong>Por qué es un redescubrimiento.</strong> ${ctx.texto(d.redescubrimiento.motivo)}</p>` : ''}
      ${d.corrienteNota ? `<p class="nota-datos"><strong>Por qué está en esta época.</strong> ${ctx.texto(d.corrienteNota)}</p>` : ''}`;
    const respaldo = bloqueRespaldo(d);
    const extra = [
      enlacesFuente.length && { n: enlacesFuente.length, html: `<h3>Ficha en</h3><p>${enlacesFuente.map(([t, u]) => `<a href="${esc(u)}" rel="noopener">${t}</a>`).join(' · ')}</p>` },
      d.discrepancias.length && { n: 0, html: `<h3>Dónde no coinciden las fuentes</h3><ul>${d.discrepancias.map(x => `<li>${ctx.texto(x.texto)}</li>`).join('')}</ul>` },
      d.temas?.length && { n: 0, html: `<p class="ayuda">La lista de temas sale de la edición disponible en Spotify, que puede ser una reedición.</p>` },
    ].filter(Boolean);
    pagina(ruta, ctx, {
      titulo: `${d.titulo} (${d.credito})`, descripcion: sinCitas(d.comentario[0]), seccion: 'discos',
      cuerpo: `<div style="${tintaVars(c)}"><article class="contratapa">
      <div class="contratapa-banda">
        <span class="catalogo">${d.catalogo ? esc(d.catalogo) : 'Sin n.º de catálogo'} · ${esc(d.sello || 'Sello sin dato')} · ${d.edicion.anio}</span>
        <span class="formato">${d.tipo === 'vivo' ? 'EN VIVO' : 'ESTUDIO'}${d.compilacion ? ' · RECOPILACIÓN' : ''}</span>
      </div>
      <header class="heroe-disco">
        <h1 style="--largo:${largoTitular(d.titulo)}">${esc(d.titulo)}</h1><p class="credito">${esc(d.credito)}</p>
        ${d.redescubrimiento ? etiquetaRedescubrimiento() : ''}
      </header>
      <div class="contratapa-grilla">
        <div class="notas-tapa lectura">${notas}
          <p><a class="boton" href="${esc(sp.url)}" rel="noopener">${sp.texto}</a></p>
          ${sp.verificado ? (d.spotify.tituloEnSpotify && d.spotify.tituloEnSpotify !== d.titulo ? `<p class="ayuda">En Spotify figura como "${esc(d.spotify.tituloEnSpotify)}".</p>` : '') : '<p class="ayuda">Todavía no confirmamos un álbum exacto en Spotify, así que este link abre una búsqueda.</p>'}
        </div>
        <div class="columna-datos">
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
          <section><span class="rotulo">Músicos</span>
            <ul class="personal">${d.musicos.map(m => `<li><span class="personal-nombre">${m.musico ? enlaceMusico(ctx, m.musico) : esc(m.nombre)}</span> <span class="personal-instrumento">${esc(m.instrumento)}${m.nota ? `, ${esc(m.nota.charAt(0).toLowerCase() + m.nota.slice(1))}` : ''}</span></li>`).join('')}</ul>
            ${d.personalNota ? `<p class="ayuda">${ctx.texto(d.personalNota)}</p>` : ''}</section>
          ${d.temas?.length ? `<section><span class="rotulo">Temas</span><ol class="temas">${d.temas.map(t => `<li><span>${esc(tituloTema(t.titulo))}</span><span class="duracion">${duracion(t.duracion)}</span></li>`).join('')}</ol></section>` : ''}
          <section><span class="rotulo">Ficha</span><dl class="ficha">
            ${dato('Grabado', esc(grabado))}
            ${dato('Editado', esc(editado))}
            ${dato('Lugar', esc(d.lugar))}
            ${dato('Época', d.corrientes.length ? unir(d.corrientes.map(x => enlaceCorriente(ctx, x))) : `${esc(d.corrientePendiente)} (por cargar)`)}
            ${d.regiones?.length ? dato('Región', unir(d.regiones.filter(x => g.por.region.has(x)).map(x => enlaceRegion(ctx, x)))) : ''}
          </dl></section>
        </div>
      </div>
      </article>
      ${bloquePodcasts(ctx, 'disco', d.id)}
      ${fuentesPlegadas(ctx, { respaldo, extra, cotejado: false })}</div>`,
    });
  },

  regiones() {
    const ruta = URL.regiones();
    const ctx = nuevoContexto(ruta);
    pagina(ruta, ctx, {
      titulo: 'Regiones', descripcion: 'El jazz, abierto por regiones del mundo.', seccion: 'regiones',
      cuerpo: `<header class="encabezado" style="--largo:8"><h1>Regiones</h1><p>El jazz no es una sola historia. Cada región tiene sus sellos, sus pioneros y su escena actual.</p></header>
      <ul class="lista-regiones">${g.regiones.map(r => `<li><a href="${ctx.a(URL.region(r.id))}"><strong>${esc(r.nombre)}</strong><span>${esc(r.resumen)}</span></a></li>`).join('')}</ul>`,
    });
  },

  region(r) {
    const ruta = URL.region(r.id);
    const ctx = nuevoContexto(ruta);
    const discos = g.discos.filter(d => r.discos.includes(d.id) || d.regiones?.includes(r.id)).sort((a, b) => anioDisco(a) - anioDisco(b));
    pagina(ruta, ctx, {
      titulo: r.nombre, descripcion: r.resumen, seccion: 'regiones',
      cuerpo: `<header class="heroe-region"><p class="heroe-anios dato">Jazz del mundo</p><h1 style="--largo:${largoTitular(r.nombre)}">${esc(r.nombre)}</h1><p class="heroe-lema">${esc(r.resumen)}</p></header>
      <div class="lectura bloque">${r.texto.map(p => `<p>${ctx.texto(p)}</p>`).join('')}
      ${r.corrientes.length ? `<p>Épocas relacionadas: ${unir(r.corrientes.filter(c => g.por.corriente.has(c)).map(c => enlaceCorriente(ctx, c)))}.</p>` : ''}</div>
      ${r.sellos?.length ? `<section class="bloque"><h2>Sellos y lugares</h2><ul class="sellos">${r.sellos.map(s => `<li><strong>${esc(s.nombre)}</strong><span>${ctx.texto(s.texto)}</span></li>`).join('')}</ul></section>` : ''}
      ${r.escenaActual?.length ? `<section class="bloque"><h2>Escena actual</h2><p class="ayuda">Músicos activos hoy, con su última actividad que pudimos documentar.</p><ul class="escena">${r.escenaActual.map(e => `<li><div class="escena-cabeza"><strong>${esc(e.nombre)}</strong><span class="dato">${esc(e.instrumento)}${e.base ? ` · ${esc(e.base)}` : ''}</span></div><p>${ctx.texto(e.detalle)}</p><p class="respaldo-fuente">Última actividad documentada: ${e.ultimaActividad}. Fuentes: ${e.fuentes.map(f => `<a href="${esc(fuentes[f].url)}" rel="noopener">${esc(fuentes[f].titulo)}</a>`).join(' · ')}</p></li>`).join('')}</ul></section>` : ''}
      <section class="bloque"><h2>Músicos</h2>${r.musicos.length ? `<ul class="lista-musicos">${r.musicos.filter(id => g.por.musico.has(id)).map(id => tarjetaMusico(ctx, id)).join('')}</ul>` : ''}
      ${r.figurasPendientes?.length ? `<p class="pendientes"><strong>Fichas por escribir:</strong> ${esc(r.figurasPendientes.join(', '))}.</p>` : ''}</section>
      ${discos.length ? `<section class="bloque"><h2>Discos</h2><ul class="lista-discos">${discos.map(d => filaDisco(ctx, d)).join('')}</ul></section>` : ''}
      ${bloquePodcasts(ctx, 'region', r.id)}
      ${fuentesPlegadas(ctx)}`,
    });
  },

  comparaciones() {
    const ruta = URL.comparaciones();
    const ctx = nuevoContexto(ruta);
    pagina(ruta, ctx, {
      titulo: 'Comparar', descripcion: 'Dos épocas frente a frente.', seccion: 'comparar',
      cuerpo: `<header class="encabezado" style="--largo:8"><h1>Comparar</h1><p>Dos épocas frente a frente, con discos para escuchar en paralelo. Solo están las comparaciones que ayudan a entender.</p></header>
      <ul class="lista-regiones">${g.comparaciones.map(x => `<li><a href="${ctx.a(URL.comparacion(x.id))}"><strong>${esc(x.titulo)}</strong><span>${esc(x.intro)}</span></a></li>`).join('')}</ul>`,
    });
  },

  comparacion(x) {
    const ruta = URL.comparacion(x.id);
    const ctx = nuevoContexto(ruta);
    const a = g.por.corriente.get(x.a), b = g.por.corriente.get(x.b);
    const cruzan = musicosEnAmbas(g, x.a, x.b);
    const ini = Math.floor((Math.min(a.periodo.desde, b.periodo.desde) - 4) / 5) * 5;
    const fin = Math.ceil((Math.max(a.periodo.hasta, b.periodo.hasta) + 4) / 5) * 5;
    const celda = (corr, p) => {
      const d = g.por.disco.get(p.disco); const sp = enlaceSpotify(d);
      return `<div class="escucha-lado" style="${tintaVars(corr)}"><span class="escucha-corriente">${esc(corr.nombre)}</span><strong>"${esc(p.tema)}"</strong><span>de <a href="${ctx.a(URL.disco(d.id))}">${esc(d.titulo)}</a>, grabado en ${rangoAnios(d.grabacion.desde, d.grabacion.hasta)}</span><a class="enlace-externo" href="${esc(sp.url)}" rel="noopener">${sp.texto}</a></div>`;
    };
    pagina(ruta, ctx, {
      titulo: x.titulo, descripcion: x.intro, seccion: 'comparar',
      cuerpo: `<header class="heroe-comparar"><h1 class="oculto">${esc(x.titulo)}: comparación</h1>${barrasDeTinta([a, b], [ini, fin], ctx, { cruce: x.tintaCruce })}</header>
      <div class="lectura bloque"><p class="entrada">${ctx.texto(x.intro)}</p></div>
      <section class="bloque"><h2>Frente a frente</h2>
        <div class="tabla-scroll" tabindex="0" role="region" aria-label="Tabla comparativa"><table class="comparativa">
          <thead><tr><td></td><th scope="col" style="${tintaVars(a)}">${esc(a.nombre)}</th><th scope="col" style="${tintaVars(b)}">${esc(b.nombre)}</th></tr></thead>
          <tbody>${x.ejes.map(e => `<tr><th scope="row">${esc(e.eje)}</th><td>${ctx.texto(e.a)}</td><td>${ctx.texto(e.b)}</td></tr>`).join('')}</tbody>
        </table></div></section>
      <section class="bloque"><h2>Escuchá en paralelo</h2>
        ${x.escuchaParalela.map(p => `<div class="escucha"><div class="escucha-pares">${celda(a, p.a)}${celda(b, p.b)}</div><p class="escucha-consigna">${ctx.texto(p.consigna)}</p></div>`).join('')}
      </section>
      <section class="bloque"><h2>Quiénes cruzan de un lado al otro</h2>
        <p class="ayuda">Músicos que aparecen en discos de las dos épocas, según lo cargado hasta ahora.</p>
        <ul class="lista-musicos">${cruzan.map(id => tarjetaMusico(ctx, id)).join('')}</ul>
      </section>
      ${fuentesPlegadas(ctx)}`,
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
      titulo: 'Podcasts', descripcion: 'Podcasts y episodios de jazz, sobre todo en español, conectados con cada ficha.', seccion: 'podcasts',
      cuerpo: `<header class="encabezado" style="--largo:8"><h1>Podcasts</h1><p>${total} episodios de ${orden.length} programas, todos con link exacto de Spotify (${exactos}) o de YouTube (${total - exactos}). Los que estaban solo en otras plataformas o tenían el link roto quedaron afuera. Links comprobados: ${verificados} de ${total}.</p></header>
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
      titulo: 'Mis marcas', descripcion: 'Lo que escuchaste, tus puntajes, tus notas y tus épocas completadas, guardados en este navegador.', seccion: 'marcas',
      cuerpo: `<header class="encabezado" style="--largo:5"><h1>Mis marcas</h1><p>Lo que marcás queda guardado en este navegador y nadie más lo ve: discos escuchados, músicos vistos, puntajes, notas y épocas completadas. Si borrás los datos de navegación se pierde, así que conviene exportarlo de vez en cuando.</p></header>
      <section class="bloque panel-marcas">
        <div class="panel-acciones">
          <button type="button" class="boton" data-exportar>Exportar mis marcas</button>
          <label class="boton boton-secundario">Importar marcas<input class="oculto" type="file" accept="application/json,.json" data-importar></label>
        </div>
        <p class="estado-marcas" role="status" data-estado-marcas></p>
      </section>
      <section class="bloque"><h2 data-resumen-marcas>Tus marcas</h2>
        <ul class="lista-marcas" data-lista-marcas></ul>
        <p class="vacio" data-vacio-marcas hidden>Todavía no marcaste nada. Entrá a una <a href="${ctx.a(URL.corrientes())}">época</a> y marcá los discos que ya escuchaste.</p>
      </section>`,
    });
  },

  // Todo lo audiovisual junto: películas, documentales, series, conciertos, videos y episodios de podcast.
  audiovisual() {
    const ruta = URL.audiovisual();
    const ctx = nuevoContexto(ruta);
    const orden = [...g.audiovisual].sort((a, b) => a.anio - b.anio || a.titulo.localeCompare(b.titulo));
    const episodios = [...g.episodios].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
    const tipos = Object.entries(TIPO_AV).filter(([t]) => orden.some(x => x.tipo === t));
    pagina(ruta, ctx, {
      titulo: 'Audiovisual', descripcion: 'Películas, documentales, conciertos filmados, videos de canales oficiales y podcasts sobre jazz.', seccion: 'audiovisual',
      cuerpo: `<header class="encabezado" style="--largo:11"><h1>Audiovisual</h1><p>${orden.length} películas, documentales, series y videos, y ${episodios.length} episodios de podcast. De YouTube solo entran canales oficiales o con permiso.</p></header>
      <form class="filtros" data-filtros-av aria-label="Filtrar por tipo">
        <label>Tipo <select name="tipo"><option value="">Todo</option>${tipos.map(([t, n]) => `<option value="${t}">${n}${t === 'video' ? '' : 's'}</option>`).join('')}<option value="podcast">Episodios de podcast</option></select></label>
        <output class="filtros-cuenta" aria-live="polite" data-cuenta-av></output>
      </form>
      <ul class="av-lista av-todo" data-lista-av>${orden.map(x => tarjetaAV(ctx, x, { conFichas: true })).join('')}
      ${episodios.map(e => { const a = accesoEpisodio(e); return `<li class="av" data-tipo="podcast"><span class="av-tipo dato">Podcast${e.fecha ? ` · ${esc(fechaCorta(e.fecha))}` : ''}</span><strong class="av-titulo">${esc(e.titulo)}</strong><span class="av-meta">${esc(e.programa.nombre)}${e.duracionMin ? ` · ${e.duracionMin} min` : ''}</span><p class="av-acciones"><a class="boton boton-chico" href="${esc(a.url)}" rel="noopener">${a.texto}</a></p></li>`; }).join('')}</ul>
      <p class="ayuda"><a href="${ctx.a(URL.podcasts())}">Ver los podcasts por programa</a></p>`,
    });
  },

  // "Sobre este banco": el criterio de selección y todas las fuentes juntas.
  acerca() {
    const ruta = URL.acerca();
    const ctx = nuevoContexto(ruta);
    const verificados = g.discos.filter(d => d.spotify.estado === 'verificado').length;
    const deYoana = g.discos.filter(d => d.spotify.deLaDiscotecaDeYoana).length;
    const porNivel = NIVEL_ORDEN.map(n => [n, Object.entries(fuentes).filter(([, f]) => f.nivel === n).sort((a, b) => a[1].titulo.localeCompare(b[1].titulo))]);
    pagina(ruta, ctx, {
      titulo: 'Sobre este banco', descripcion: 'De dónde salen los datos y los textos, con qué criterio se eligen y todas las fuentes consultadas.',
      cuerpo: `<header class="encabezado" style="--largo:6"><h1>Sobre este banco</h1><p>Cómo se elige lo que entra, de dónde salen los datos y todas las fuentes consultadas.</p></header>
      ${numerado(1, `<div class="lectura">
        <p>El banco junta épocas, músicos, discos y regiones conectados entre sí. La prioridad es el volumen: un disco o un músico entra con una fuente, y si todavía no tiene una segunda queda marcado internamente como "sin verificar", sin que se note en el sitio.</p>
        <p>Cuando hay opiniones, primero buscamos las de otros músicos, como el blog de Ethan Iverson y los Blindfold Test de DownBeat; después críticos, como el Substack de Ted Gioia, y especialistas regionales. La referencia principal del proyecto es <cite>Historia del jazz</cite>, de Ted Gioia, con la que se cotejan las épocas por capítulo y página.</p>
        <p>La etiqueta <em>Redescubrimiento</em> marca discos o músicos poco conocidos que esas fuentes reivindican, y siempre explica el motivo.</p></div>`, 'El criterio')}
      ${numerado(2, `<div class="lectura">
        <p>Los años, sellos y músicos se cotejan con MusicBrainz, Discogs y Wikipedia. Cuando no coinciden, la ficha del disco lo dice. Cada disco guarda por separado cuándo se grabó y cuándo se editó.</p>
        <p>${verificados} de ${g.discos.length} discos tienen un link exacto de Spotify; ${deYoana} vienen de la discoteca personal de quien arma el banco. Los demás abren una búsqueda. La lista de temas sale de la edición de Spotify, que puede ser una reedición.</p>
        <p>Los textos son propios y no copian a ninguna fuente. Las notas no se ven en el texto: cada ficha las reúne al pie, en "Fuentes".</p></div>`, 'Los datos y los textos')}
      ${numerado(3, `<p class="ayuda">${Object.keys(fuentes).length} fuentes, agrupadas por tipo.</p>${porNivel.filter(([, l]) => l.length).map(([n, l]) => `<h3>${NIVEL_TEXTO[n]} · ${l.length}</h3><ul class="lista-fuentes">${l.map(([, f]) => `<li>${f.url ? `<a href="${esc(f.url)}" rel="noopener">${esc(f.titulo)}</a>` : esc(f.titulo)}</li>`).join('')}</ul>`).join('')}`, 'Todas las fuentes')}
      ${numerado(4, `<div class="lectura"><p>Lo que marcás se guarda solo en tu navegador: el sitio no tiene cuentas ni recibe esa información. Desde <a href="${ctx.a(URL.marcas())}">Mis marcas</a> podés exportarlo e importarlo.</p></div>`, 'Tus marcas')}`,
    });
  },
};

function indiceDeBusqueda() {
  const item = (tipo, titulo, sub, url, extra = '') => ({ tipo, titulo, sub, url, claves: `${titulo} ${sub} ${extra}` });
  return [
    ...g.corrientes.map(c => item('Época', c.nombre, c.lema, URL.corriente(c.id), (c.alias || []).join(' '))),
    ...g.musicos.map(m => item('Músico', m.nombre, `${aniosVida(m)} · ${m.instrumentos.join(', ')}`, URL.musico(m.id), m.apodo || '')),
    ...g.discos.map(d => item('Disco', d.titulo, `${d.credito}, ${d.edicion.anio}`, URL.disco(d.id), `${d.sello || ''} ${d.musicos.map(m => m.nombre).join(' ')} ${d.tipo === 'vivo' ? 'en vivo' : 'estudio'} ${d.redescubrimiento ? 'redescubrimiento' : ''}`)),
    ...g.regiones.map(r => item('Región', r.nombre, r.resumen, URL.region(r.id))),
    ...g.regiones.flatMap(r => (r.escenaActual || []).map(e => item('Escena actual', e.nombre, `${e.instrumento} · ${r.nombre}`, URL.region(r.id)))),
    ...g.comparaciones.map(x => item('Comparación', x.titulo, 'Dos épocas frente a frente', URL.comparacion(x.id))),
    ...g.podcasts.map(p => item('Podcast', p.nombre, p.descripcion, URL.podcasts())),
    ...g.audiovisual.map(x => item(TIPO_AV[x.tipo], x.titulo, `${x.anio}${x.director ? ` · ${x.director}` : ''}`, URL.audiovisual(), x.musicos.map(id => g.por.musico.get(id).nombre).join(' '))),
    ...g.episodios.map(e => item('Episodio', e.titulo, e.programa.nombre, URL.podcasts(), e.temas.join(' '))),
  ];
}

// Datos para "Tu camino": las épocas, con sus discos y músicos, y los discos de cada músico (para el "visto por un disco").
function datosDelCamino() {
  const corrientes = ORDEN.map(c => ({
    id: c.id, nombre: c.nombre, url: URL.corriente(c.id), desde: c.periodo.desde, hasta: finEpoca(c),
    tinta: c.tinta, texto: c.tintaTexto, claro: sobreFondo(c.tinta, PAPEL_CLARO), oscuro: sobreFondo(c.tinta, PAPEL_OSCURO),
    deriva: c.deriva, discos: g.discos.filter(d => d.corrientes.includes(c.id)).map(d => d.id), musicos: c.musicos.filter(id => g.por.musico.has(id)),
  }));
  const musicos = Object.fromEntries(g.musicos.map(m => [m.id, discosDe(g, m.id).map(d => d.id)]));
  return { corrientes, musicos };
}

// ---------- Ejecución ----------
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(path.join(DIST, 'recursos'), { recursive: true });
for (const f of fs.readdirSync(path.join(RAIZ, 'sitio'))) fs.copyFileSync(path.join(RAIZ, 'sitio', f), path.join(DIST, 'recursos', f));
fs.writeFileSync(path.join(DIST, 'recursos', 'indice.js'), `window.INDICE_BUSQUEDA=${JSON.stringify(indiceDeBusqueda())};\n`);
fs.writeFileSync(path.join(DIST, 'recursos', 'camino.js'), `window.CAMINO=${JSON.stringify(datosDelCamino())};\n`);
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
construir.audiovisual();

const total = 11 + g.corrientes.length + g.musicos.length + g.discos.length + g.regiones.length + g.comparaciones.length;
console.log(`Listo: ${total} páginas en dist/.`);
