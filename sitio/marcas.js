// Marcas personales: escuchado (o visto, en un músico), puntaje, notas y épocas completadas.
// Viven solo en el navegador de cada persona.
(function () {
  const CLAVE = 'banco-musica:marcas';
  const VERSION = 2;
  const MAX_NOTA = 2000;
  const EPOCA = new Date(0).toISOString();
  let memoria = null; // Respaldo si el navegador bloquea localStorage: la página sigue andando.

  const vacio = () => ({ version: VERSION, marcas: {} });
  const fechaValida = f => (typeof f === 'string' && !Number.isNaN(Date.parse(f)) ? f : EPOCA);
  const estaVacia = m => !m.escuchado && !m.puntaje && !m.notas.length && !m.completada;
  const mismaNota = (a, b) => a.trim() === b.trim();

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

  function leer() {
    if (memoria) return memoria;
    try {
      const crudo = localStorage.getItem(CLAVE);
      if (!crudo) return vacio();
      const datos = JSON.parse(crudo);
      if (datos && datos.version === 1 && datos.marcas) {
        return { version: VERSION, marcas: Object.fromEntries(Object.entries(datos.marcas).map(([id, m]) => [id, desdeV1(m)])) };
      }
      return datos && datos.version === VERSION && datos.marcas ? datos : vacio();
    } catch (_) {
      return vacio();
    }
  }

  function escribir(datos) {
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
    if (reciente(actual.fechaCompletada || EPOCA, importada.fechaCompletada)) { r.completada = importada.completada; r.fechaCompletada = importada.fechaCompletada; }
    const notas = [...actual.notas];
    for (const n of importada.notas) {
      const igual = notas.find(x => mismaNota(x.texto, n.texto));
      if (!igual) notas.push(n);
      else if (reciente(igual.fecha, n.fecha)) igual.fecha = n.fecha;
    }
    r.notas = notas.sort((a, b) => a.fecha.localeCompare(b.fecha));
    r.titulo = actual.titulo || importada.titulo;
    r.actualizado = reciente(actual.actualizado, importada.actualizado) ? importada.actualizado : actual.actualizado;
    return r;
  }

  function importar(texto) {
    let archivo;
    try {
      archivo = JSON.parse(texto);
    } catch (_) {
      throw new Error('Ese archivo no es un JSON válido. Elegí uno exportado desde esta página.');
    }
    if (!archivo || ![1, VERSION].includes(archivo.version) || !archivo.marcas || typeof archivo.marcas !== 'object' || Array.isArray(archivo.marcas)) {
      throw new Error('Ese archivo no tiene el formato de marcas de este sitio. Elegí uno exportado desde esta página.');
    }
    const datos = leer();
    const r = { nuevas: 0, actualizadas: 0, sinCambios: 0, descartadas: 0 };
    for (const [id, cruda] of Object.entries(archivo.marcas)) {
      const importada = /^[a-z]+:[a-z0-9-]+$/.test(id) ? limpiarMarca(cruda) : null;
      if (!importada) { r.descartadas++; continue; }
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

  function exportar() {
    const datos = leer();
    return { nombre: `marcas-banco-de-musica-${new Date().toISOString().slice(0, 10)}.json`, contenido: JSON.stringify({ ...datos, exportado: new Date().toISOString() }, null, 2), total: Object.keys(datos.marcas).length };
  }

  window.Marcas = { leer, guardar, borrarNota, importar, exportar, persistente: () => !memoria };
})();
