// Tu perfil de escucha (página Mis marcas): un resumen de lo que escuchaste y te gustó, calculado con tus marcas,
// acá en el navegador. Nada sale de este dispositivo. Aparece recién con MINIMO discos puntuados.
(function () {
  const caja = document.querySelector('[data-perfil-cuerpo]');
  if (!caja || !window.Marcas) return;
  const raiz = document.documentElement.dataset.raiz || '';
  const MINIMO = 5;
  let datos = null;

  // Cada disco con su id, su dirección y sus listas completas (en el archivo se omiten las vacías).
  const disco = id => { const d = datos.discos[id]; return { ...d, id, u: `jazz/discos/${id}/`, c: d.c || [], r: d.r || [], i: d.i || [], l: d.l || [] }; };
  const el = (tag, props = {}, ...hijos) => { const e = Object.assign(document.createElement(tag), props); e.append(...hijos); return e; };
  const enlace = (texto, url) => el('a', { href: raiz + url, textContent: texto });

  // Cómo nombrar cada época dentro de una frase ("el hard bop", "la fusión").
  const ARTICULO = { fusion: 'la fusión', origenes: 'los orígenes del jazz', ecm: 'el jazz europeo de ECM', cool: 'el cool jazz' };
  const enFrase = (id, nombre) => ARTICULO[id] || `el ${nombre.toLowerCase()}`;
  // "mucho piano", "mucha guitarra", "mucha voz": alcanza con la primera palabra.
  const mucho = inst => { const p = inst.split(' ')[0]; return `${/a$/.test(p) || p === 'voz' ? 'mucha' : 'mucho'} ${inst}`; };
  const unir = xs => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`);

  // Cuánto suma cada disco al gusto: 5 estrellas +2, 4 → +1, 3 → 0, 2 → −1, 1 → −2; escuchado sin puntaje, +0,25.
  const peso = m => (m.puntaje ? m.puntaje - 3 : 0.25);

  function calcular(marcas) {
    const mios = Object.entries(marcas)
      .filter(([k, m]) => k.startsWith('disco:') && (m.escuchado || m.puntaje) && datos.discos[k.slice(6)])
      .map(([k, m]) => ({ id: k.slice(6), d: disco(k.slice(6)), p: m.puntaje || null, w: peso(m) }));
    const puntuados = mios.filter(x => x.p);
    if (puntuados.length < MINIMO) return { falta: MINIMO - puntuados.length };

    // Por época, región, instrumento y músico: cuántos discos escuchaste, promedio de estrellas y gusto acumulado.
    const tabla = clave => {
      const t = new Map();
      for (const x of mios) for (const v of clave(x.d)) {
        const f = t.get(v) || { id: v, n: 0, suma: 0, cant: 0, gusto: 0, mejor: null };
        f.n++; f.gusto += x.w;
        if (x.p) { f.suma += x.p; f.cant++; if (!f.mejor || x.p > f.mejor.p) f.mejor = x; }
        t.set(v, f);
      }
      return [...t.values()].map(f => ({ ...f, prom: f.cant ? f.suma / f.cant : 0 }));
    };
    const porGusto = (a, b) => b.gusto - a.gusto || b.prom - a.prom || b.n - a.n;
    const epocas = tabla(d => d.c), regiones = tabla(d => d.r), instrumentos = tabla(d => d.i), musicos = tabla(d => d.l);

    const cinco = puntuados.filter(x => x.p === 5).sort((a, b) => a.d.a - b.d.a);
    const favoritos = musicos.filter(f => f.prom >= 4 && f.gusto >= 1).sort(porGusto).slice(0, 6);
    const masEscuchadas = xs => [...xs].sort((a, b) => b.n - a.n || b.prom - a.prom).slice(0, 3);
    const mejorPuntuadas = xs => xs.filter(f => f.cant >= 2).sort((a, b) => b.prom - a.prom || b.cant - a.cant).slice(0, 3);
    const gustos = xs => xs.filter(f => f.gusto > 0).sort(porGusto);

    // Frase de devolución, con las dos épocas y el instrumento que más te gustaron.
    const ep = gustos(epocas).slice(0, 2), inst = gustos(instrumentos)[0];
    const reg = gustos(regiones).find(f => f.id !== 'estados-unidos' && f.gusto >= 1.5);
    let frase = ep.length
      ? `Lo que más te gusta es ${unir(ep.map(f => enFrase(f.id, datos.corrientes[f.id].n)))}${inst ? `, con ${mucho(inst.id)}` : ''}.`
      : 'Todavía no hay una época que se destaque: tus puntajes están muy repartidos.';
    if (reg) frase += ` Fuera de Estados Unidos, lo que más te gustó viene de ${datos.regiones[reg.id].n}.`;

    // Recomendaciones: discos sin escuchar de tus músicos, épocas y regiones preferidos, con el motivo.
    const vistos = new Set(mios.map(x => x.id));
    const fav = new Map(gustos(musicos).map(f => [f.id, f]));
    const epG = new Map(gustos(epocas).slice(0, 4).map(f => [f.id, f]));
    const regG = new Map(gustos(regiones).slice(0, 3).map(f => [f.id, f]));
    const candidatos = [];
    for (const id of Object.keys(datos.discos)) {
      if (vistos.has(id) || marcas[`disco:${id}`]) continue;
      const d = disco(id);
      const motivos = [];
      for (const l of d.l) { const f = fav.get(l); if (f?.mejor && f.mejor.p >= 4) motivos.push({ s: 3 + f.gusto, de: f.mejor, por: 'musico', l }); }
      for (const c of d.c) { const f = epG.get(c); if (f?.mejor && f.mejor.p >= 4) motivos.push({ s: 1 + f.gusto / 2, de: f.mejor, por: 'epoca', c }); }
      for (const r of d.r) { const f = regG.get(r); if (f?.mejor && f.mejor.p >= 4) motivos.push({ s: 0.8 + f.gusto / 3, de: f.mejor, por: 'region', r }); }
      if (!motivos.length) continue;
      motivos.sort((a, b) => b.s - a.s);
      candidatos.push({ id, d, s: motivos.reduce((t, m) => t + m.s, 0) + (d.e ? 1.5 : 0), motivo: motivos[0] });
    }
    candidatos.sort((a, b) => b.s - a.s || a.d.a - b.d.a);
    // Variedad: como mucho dos discos por músico y por motivo.
    const recomendaciones = [], cuenta = new Map();
    for (const x of candidatos) {
      const claves = [...x.d.l.map(l => `l:${l}`), `m:${x.motivo.de.id}`];
      if (claves.some(k => (cuenta.get(k) || 0) >= 2)) continue;
      claves.forEach(k => cuenta.set(k, (cuenta.get(k) || 0) + 1));
      recomendaciones.push(x);
      if (recomendaciones.length === 6) break;
    }

    return { total: mios.length, puntuados: puntuados.length, cinco, favoritos, frase, recomendaciones,
      epocas: { mas: masEscuchadas(epocas), mejor: mejorPuntuadas(epocas) },
      regiones: { mas: masEscuchadas(regiones), mejor: mejorPuntuadas(regiones) },
      instrumentos: { mas: masEscuchadas(instrumentos), mejor: mejorPuntuadas(instrumentos) } };
  }

  // ---------- Pintar ----------
  const nombreDe = { epocas: id => [datos.corrientes[id].n, datos.corrientes[id].u], regiones: id => [datos.regiones[id].n, datos.regiones[id].u], instrumentos: id => [id.charAt(0).toUpperCase() + id.slice(1), null] };
  const motivoTexto = m => `porque te gustó ${m.de.d.t}${m.por === 'musico' ? '' : m.por === 'epoca' ? `, de la misma época` : `, de la misma región`}`;

  function pintar() {
    const p = calcular(Marcas.leer().marcas);
    caja.textContent = '';
    if (p.falta) {
      const hechos = MINIMO - p.falta;
      caja.append(
        el('p', { textContent: `Puntuá ${p.falta} ${p.falta === 1 ? 'disco más' : 'discos más'} con estrellas y acá vas a ver qué épocas, regiones, instrumentos y músicos te gustan más, con discos para seguir.` }),
        el('div', { className: 'perfil-avance', role: 'img', ariaLabel: `${hechos} de ${MINIMO} discos puntuados` }, ...Array.from({ length: MINIMO }, (_, i) => el('span', { className: i < hechos ? 'hecho' : '' }))),
        el('p', { className: 'ayuda' }, 'Para puntuar, entrá a cualquier disco y tocá las estrellas. Podés empezar por ', enlace('la lista de discos', 'jazz/discos/'), '.'));
      return;
    }
    caja.append(el('p', { className: 'perfil-frase', textContent: p.frase }),
      el('p', { className: 'ayuda', textContent: `Sobre ${p.total} discos marcados, ${p.puntuados} con estrellas. Se calcula acá, en este navegador.` }));

    if (p.cinco.length) caja.append(el('h3', { textContent: 'Tus discos de 5 estrellas' }),
      el('ul', { className: 'perfil-lista' }, ...p.cinco.map(x => el('li', {}, enlace(x.d.t, x.d.u), el('span', { className: 'dato', textContent: ` ${x.d.n} · ${x.d.a}` })))));
    if (p.favoritos.length) caja.append(el('h3', { textContent: 'Tus músicos favoritos' }),
      el('ul', { className: 'perfil-chips' }, ...p.favoritos.map(f => el('li', {}, enlace(datos.musicos[f.id], `jazz/musicos/${f.id}/`), el('span', { className: 'dato', textContent: ` ${f.cant} ${f.cant === 1 ? 'disco' : 'discos'} · ${f.prom.toFixed(1).replace('.', ',')} ★` })))));

    const grilla = el('div', { className: 'perfil-grilla' });
    for (const [clave, titulo] of [['epocas', 'Épocas'], ['regiones', 'Regiones'], ['instrumentos', 'Instrumentos']]) {
      const fila = f => { const [n, u] = nombreDe[clave](f.id); return el('li', {}, u ? enlace(n, u) : n, el('span', { className: 'dato', textContent: ` ${f.n} ${f.n === 1 ? 'disco' : 'discos'}${f.cant ? ` · ${f.prom.toFixed(1).replace('.', ',')} ★` : ''}` })); };
      const bloque = el('section', {}, el('h3', { textContent: titulo }), el('span', { className: 'rotulo', textContent: 'Lo que más escuchaste' }), el('ol', {}, ...p[clave].mas.map(fila)));
      if (p[clave].mejor.length) bloque.append(el('span', { className: 'rotulo', textContent: 'Lo que mejor puntuaste' }), el('ol', {}, ...p[clave].mejor.map(fila)));
      grilla.append(bloque);
    }
    caja.append(grilla);

    if (p.recomendaciones.length) caja.append(el('h3', { textContent: 'Para escuchar después' }),
      el('ul', { className: 'perfil-lista perfil-recomendaciones' }, ...p.recomendaciones.map(x => el('li', {}, enlace(x.d.t, x.d.u), el('span', { className: 'dato', textContent: ` ${x.d.n} · ${x.d.a}` }), el('span', { className: 'perfil-motivo', textContent: motivoTexto(x.motivo) })))));
  }

  fetch(`${raiz}recursos/perfil.json`).then(r => r.json()).then(j => { datos = j; pintar(); })
    .catch(() => { caja.textContent = 'No se pudo cargar el perfil. Probá recargar la página.'; });
  window.addEventListener('storage', e => { if (datos && e.key === 'banco-musica:marcas') pintar(); });
  document.addEventListener('marcas-cambiaron', () => { if (datos) pintar(); });
  document.addEventListener('marcas-sincronizadas', () => { if (datos) pintar(); });
})();
