// Comportamiento del sitio: buscador, marcas en pantalla, filtros y exportar o importar.
(function () {
  const raiz = document.documentElement.dataset.raiz || '';
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const normalizar = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ');

  // ---------- Buscador ----------
  function iniciarBuscador() {
    const entrada = document.getElementById('buscar');
    const lista = document.getElementById('resultados');
    if (!entrada || !lista) return;
    const indice = (window.INDICE_BUSQUEDA || []).map(x => ({ ...x, _t: normalizar(x.titulo), _c: normalizar(x.claves) }));
    let activo = -1;

    const buscar = q => {
      const terminos = normalizar(q).split(/\s+/).filter(Boolean);
      if (!terminos.length) return [];
      return indice
        .filter(x => terminos.every(t => x._c.includes(t)))
        .map(x => ({ x, p: (x._t.startsWith(terminos[0]) ? 3 : 0) + (terminos.every(t => x._t.includes(t)) ? 2 : 0) }))
        .sort((a, b) => b.p - a.p || a.x.titulo.localeCompare(b.x.titulo))
        .slice(0, 8).map(r => r.x);
    };
    const cerrar = () => { lista.hidden = true; entrada.setAttribute('aria-expanded', 'false'); activo = -1; };
    const marcarActivo = () => $$('a', lista).forEach((a, i) => a.classList.toggle('activo', i === activo));

    entrada.addEventListener('input', () => {
      const q = entrada.value.trim();
      lista.textContent = '';
      activo = -1;
      if (!q) return cerrar();
      const hallados = buscar(q);
      if (!hallados.length) {
        const li = document.createElement('li');
        li.className = 'sin-resultados';
        li.textContent = `Nada con "${q}". Probá con un músico, un disco o un sello.`;
        lista.append(li);
      }
      for (const r of hallados) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = raiz + r.url;
        const tipo = document.createElement('span'); tipo.className = 'res-tipo'; tipo.textContent = r.tipo;
        const tit = document.createElement('strong'); tit.textContent = r.titulo;
        const sub = document.createElement('span'); sub.className = 'res-sub'; sub.textContent = r.sub;
        a.append(tipo, tit, sub);
        li.append(a);
        lista.append(li);
      }
      lista.hidden = false;
      entrada.setAttribute('aria-expanded', 'true');
    });
    entrada.addEventListener('keydown', e => {
      const enlaces = $$('a', lista);
      if (e.key === 'Escape') return cerrar();
      if (!enlaces.length) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); activo = (activo + 1) % enlaces.length; marcarActivo(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); activo = (activo - 1 + enlaces.length) % enlaces.length; marcarActivo(); }
      if (e.key === 'Enter') { e.preventDefault(); enlaces[Math.max(activo, 0)].click(); }
    });
    document.addEventListener('click', e => { if (!e.target.closest('.buscador')) cerrar(); });
  }

  // ---------- Marcas en la ficha de un disco ----------
  function iniciarFichaMarcas() {
    const caja = document.querySelector('[data-marca]');
    if (!caja) return;
    const id = caja.dataset.marca, titulo = caja.dataset.marcaTitulo;
    const escuchado = caja.querySelector('[data-campo="escuchado"]');
    const nota = caja.querySelector('[data-campo="nota"]');
    const botones = $$('[data-puntaje]', caja);
    const anteriores = caja.querySelector('[data-notas-anteriores]');
    const pintarAnteriores = notas => {
      anteriores.textContent = '';
      anteriores.hidden = !notas.length;
      for (const n of notas) {
        const li = document.createElement('li');
        const fecha = document.createElement('span');
        fecha.className = 'marca-datos';
        fecha.textContent = new Date(n.fecha).toLocaleDateString('es-AR');
        const texto = document.createElement('p');
        texto.textContent = n.texto;
        const borrar = document.createElement('button');
        borrar.type = 'button';
        borrar.className = 'nota-borrar';
        borrar.textContent = 'Borrar esta nota';
        borrar.addEventListener('click', () => { Marcas.borrarNota(id, n.fecha); pintar(); });
        li.append(fecha, texto, borrar);
        anteriores.append(li);
      }
    };
    const pintar = () => {
      const m = Marcas.leer().marcas[id] || {};
      escuchado.checked = !!m.escuchado;
      const notas = m.notas || [];
      if (document.activeElement !== nota) nota.value = notas.length ? notas[notas.length - 1].texto : '';
      pintarAnteriores(notas.slice(0, -1));
      botones.forEach(b => {
        const n = Number(b.dataset.puntaje);
        b.setAttribute('aria-pressed', String(m.puntaje === n));
        b.classList.toggle('lleno', !!m.puntaje && n <= m.puntaje);
      });
    };
    const guardar = c => { Marcas.guardar(id, c, titulo); pintar(); };
    escuchado.addEventListener('change', () => guardar({ escuchado: escuchado.checked }));
    nota.addEventListener('input', () => guardar({ nota: nota.value }));
    botones.forEach(b => b.addEventListener('click', () => {
      const n = Number(b.dataset.puntaje);
      guardar({ puntaje: Marcas.leer().marcas[id]?.puntaje === n ? null : n });
    }));
    pintar();
  }

  function pintarChips() {
    const marcas = Marcas.leer().marcas;
    $$('[data-marca-chip]').forEach(el => {
      const m = marcas[el.dataset.marcaChip];
      el.textContent = m ? [m.escuchado ? 'Escuchado' : '', m.puntaje ? `${m.puntaje}/5` : ''].filter(Boolean).join(' · ') : '';
    });
  }

  // ---------- Filtros de la lista de discos ----------
  function iniciarFiltros() {
    const form = document.querySelector('[data-filtros]');
    const lista = document.querySelector('[data-lista-filtrable]');
    if (!form || !lista) return;
    const cuenta = form.querySelector('[data-cuenta]');
    const filas = $$('.fila-disco', lista);
    const aplicar = () => {
      const f = new FormData(form);
      const marcas = Marcas.leer().marcas;
      let visibles = 0;
      for (const fila of filas) {
        const escuchado = !!marcas[fila.dataset.marcaFila]?.escuchado;
        const ok = (!f.get('corriente') || fila.dataset.corriente.split(' ').includes(f.get('corriente')))
          && (!f.get('tipo') || fila.dataset.tipo === f.get('tipo'))
          && (!f.get('redescubrimiento') || fila.dataset.redescubrimiento === f.get('redescubrimiento'))
          && (!f.get('marca') || (f.get('marca') === 'escuchado') === escuchado);
        fila.hidden = !ok;
        if (ok) visibles++;
      }
      cuenta.textContent = `${visibles} ${visibles === 1 ? 'disco' : 'discos'}`;
    };
    form.addEventListener('change', aplicar);
    form.addEventListener('submit', e => e.preventDefault());
    aplicar();
  }

  // ---------- Filtros de la lista de músicos ----------
  function iniciarFiltrosMusicos() {
    const form = document.querySelector('[data-filtros-musicos]');
    const lista = document.querySelector('[data-lista-musicos]');
    if (!form || !lista) return;
    const cuenta = form.querySelector('[data-cuenta-musicos]');
    const filas = $$('.tarjeta-musico', lista);
    const aplicar = () => {
      const f = new FormData(form);
      let visibles = 0;
      for (const fila of filas) {
        const ok = (!f.get('corriente') || fila.dataset.corriente.split(' ').includes(f.get('corriente')))
          && (!f.get('instrumento') || fila.dataset.instrumento.split(' ').includes(f.get('instrumento')));
        fila.hidden = !ok;
        if (ok) visibles++;
      }
      cuenta.textContent = `${visibles} ${visibles === 1 ? 'músico' : 'músicos'}`;
    };
    form.addEventListener('change', aplicar);
    form.addEventListener('submit', e => e.preventDefault());
    aplicar();
  }

  // ---------- Filtros de la página de podcasts ----------
  function iniciarFiltrosEpisodios() {
    const form = document.querySelector('[data-filtros-episodios]');
    const lista = document.querySelector('[data-lista-episodios]');
    if (!form || !lista) return;
    const cuenta = form.querySelector('[data-cuenta-episodios]');
    const filas = $$('.episodio', lista);
    const aplicar = () => {
      const f = new FormData(form);
      let visibles = 0;
      for (const fila of filas) {
        const ok = (!f.get('programa') || fila.dataset.programa === f.get('programa')) && (!f.get('spotify') || fila.dataset.spotify === f.get('spotify'));
        fila.hidden = !ok;
        if (ok) visibles++;
      }
      cuenta.textContent = `${visibles} ${visibles === 1 ? 'episodio' : 'episodios'}`;
    };
    form.addEventListener('change', aplicar);
    form.addEventListener('submit', e => e.preventDefault());
    aplicar();
  }

  // ---------- Página "Mis marcas" ----------
  function iniciarPanelMarcas() {
    const lista = document.querySelector('[data-lista-marcas]');
    if (!lista) return;
    const estado = document.querySelector('[data-estado-marcas]');
    const vacio = document.querySelector('[data-vacio-marcas]');
    const resumen = document.querySelector('[data-resumen-marcas]');

    const pintar = () => {
      const entradas = Object.entries(Marcas.leer().marcas).sort((a, b) => b[1].actualizado.localeCompare(a[1].actualizado));
      lista.textContent = '';
      vacio.hidden = entradas.length > 0;
      const cuenta = t => entradas.filter(([id, m]) => id.startsWith(t) && (m.escuchado || m.completada)).length;
      const [d, mu, c] = [cuenta('disco:'), cuenta('musico:'), cuenta('corriente:')];
      resumen.textContent = entradas.length ? `${d} ${d === 1 ? 'disco escuchado' : 'discos escuchados'}, ${mu} ${mu === 1 ? 'músico visto' : 'músicos vistos'} y ${c} ${c === 1 ? 'época completada' : 'épocas completadas'}` : 'Tus marcas';
      for (const [id, m] of entradas) {
        const li = document.createElement('li');
        const [tipo, clave] = id.split(':');
        const ruta = `jazz/${{ disco: 'discos', musico: 'musicos', corriente: 'corrientes' }[tipo] || 'discos'}/${clave}/`;
        const nombre = m.titulo || tituloDe(ruta) || id;
        // Una ficha que salió del banco no tiene página, pero la marca y sus notas se conservan.
        const retirada = Marcas.retirada(id);
        const a = retirada ? document.createElement('strong') : document.createElement('a');
        if (!retirada) a.href = raiz + ruta;
        a.textContent = nombre;
        const datos = document.createElement('span');
        datos.className = 'marca-datos';
        const estado = tipo === 'corriente' ? (m.completada ? `Época completada el ${new Date(m.fechaCompletada).toLocaleDateString('es-AR')}` : 'Época') : tipo === 'musico' ? (m.escuchado ? 'Músico visto' : 'Músico') : (m.escuchado ? 'Escuchado' : 'Sin escuchar');
        datos.textContent = [estado, m.puntaje ? `${m.puntaje}/5` : '', retirada ? 'ya no está en el banco' : ''].filter(Boolean).join(' · ');
        li.append(a, datos);
        for (const n of m.notas || []) {
          const p = document.createElement('p');
          p.textContent = `${new Date(n.fecha).toLocaleDateString('es-AR')}: ${n.texto}`;
          li.append(p);
        }
        lista.append(li);
      }
    };

    document.querySelector('[data-exportar]').addEventListener('click', () => {
      const { nombre, contenido, total } = Marcas.exportar();
      const url = URL.createObjectURL(new Blob([contenido], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url; a.download = nombre;
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      estado.textContent = `Exportaste ${total} ${total === 1 ? 'marca' : 'marcas'} en ${nombre}.`;
      try { localStorage.setItem(CLAVE_EXPORTACION, new Date().toISOString()); } catch (_) { /* sin almacenamiento */ }
      pintarUltimaExportacion();
    });

    const resultadoCombinar = (r, origen) => {
      const partes = [`${r.nuevas} nuevas`, `${r.actualizadas} combinadas`, `${r.sinCambios} sin cambios`];
      if (r.descartadas) partes.push(`${r.descartadas} descartadas por formato inválido`);
      return `${origen}: ${partes.join(', ')}.`;
    };

    document.querySelector('[data-importar]').addEventListener('change', async e => {
      const archivo = e.target.files[0];
      if (!archivo) return;
      try {
        estado.textContent = resultadoCombinar(Marcas.importar(await archivo.text()), 'Importación terminada');
        pintar();
      } catch (error) {
        estado.textContent = error.message;
      }
      e.target.value = '';
    });

    iniciarLlevar(estado);
    iniciarRecibir(estado, pintar, resultadoCombinar);
    pintarUltimaExportacion();

    if (Marcas.soloLectura()) estado.textContent = 'Tus marcas se guardaron con una versión más nueva del sitio. Recargá la página para verlas; mientras tanto, esta pestaña no las modifica.';
    else if (!Marcas.persistente()) estado.textContent = 'Este navegador no permite guardar datos: tus marcas se pierden al cerrar la página.';
    pintar();
  }

  // El título de una ficha, sacado del índice del buscador. Sirve para las marcas que llegan sin título (por link).
  function tituloDe(ruta) {
    return (window.INDICE_BUSQUEDA || []).find(x => x.url === ruta)?.titulo || '';
  }

  const CLAVE_EXPORTACION = 'banco-musica:ultima-exportacion';
  function pintarUltimaExportacion() {
    const lugar = document.querySelector('[data-ultima-exportacion]');
    if (!lugar) return;
    let ultima = null;
    try { ultima = localStorage.getItem(CLAVE_EXPORTACION); } catch (_) { /* sin almacenamiento */ }
    const dias = ultima ? Math.floor((Date.now() - Date.parse(ultima)) / 86400000) : null;
    lugar.textContent = dias === null ? 'Todavía no las exportaste desde este navegador.' : `Última exportación: ${dias === 0 ? 'hoy' : dias === 1 ? 'ayer' : `hace ${dias} días`}.`;
  }

  // ---------- Llevar las marcas a otro dispositivo: link y QR ----------
  function iniciarLlevar(estado) {
    const boton = document.querySelector('[data-llevar]');
    const panel = document.querySelector('[data-llevar-panel]');
    if (!boton || !panel) return;
    const campo = panel.querySelector('[data-llevar-link]');
    const lugarQr = panel.querySelector('[data-llevar-qr]');
    const nota = panel.querySelector('[data-llevar-nota]');
    const compartir = panel.querySelector('[data-llevar-compartir]');

    boton.addEventListener('click', async () => {
      if (!panel.hidden) { panel.hidden = true; boton.setAttribute('aria-expanded', 'false'); return; }
      const { codigo, total } = await Marcas.empaquetar();
      if (!total) { estado.textContent = 'Todavía no tenés marcas para llevar.'; return; }
      const link = `${location.href.split('#')[0]}#llevar=${codigo}`;
      campo.value = link;
      const svg = dibujarQr(link);
      lugarQr.textContent = '';
      lugarQr.hidden = !svg;
      if (svg) lugarQr.append(svg);
      nota.textContent = `${total} ${total === 1 ? 'marca' : 'marcas'}. ${svg ? 'Si el código no se lee bien, agrandá la pantalla o usá el link.' : 'Son demasiadas para un código QR: copiá el link y abrilo en el otro dispositivo, o usá Exportar e Importar.'}`;
      compartir.hidden = !navigator.share;
      panel.hidden = false;
      boton.setAttribute('aria-expanded', 'true');
      panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    panel.querySelector('[data-llevar-copiar]').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(campo.value);
        nota.textContent = 'Link copiado.';
      } catch (_) {
        campo.select();
        nota.textContent = 'Seleccioné el link: copialo con Ctrl+C (o mantené apretado en el teléfono).';
      }
    });
    compartir.addEventListener('click', () => navigator.share({ title: 'Mis marcas del Banco de música', url: campo.value }).catch(() => {}));
  }

  // Dibuja el QR como SVG: queda nítido a cualquier tamaño. Devuelve null si el link no entra en un QR.
  function dibujarQr(texto) {
    // Pasado este largo el código sale tan denso que una cámara no lo lee bien en pantalla: mejor solo el link.
    if (typeof window.qrcode !== 'function' || texto.length > 1500) return null;
    let qr;
    try {
      qr = window.qrcode(0, 'L');
      qr.addData(texto, 'Byte');
      qr.make();
    } catch (_) {
      return null;
    }
    const n = qr.getModuleCount();
    const margen = 4;
    const lado = n + margen * 2;
    let d = '';
    for (let f = 0; f < n; f++) for (let c = 0; c < n; c++) if (qr.isDark(f, c)) d += `M${c + margen} ${f + margen}h1v1h-1z`;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 ${lado} ${lado}`);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Código QR con el link de tus marcas');
    svg.setAttribute('shape-rendering', 'crispEdges');
    const fondo = document.createElementNS(ns, 'rect');
    fondo.setAttribute('width', lado); fondo.setAttribute('height', lado); fondo.setAttribute('fill', '#ffffff');
    const modulos = document.createElementNS(ns, 'path');
    modulos.setAttribute('d', d); modulos.setAttribute('fill', '#000000');
    svg.append(fondo, modulos);
    return svg;
  }

  // ---------- Recibir marcas desde un link ----------
  // El link trae "#llevar=…". Antes de tocar nada se pregunta si combinar o reemplazar.
  async function iniciarRecibir(estado, pintar, resultadoCombinar) {
    const caja = document.querySelector('[data-recibir]');
    if (!caja) return;
    // Si el link se pega en esta misma pestaña, solo cambia lo que va después de "#": hay que volver a leerlo.
    window.addEventListener('hashchange', () => { if (location.hash.startsWith('#llevar=')) location.reload(); });
    const hash = location.hash.match(/^#llevar=([A-Za-z0-9_-]+)$/);
    if (!hash) return;
    const limpiarLink = () => history.replaceState(null, '', location.pathname + location.search);
    let archivo;
    try {
      archivo = await Marcas.desempaquetar(hash[1]);
      Marcas.validarArchivo(archivo);
    } catch (error) {
      estado.textContent = error.message;
      limpiarLink();
      return;
    }
    const llegan = Object.keys(archivo.marcas).length;
    const hay = Object.keys(Marcas.leer().marcas).length;
    const plural = (n, a, b) => `${n} ${n === 1 ? a : b}`;
    caja.querySelector('[data-recibir-texto]').textContent = hay
      ? `Este link trae ${plural(llegan, 'marca', 'marcas')}. En este navegador ya hay ${plural(hay, 'marca', 'marcas')}. ¿Qué hacemos?`
      : `Este link trae ${plural(llegan, 'marca', 'marcas')}. En este navegador todavía no hay ninguna.`;
    const [botonCombinar, botonReemplazar] = caja.querySelectorAll('[data-recibir-accion]');
    // Sin marcas previas combinar y reemplazar dan lo mismo: queda un solo botón.
    if (!hay) { botonCombinar.textContent = 'Guardar en este navegador'; botonReemplazar.hidden = true; caja.querySelector('[data-recibir-ayuda]').hidden = true; }
    caja.hidden = false;
    caja.focus();

    caja.addEventListener('click', e => {
      const accion = e.target.closest('[data-recibir-accion]')?.dataset.recibirAccion;
      if (!accion) return;
      if (accion === 'reemplazar' && !confirm(`Se van a reemplazar las ${plural(hay, 'marca', 'marcas')} de este navegador por las ${llegan} del link. Las de ahora quedan guardadas como respaldo. ¿Seguimos?`)) return;
      try {
        if (accion === 'combinar') estado.textContent = resultadoCombinar(Marcas.combinar(archivo), 'Marcas combinadas');
        if (accion === 'reemplazar') { const r = Marcas.reemplazar(archivo); estado.textContent = `Listo: ahora tenés las ${plural(r.total, 'marca', 'marcas')} del link.`; }
        if (accion === 'cancelar') estado.textContent = 'No se cambió nada.';
      } catch (error) {
        estado.textContent = error.message;
      }
      caja.hidden = true;
      limpiarLink();
      pintar();
    });
  }

  // ---------- Tema claro u oscuro ----------
  // Crema por defecto; el oscuro se elige con el botón y se recuerda en este navegador.
  function iniciarTema() {
    const boton = document.querySelector('[data-tema]');
    if (!boton) return;
    const pintar = () => {
      const oscuro = document.documentElement.dataset.theme === 'dark';
      boton.setAttribute('aria-pressed', String(oscuro));
      boton.textContent = oscuro ? 'Claro' : 'Oscuro';
      boton.setAttribute('aria-label', oscuro ? 'Pasar al tema claro' : 'Pasar al tema oscuro');
    };
    boton.addEventListener('click', () => {
      const oscuro = document.documentElement.dataset.theme !== 'dark';
      if (oscuro) document.documentElement.dataset.theme = 'dark'; else delete document.documentElement.dataset.theme;
      try { localStorage.setItem('banco-musica:tema', oscuro ? 'oscuro' : 'claro'); } catch (_) { /* sin almacenamiento: dura lo que la página */ }
      pintar();
    });
    pintar();
  }

  // ---------- Progreso: discos escuchados, músicos vistos y épocas completadas ----------
  const CAMINO = window.CAMINO || { corrientes: [], musicos: {} };
  const escuchado = (marcas, id) => !!marcas[`disco:${id}`]?.escuchado;
  // Un músico cuenta como visto si se lo marcó a él o si escuchaste algún disco suyo.
  function vistoMusico(marcas, id) {
    if (marcas[`musico:${id}`]?.escuchado) return 'marcado';
    return (CAMINO.musicos[id] || []).some(d => escuchado(marcas, d)) ? 'por-disco' : '';
  }
  function progresoDe(marcas, c) {
    const total = c.discos.length + c.musicos.length;
    const hechos = c.discos.filter(d => escuchado(marcas, d)).length + c.musicos.filter(m => vistoMusico(marcas, m)).length;
    const completa = !!marcas[`corriente:${c.id}`]?.completada;
    // La primera actividad en la época es lo que la ubica en el camino.
    const fechas = [
      ...c.discos.filter(d => escuchado(marcas, d)).map(d => marcas[`disco:${d}`].fechaEscuchado),
      ...c.musicos.filter(m => marcas[`musico:${m}`]?.escuchado).map(m => marcas[`musico:${m}`].fechaEscuchado),
      completa ? marcas[`corriente:${c.id}`].fechaCompletada : null,
    ].filter(Boolean).sort();
    return { total, hechos, completa, p: completa ? 100 : total ? Math.round((hechos / total) * 100) : 0, desde: fechas[0] || null };
  }
  const tintas = c => `--tinta-c:${c.tinta};--tinta-c-texto:${c.texto};--tinta-c-claro:${c.claro};--tinta-c-oscuro:${c.oscuro}`;
  const fecha = f => new Date(f).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
  const el = (etiqueta, props = {}, ...hijos) => { const e = Object.assign(document.createElement(etiqueta), props); e.append(...hijos); return e; };

  // Las casillas "Escuchado" y "Visto" que hay en cada lista.
  function pintarCasillas(marcas) {
    $$('[data-marcar]').forEach(input => {
      const [tipo, id] = input.dataset.marcar.split(':');
      const etiqueta = input.closest('.marcar');
      if (tipo === 'musico') {
        const v = vistoMusico(marcas, id);
        input.checked = !!v;
        etiqueta.classList.toggle('por-disco', v === 'por-disco');
      } else input.checked = !!marcas[input.dataset.marcar]?.escuchado;
    });
  }
  function iniciarCasillas() {
    document.addEventListener('change', e => {
      const input = e.target.closest('[data-marcar]');
      if (!input) return;
      const etiqueta = input.closest('.marcar');
      // Si estaba visto solo por un disco, destildarlo no borra el disco: se marca al músico explícitamente.
      const marcarExplicito = etiqueta.classList.contains('por-disco') ? true : input.checked;
      Marcas.guardar(input.dataset.marcar, { escuchado: marcarExplicito }, input.dataset.marcarTitulo);
      repintar();
    });
  }

  function pintarStickers(marcas) {
    $$('[data-progreso]').forEach(s => {
      const c = CAMINO.corrientes.find(x => x.id === s.dataset.progreso);
      if (!c) return;
      const pr = progresoDe(marcas, c);
      if (!pr.hechos && !pr.completa) { delete s.dataset.p; return; }
      s.dataset.p = pr.p;
      s.style.setProperty('--p', pr.p);
      s.classList.toggle('completa', pr.completa);
      s.title = pr.completa ? 'Época completada' : `${pr.hechos} de ${pr.total} marcados`;
    });
  }

  function iniciarCompletar() {
    $$('[data-completar]').forEach(boton => boton.addEventListener('click', () => {
      const actual = !!Marcas.leer().marcas[boton.dataset.completar]?.completada;
      Marcas.guardar(boton.dataset.completar, { completada: !actual }, boton.dataset.completarTitulo);
      repintar();
    }));
  }
  function pintarCompletar(marcas) {
    const botones = $$('[data-completar]');
    if (!botones.length) return;
    const m = marcas[botones[0].dataset.completar];
    const hecha = !!m?.completada;
    botones.forEach(b => b.setAttribute('aria-pressed', String(hecha)));
    $$('[data-completar-fecha]').forEach(f => { f.textContent = hecha ? `Estudiada el ${fecha(m.fechaCompletada)}` : ''; });
  }

  // ---------- Tu camino: la línea completa, de Orígenes a hoy ----------
  // Las 18 paradas ya están en la página, en gris. Acá se colorean: a medias si marcaste algo, llenas si la estudiaste.
  function pintarMetro(marcas) {
    const metro = document.querySelector('[data-metro]');
    if (!metro) return;
    const todas = CAMINO.corrientes.map(c => ({ c, pr: progresoDe(marcas, c) }));
    for (const { c, pr } of todas) {
      const li = metro.querySelector(`[data-parada="${c.id}"]`);
      if (!li) continue;
      const empezada = pr.completa || pr.hechos > 0;
      li.classList.toggle('sin-empezar', !empezada);
      li.classList.toggle('completa', pr.completa);
      li.style.setProperty('--p', pr.completa ? 100 : Math.max(pr.p, empezada ? 12 : 0));
      li.querySelector('[data-parada-cuenta]').textContent = `${pr.hechos} de ${pr.total}`;
      li.querySelector('[data-parada-fecha]').textContent = pr.completa ? ` · estudiada el ${fecha(marcas[`corriente:${c.id}`].fechaCompletada)}` : '';
    }

    // La sugerencia va debajo de la línea.
    const elegir = metro.querySelector('[data-metro-elegir]');
    const visitadas = todas.filter(x => x.pr.desde).sort((a, b) => a.pr.desde.localeCompare(b.pr.desde));
    const pendientes = todas.filter(x => !x.pr.completa).map(x => x.c);
    elegir.textContent = '';
    elegir.hidden = !pendientes.length;
    if (!pendientes.length) return;
    const sugerida = siguienteParada(visitadas, pendientes);
    if (sugerida) elegir.append(el('span', { className: 'dato', textContent: visitadas.length ? 'Próxima parada:' : 'Para empezar:' }), el('a', { className: 'boton boton-chico', href: raiz + sugerida.url, textContent: sugerida.nombre }));
    const select = el('select', { ariaLabel: 'Elegir otra época' }, el('option', { value: '', textContent: 'O elegí otra…' }), ...pendientes.filter(c => c !== sugerida).map(c => el('option', { value: raiz + c.url, textContent: `${c.nombre} (${c.desde})` })));
    select.addEventListener('change', () => { if (select.value) location.href = select.value; });
    elegir.append(select);
  }

  // Próxima parada: si la última época que tocaste ya está estudiada, la primera rama que sale de ella;
  // si todavía no, seguir con esa misma; y si no hay ramas, la primera época sin estudiar en orden.
  function siguienteParada(visitadas, pendientes) {
    if (!visitadas.length) return pendientes[0] || null;
    const ultima = visitadas[visitadas.length - 1];
    if (!ultima.pr.completa) return ultima.c;
    const rama = pendientes.find(c => c.deriva.includes(ultima.c.id) && !visitadas.some(v => v.c === c));
    return rama || pendientes.find(c => !visitadas.some(v => v.c === c)) || pendientes[0] || null;
  }

  function repintar() {
    const marcas = Marcas.leer().marcas;
    pintarCasillas(marcas);
    pintarStickers(marcas);
    pintarCompletar(marcas);
    pintarMetro(marcas);
    pintarChips();
  }

  // Las notas al pie: el numerito gris abre la línea plegada "Fuentes".
  function iniciarRefs() {
    document.addEventListener('click', e => {
      const a = e.target.closest('.refs a');
      if (!a) return;
      const plegado = document.getElementById('fuentes');
      if (plegado) plegado.open = true;
    });
  }

  iniciarTema();
  iniciarCasillas();
  iniciarCompletar();
  iniciarRefs();
  repintar();
  window.addEventListener('storage', e => { if (e.key === 'banco-musica:marcas') repintar(); });
  iniciarBuscador();
  iniciarFichaMarcas();
  pintarChips();
  iniciarFiltros();
  iniciarFiltrosMusicos();
  iniciarPanelMarcas();
  iniciarFiltrosEpisodios();
  iniciarFiltroAudiovisual();

  // ---------- Página "Audiovisual": filtro por tipo ----------
  function iniciarFiltroAudiovisual() {
    const form = document.querySelector('[data-filtros-av]');
    const lista = document.querySelector('[data-lista-av]');
    if (!form || !lista) return;
    const cuenta = form.querySelector('[data-cuenta-av]');
    const filas = $$('.av', lista);
    const aplicar = () => {
      const tipo = new FormData(form).get('tipo');
      let visibles = 0;
      for (const fila of filas) { fila.hidden = !!tipo && fila.dataset.tipo !== tipo; if (!fila.hidden) visibles++; }
      cuenta.textContent = `${visibles} ${visibles === 1 ? 'resultado' : 'resultados'}`;
    };
    form.addEventListener('change', aplicar);
    form.addEventListener('submit', e => e.preventDefault());
    aplicar();
  }
})();
