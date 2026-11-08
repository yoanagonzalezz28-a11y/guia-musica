// Marcas personales: escuchado (o visto, en un músico), puntaje, notas y épocas completadas.
// Viven solo en el navegador de cada persona.
//
// Dos promesas que este archivo tiene que cumplir:
// 1. Un cambio de formato no borra nada: las versiones viejas se convierten y la copia original queda guardada aparte.
// 2. Un id que cambia no pierde sus marcas: window.RENOMBRES (datos/renombres.json) dice adónde se mudó cada id viejo.
(function () {
  const CLAVE = 'banco-musica:marcas';
  const RESPALDO = 'banco-musica:marcas:respaldo:'; // + fecha. Se guardan los últimos tres.
  const VERSION = 2;
  const MAX_NOTA = 2000;
  const EPOCA = new Date(0).toISOString();
  const RENOMBRES = window.RENOMBRES || {};
  let memoria = null; // Respaldo si el navegador bloquea localStorage: la página sigue andando.
  let soloLectura = false; // Las marcas tienen un formato más nuevo que este código: no se tocan.

  const vacio = () => ({ version: VERSION, marcas: {} });
  const fechaValida = f => (typeof f === 'string' && !Number.isNaN(Date.parse(f)) ? f : EPOCA);
  const estaVacia = m => !m.escuchado && !m.puntaje && !m.notas.length && !m.completada;
  const mismaNota = (a, b) => a.trim() === b.trim();
  const idValido = id => /^[a-z]+:[a-z0-9-]+$/.test(id);
  // El id vigente de una marca. Si la ficha salió del banco (null), la marca se conserva con su id viejo.
  const idVigente = id => (typeof RENOMBRES[id] === 'string' ? RENOMBRES[id] : id);

  // ---------- Formatos viejos ----------
  // La versión 1 tenía una sola nota y una sola fecha para toda la marca.
  function desdeV1(m) {
    const fecha = fechaValida(m && m.actualizado);
    return {
      escuchado: !!(m && m.escuchado), fechaEscuchado: fecha,
      puntaje: m && m.puntaje, fechaPuntaje: fecha,
      notas: m && m.nota ? [{ texto: m.nota, fecha }] : [],
      titulo: m && m.titulo, actualizado: fecha,
    };
  }
  // Cada versión sabe pasar a la siguiente. Un formato 3 agrega acá su paso "2: d => ...".
  const MIGRACIONES = {
    1: d => ({ version: 2, marcas: Object.fromEntries(Object.entries(d.marcas).map(([id, m]) => [id, desdeV1(m)])) }),
  };
  function aVersionActual(d) {
    let actual = d;
    while (actual.version < VERSION && MIGRACIONES[actual.version]) actual = MIGRACIONES[actual.version](actual);
    return actual.version === VERSION ? actual : null;
  }

  function guardarRespaldo(crudo) {
    try {
      localStorage.setItem(RESPALDO + new Date().toISOString(), crudo);
      const viejos = Object.keys(localStorage).filter(k => k.startsWith(RESPALDO)).sort().slice(0, -3);
      viejos.forEach(k => localStorage.removeItem(k));
    } catch (_) { /* sin espacio: la conversión sigue, pero sin copia */ }
  }

  // Mueve las marcas de ids renombrados. Si ya había una marca con el id nuevo, se combinan.
  function aplicarRenombres(d) {
    let cambio = false;
    for (const id of Object.keys(d.marcas)) {
      const nuevo = idVigente(id);
      if (nuevo === id) continue;
      const vieja = d.marcas[id];
      d.marcas[nuevo] = d.marcas[nuevo] ? resolverConflicto(d.marcas[nuevo], vieja) : vieja;
      delete d.marcas[id];
      cambio = true;
    }
    return cambio;
  }

  function leer() {
    if (memoria) return memoria;
    let crudo;
    try {
      crudo = localStorage.getItem(CLAVE);
    } catch (_) {
      return vacio();
    }
    if (!crudo) return vacio();
    let datos;
    try {
      datos = JSON.parse(crudo);
    } catch (_) {
      // Ilegible: se guarda la copia antes de que la próxima marca escriba encima.
      guardarRespaldo(crudo);
      try { localStorage.removeItem(CLAVE); } catch (_) { /* nada */ }
      return vacio();
    }
    if (!datos || typeof datos.marcas !== 'object' || !Number.isInteger(datos.version)) {
      guardarRespaldo(crudo);
      try { localStorage.removeItem(CLAVE); } catch (_) { /* nada */ }
      return vacio();
    }
    if (datos.version > VERSION) {
      // Guardadas por una versión más nueva del sitio (por ejemplo, otra pestaña ya actualizada). No se pisan.
      soloLectura = true;
      memoria = vacio();
      return memoria;
    }
    const actual = aVersionActual(datos);
    if (!actual) { guardarRespaldo(crudo); return vacio(); }
    const renombradas = aplicarRenombres(actual);
    if (actual !== datos || renombradas) {
      guardarRespaldo(crudo);
      escribir(actual);
    }
    return actual;
  }

  function escribir(datos) {
    if (soloLectura) { memoria = datos; return false; }
    try {
      localStorage.setItem(CLAVE, JSON.stringify(datos));
      memoria = null;
      return true;
    } catch (_) {
      memoria = datos;
      return false;
    }
  }

  const marcaDe = (datos, id) => ({ escuchado: false, fechaEscuchado: EPOCA, puntaje: null, fechaPuntaje: EPOCA, notas: [], titulo: '', completada: false, fechaCompletada: EPOCA, ...datos.marcas[id] });

  function guardar(id, cambios, titulo) {
    const datos = leer();
    const ahora = new Date().toISOString();
    const m = { ...marcaDe(datos, id), titulo, actualizado: ahora };
    if ('escuchado' in cambios) { m.escuchado = cambios.escuchado; m.fechaEscuchado = ahora; }
    if ('puntaje' in cambios) { m.puntaje = cambios.puntaje; m.fechaPuntaje = ahora; }
    if ('completada' in cambios) { m.completada = cambios.completada; m.fechaCompletada = ahora; }
    // El cuadro de texto edita siempre la nota más reciente. Las anteriores no se tocan.
    if ('nota' in cambios) {
      const previas = [...m.notas];
      const ultima = previas.pop();
      m.notas = cambios.nota.trim() ? [...previas, { texto: cambios.nota, fecha: ahora }] : previas;
      if (!ultima && !cambios.nota.trim()) m.notas = previas;
    }
    if (estaVacia(m)) delete datos.marcas[id];
    else datos.marcas[id] = m;
    return escribir(datos);
  }

  function borrarNota(id, fecha) {
    const datos = leer();
    const m = datos.marcas[id];
    if (!m) return;
    m.notas = m.notas.filter(n => n.fecha !== fecha);
    if (estaVacia(m)) delete datos.marcas[id];
    escribir(datos);
  }

  // Un archivo importado puede venir editado a mano o ser cualquier cosa: solo se acepta lo que tiene la forma esperada.
  function limpiarMarca(cruda) {
    if (!cruda || typeof cruda !== 'object') return null;
    const m = Array.isArray(cruda.notas) ? cruda : desdeV1(typeof cruda.nota === 'string' || !cruda.nota ? cruda : { ...cruda, nota: '' });
    const puntaje = Number.isInteger(m.puntaje) && m.puntaje >= 1 && m.puntaje <= 5 ? m.puntaje : null;
    const notas = (Array.isArray(m.notas) ? m.notas : [])
      .filter(n => n && typeof n.texto === 'string' && n.texto.trim())
      .map(n => ({ texto: n.texto.slice(0, MAX_NOTA), fecha: fechaValida(n.fecha) }));
    const limpia = {
      escuchado: m.escuchado === true, fechaEscuchado: fechaValida(m.fechaEscuchado),
      puntaje, fechaPuntaje: fechaValida(m.fechaPuntaje),
      notas,
      titulo: typeof m.titulo === 'string' ? m.titulo.slice(0, 200) : '',
      completada: m.completada === true, fechaCompletada: fechaValida(m.fechaCompletada),
      actualizado: fechaValida(m.actualizado),
    };
    return estaVacia(limpia) ? null : limpia;
  }

  // Escuchado y puntaje: gana el cambio más reciente de cada campo.
  // Notas: si son distintas se conservan todas, cada una con su fecha. Si son iguales queda una.
  function resolverConflicto(actual, importada) {
    const reciente = (a, b) => Date.parse(b) > Date.parse(a);
    const r = { ...actual };
    if (reciente(actual.fechaEscuchado, importada.fechaEscuchado)) { r.escuchado = importada.escuchado; r.fechaEscuchado = importada.fechaEscuchado; }
    if (reciente(actual.fechaPuntaje, importada.fechaPuntaje)) { r.puntaje = importada.puntaje; r.fechaPuntaje = importada.fechaPuntaje; }
    if (reciente(actual.fechaCompletada || EPOCA, importada.fechaCompletada || EPOCA)) { r.completada = importada.completada; r.fechaCompletada = importada.fechaCompletada; }
    const notas = (actual.notas || []).map(n => ({ ...n }));
    for (const n of importada.notas || []) {
      const igual = notas.find(x => mismaNota(x.texto, n.texto));
      if (!igual) notas.push(n);
      else if (reciente(igual.fecha, n.fecha)) igual.fecha = n.fecha;
    }
    r.notas = notas.sort((a, b) => a.fecha.localeCompare(b.fecha));
    r.titulo = actual.titulo || importada.titulo;
    r.actualizado = reciente(actual.actualizado, importada.actualizado) ? importada.actualizado : actual.actualizado;
    return r;
  }

  // Revisa un conjunto de marcas que llega de afuera (archivo o link) y lo deja en el formato actual.
  function validarArchivo(archivo) {
    if (!archivo || ![1, VERSION].includes(archivo.version) || !archivo.marcas || typeof archivo.marcas !== 'object' || Array.isArray(archivo.marcas)) {
      throw new Error('Esas marcas no tienen el formato de este sitio. Usá un archivo o un link generados desde esta página.');
    }
    const limpias = {};
    let descartadas = 0;
    for (const [idCrudo, cruda] of Object.entries(archivo.marcas)) {
      const m = idValido(idCrudo) ? limpiarMarca(cruda) : null;
      if (!m) { descartadas++; continue; }
      const id = idVigente(idCrudo);
      limpias[id] = limpias[id] ? resolverConflicto(limpias[id], m) : m;
    }
    return { marcas: limpias, descartadas };
  }

  // Combinar: lo de afuera se suma a lo que ya hay, con la regla de conflictos de arriba.
  function combinar(archivo) {
    const { marcas, descartadas } = validarArchivo(archivo);
    const datos = leer();
    const r = { nuevas: 0, actualizadas: 0, sinCambios: 0, descartadas };
    for (const [id, importada] of Object.entries(marcas)) {
      const actual = datos.marcas[id];
      if (!actual) { datos.marcas[id] = importada; r.nuevas++; continue; }
      const combinada = resolverConflicto(actual, importada);
      const sinFechaGeneral = m => JSON.stringify({ ...m, actualizado: 0 });
      if (sinFechaGeneral(combinada) === sinFechaGeneral(actual)) r.sinCambios++;
      else { datos.marcas[id] = combinada; r.actualizadas++; }
    }
    escribir(datos);
    return r;
  }

  // Reemplazar: lo de afuera pasa a ser todo. Lo que había queda como respaldo en este navegador.
  function reemplazar(archivo) {
    const { marcas, descartadas } = validarArchivo(archivo);
    try {
      const crudo = localStorage.getItem(CLAVE);
      if (crudo) guardarRespaldo(crudo);
    } catch (_) { /* nada */ }
    escribir({ version: VERSION, marcas });
    return { total: Object.keys(marcas).length, descartadas };
  }

  function importar(texto) {
    let archivo;
    try {
      archivo = JSON.parse(texto);
    } catch (_) {
      throw new Error('Ese archivo no es un JSON válido. Elegí uno exportado desde esta página.');
    }
    return combinar(archivo);
  }

  function exportar() {
    const datos = leer();
    return { nombre: `marcas-banco-de-musica-${new Date().toISOString().slice(0, 10)}.json`, contenido: JSON.stringify({ ...datos, exportado: new Date().toISOString() }, null, 2), total: Object.keys(datos.marcas).length };
  }

  // ---------- Llevar las marcas a otro dispositivo ----------
  // Todo viaja dentro del link, después de "#": esa parte no llega nunca al servidor.
  // Para que entre en un QR, cada marca va como una lista corta y el conjunto se comprime:
  //   [id corto, escuchado, fecha, puntaje, fecha, completada, fecha, [[nota, fecha], ...]]
  // Los ceros y la lista de notas vacía del final no viajan. El título tampoco: el otro sitio lo tiene.
  // Las fechas van en minutos desde 2020 (0 = nunca). Al redondear hacia abajo, una marca que vuelve
  // nunca parece más nueva que la original, así que combinar dos veces no cambia nada.
  const TIPOS = { disco: 'd', musico: 'm', corriente: 'c' };
  const TIPOS_LARGOS = Object.fromEntries(Object.entries(TIPOS).map(([k, v]) => [v, k]));
  const ORIGEN = Date.UTC(2020, 0, 1);
  const aMinutos = f => Math.max(0, Math.floor((Date.parse(f) - ORIGEN) / 60000)) || 0;
  const deMinutos = s => (Number.isInteger(s) && s > 0 ? new Date(ORIGEN + s * 60000).toISOString() : EPOCA);
  const sinColaVacia = x => { while (x.length > 1 && (x.at(-1) === 0 || (Array.isArray(x.at(-1)) && !x.at(-1).length))) x.pop(); return x; };

  const aBase64Url = bytes => {
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  const deBase64Url = t => Uint8Array.from(atob(t.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  const comprime = typeof CompressionStream === 'function';
  const pasarPor = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());

  async function empaquetar() {
    const lista = Object.entries(leer().marcas).map(([id, m]) => {
      const [tipo, clave] = id.split(':');
      return sinColaVacia([`${TIPOS[tipo] || tipo}:${clave}`, m.escuchado ? 1 : 0, aMinutos(m.fechaEscuchado), m.puntaje || 0, aMinutos(m.fechaPuntaje), m.completada ? 1 : 0, aMinutos(m.fechaCompletada || EPOCA), (m.notas || []).map(n => [n.texto, aMinutos(n.fecha)])]);
    });
    const bytes = new TextEncoder().encode(JSON.stringify(lista));
    // Prefijo: versión del paquete (1) y si va comprimido (z) o no (j).
    if (comprime) return { codigo: `1z${aBase64Url(await pasarPor(bytes, new CompressionStream('deflate-raw')))}`, total: lista.length };
    return { codigo: `1j${aBase64Url(bytes)}`, total: lista.length };
  }

  async function desempaquetar(codigo) {
    const formato = String(codigo).slice(0, 2);
    if (formato === '1z' && !comprime) throw new Error('Este navegador es muy viejo para abrir este link. Usá el archivo exportado.');
    let lista;
    try {
      if (formato !== '1z' && formato !== '1j') throw new Error();
      let bytes = deBase64Url(String(codigo).slice(2));
      if (formato === '1z') bytes = await pasarPor(bytes, new DecompressionStream('deflate-raw'));
      lista = JSON.parse(new TextDecoder().decode(bytes));
      if (!Array.isArray(lista)) throw new Error();
    } catch (_) {
      throw new Error('El link está cortado o no es de este sitio. Volvé a copiarlo completo.');
    }
    const marcas = {};
    for (const x of lista) {
      if (!Array.isArray(x) || typeof x[0] !== 'string') continue;
      const [tipo, clave] = x[0].split(':');
      marcas[`${TIPOS_LARGOS[tipo] || tipo}:${clave}`] = {
        escuchado: x[1] === 1, fechaEscuchado: deMinutos(x[2]),
        puntaje: x[3] || null, fechaPuntaje: deMinutos(x[4]),
        completada: x[5] === 1, fechaCompletada: deMinutos(x[6]),
        notas: (Array.isArray(x[7]) ? x[7] : []).map(n => ({ texto: Array.isArray(n) ? n[0] : '', fecha: deMinutos(Array.isArray(n) ? n[1] : 0) })),
        titulo: '',
        actualizado: deMinutos(Math.max(x[2] || 0, x[4] || 0, x[6] || 0, ...(Array.isArray(x[7]) ? x[7] : []).map(n => (Array.isArray(n) && n[1]) || 0))),
      };
    }
    return { version: VERSION, marcas };
  }

  window.Marcas = {
    leer, guardar, borrarNota, importar, combinar, reemplazar, exportar, empaquetar, desempaquetar, validarArchivo,
    persistente: () => !memoria, soloLectura: () => soloLectura,
    retirada: id => RENOMBRES[id] === null,
  };
})();
