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
        const a = document.createElement('a');
        const [tipo, clave] = id.split(':');
        a.href = `${raiz}jazz/${{ disco: 'discos', musico: 'musicos', corriente: 'corrientes' }[tipo] || 'discos'}/${clave}/`;
        a.textContent = m.titulo || id;
        const datos = document.createElement('span');
        datos.className = 'marca-datos';
        const estado = tipo === 'corriente' ? (m.completada ? `Época completada el ${new Date(m.fechaCompletada).toLocaleDateString('es-AR')}` : 'Época') : tipo === 'musico' ? (m.escuchado ? 'Músico visto' : 'Músico') : (m.escuchado ? 'Escuchado' : 'Sin escuchar');
        datos.textContent = [estado, m.puntaje ? `${m.puntaje}/5` : ''].filter(Boolean).join(' · ');
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
    });

    document.querySelector('[data-importar]').addEventListener('change', async e => {
      const archivo = e.target.files[0];
      if (!archivo) return;
      try {
        const r = Marcas.importar(await archivo.text());
        const partes = [`${r.nuevas} nuevas`, `${r.actualizadas} combinadas`, `${r.sinCambios} sin cambios`];
        if (r.descartadas) partes.push(`${r.descartadas} descartadas por formato inválido`);
        estado.textContent = `Importación terminada: ${partes.join(', ')}.`;
        pintar();
      } catch (error) {
        estado.textContent = error.message;
      }
      e.target.value = '';
    });

    if (!Marcas.persistente()) estado.textContent = 'Este navegador no permite guardar datos: tus marcas se pierden al cerrar la página.';
    pintar();
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
    const boton = document.querySelector('[data-completar]');
    if (!boton) return;
    boton.addEventListener('click', () => {
      const actual = !!Marcas.leer().marcas[boton.dataset.completar]?.completada;
      Marcas.guardar(boton.dataset.completar, { completada: !actual }, boton.dataset.completarTitulo);
      repintar();
    });
  }
  function pintarCompletar(marcas) {
    const boton = document.querySelector('[data-completar]');
    if (!boton) return;
    const m = marcas[boton.dataset.completar];
    const hecha = !!m?.completada;
    boton.setAttribute('aria-pressed', String(hecha));
    boton.textContent = hecha ? 'Época completada' : 'Marcar época como completada';
    const f = document.querySelector('[data-completar-fecha]');
    if (f) f.textContent = hecha ? `La completaste el ${fecha(m.fechaCompletada)}. Tocá de nuevo para desmarcarla.` : '';
  }

  // ---------- Tu camino: la línea de metro ----------
  function pintarMetro(marcas) {
    const metro = document.querySelector('[data-metro]');
    if (!metro) return;
    const todas = CAMINO.corrientes.map(c => ({ c, pr: progresoDe(marcas, c) }));
    const paradas = todas.filter(x => x.pr.desde).sort((a, b) => a.pr.desde.localeCompare(b.pr.desde));
    const visitadas = new Set(paradas.map(x => x.c.id));
    const hijasDe = id => CAMINO.corrientes.filter(c => c.deriva.includes(id) && !visitadas.has(c.id));
    metro.textContent = '';

    const linea = el('ol', { className: 'metro-linea' });
    for (const { c, pr } of paradas) {
      const li = el('li', { className: `parada${pr.completa ? ' completa' : ''}` });
      li.style.cssText = `${tintas(c)};--p:${pr.p}`;
      const datos = pr.completa ? `Completada el ${fecha(marcas[`corriente:${c.id}`].fechaCompletada)}` : `Desde el ${fecha(pr.desde)} · ${pr.hechos} de ${pr.total} marcados`;
      const cuerpo = el('div', {}, el('a', { className: 'parada-nombre', href: raiz + c.url, textContent: c.nombre }), el('span', { className: 'parada-datos dato', textContent: datos }));
      // Donde el estilo se divide, el camino muestra las ramas que salen de una época completada.
      const ramas = pr.completa ? hijasDe(c.id) : [];
      if (ramas.length) {
        const ul = el('ul', { className: 'ramas', ariaLabel: `Ramas que salen de ${c.nombre}` });
        for (const h of ramas) {
          const r = el('li', { className: 'rama' }, el('span', { className: 'rama-punto' }), el('span', {}, el('a', { href: raiz + h.url, textContent: h.nombre }), el('span', { className: 'dato', textContent: ` ${h.desde}–${h.hasta}` })));
          r.style.cssText = tintas(h);
          ul.append(r);
        }
        cuerpo.append(ul);
      }
      li.append(el('span', { className: 'parada-punto', ariaHidden: 'true' }), cuerpo);
      linea.append(li);
    }

    const pendientes = todas.filter(x => !visitadas.has(x.c.id)).map(x => x.c);
    const sugerida = siguienteParada(paradas, pendientes, hijasDe);
    if (paradas.length) metro.append(linea);
    else metro.append(el('p', { className: 'metro-vacio', textContent: 'Todavía no hay paradas. Marcá un disco o un músico en cualquier época y aparece acá.' }));

    if (pendientes.length) {
      const elegir = el('div', { className: 'metro-elegir' });
      if (sugerida) elegir.append(el('span', { className: 'dato', textContent: paradas.length ? 'Próxima parada:' : 'Para empezar:' }), el('a', { className: 'boton boton-chico', href: raiz + sugerida.url, textContent: sugerida.nombre }));
      const select = el('select', { ariaLabel: 'Elegir otra época' }, el('option', { value: '', textContent: 'O elegí otra…' }), ...pendientes.map(c => el('option', { value: raiz + c.url, textContent: `${c.nombre} (${c.desde})` })));
      select.addEventListener('change', () => { if (select.value) location.href = select.value; });
      elegir.append(select);
      metro.append(elegir);
    }
  }

  // Próxima parada: la primera rama que sale de la última época visitada; si no hay, la siguiente por año de inicio.
  function siguienteParada(paradas, pendientes, hijasDe) {
    if (!paradas.length) return pendientes[0] || null;
    const ultima = paradas[paradas.length - 1];
    return hijasDe(ultima.c.id)[0] || pendientes[0] || null;
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
})();
