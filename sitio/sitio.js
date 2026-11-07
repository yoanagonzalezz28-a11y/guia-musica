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
      const escuchados = entradas.filter(([, m]) => m.escuchado).length;
      resumen.textContent = entradas.length ? `${entradas.length} ${entradas.length === 1 ? 'disco marcado' : 'discos marcados'}, ${escuchados} ${escuchados === 1 ? 'escuchado' : 'escuchados'}` : 'Tus discos marcados';
      for (const [id, m] of entradas) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `${raiz}jazz/discos/${id.split(':')[1]}/`;
        a.textContent = m.titulo || id;
        const datos = document.createElement('span');
        datos.className = 'marca-datos';
        datos.textContent = [m.escuchado ? 'Escuchado' : 'Sin escuchar', m.puntaje ? `${m.puntaje}/5` : ''].filter(Boolean).join(' · ');
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

  iniciarBuscador();
  iniciarFichaMarcas();
  pintarChips();
  iniciarFiltros();
  iniciarPanelMarcas();
  iniciarFiltrosEpisodios();
})();
