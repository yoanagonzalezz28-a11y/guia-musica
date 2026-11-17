// Cuenta con Google (Supabase), opcional. Sin cuenta, el sitio funciona igual que siempre, con las marcas
// solo en este navegador. Con cuenta, las marcas se guardan también en una fila de la tabla "marcas" (una por
// persona, con el mismo formato que "Exportar") y se sincronizan al abrir una página, al volver a la pestaña
// y unos segundos después de cada cambio. La regla para combinar está en Marcas.sincronizar (marcas.js).
// Sin librerías: el ingreso usa el flujo PKCE de Supabase Auth y los datos van por su API REST.
(function () {
  const C = window.CUENTA;
  if (!C || !window.Marcas || !window.fetch || !window.crypto?.subtle) return;
  const BASE = C.url.replace(/\/(rest|auth)\/v1\/?$/, '').replace(/\/+$/, '');
  const SESION = 'banco-musica:sesion', SYNC = 'banco-musica:sync', VOLVER = 'banco-musica:volver', VERIFICADOR = 'banco-musica:pkce';
  const ls = {
    get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch (_) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { /* sin espacio */ } },
    del: k => { try { localStorage.removeItem(k); } catch (_) { /* nada */ } },
  };
  const raizAbsoluta = new URL(document.documentElement.dataset.raiz || './', location.href).href;
  const json = { apikey: C.clave, 'Content-Type': 'application/json' };

  // ---------- Entrar y salir ----------
  const base64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  async function entrar() {
    const verificador = base64url(crypto.getRandomValues(new Uint8Array(48)));
    ls.set(VERIFICADOR, verificador);
    ls.set(VOLVER, location.href);
    const desafio = base64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verificador)));
    // Siempre vuelve a la portada (es la dirección autorizada en Supabase); desde ahí se regresa a esta página.
    location.href = `${BASE}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(raizAbsoluta)}&code_challenge=${desafio}&code_challenge_method=s256`;
  }
  const guardarSesion = j => ls.set(SESION, {
    access_token: j.access_token, refresh_token: j.refresh_token, expira: Date.now() + (j.expires_in || 3600) * 1000,
    usuario: { id: j.user.id, email: j.user.email, nombre: j.user.user_metadata?.full_name || '' },
  });
  async function canjear(codigo) {
    const r = await fetch(`${BASE}/auth/v1/token?grant_type=pkce`, { method: 'POST', headers: json, body: JSON.stringify({ auth_code: codigo, code_verifier: ls.get(VERIFICADOR) }) });
    ls.del(VERIFICADOR);
    if (!r.ok) throw new Error('No se pudo completar el ingreso.');
    guardarSesion(await r.json());
  }
  // Devuelve una sesión vigente (la renueva si está por vencer) o null si no hay.
  async function sesion() {
    const s = ls.get(SESION);
    if (!s) return null;
    if (Date.now() < s.expira - 60000) return s;
    const r = await fetch(`${BASE}/auth/v1/token?grant_type=refresh_token`, { method: 'POST', headers: json, body: JSON.stringify({ refresh_token: s.refresh_token }) });
    if (r.status === 400 || r.status === 401) { ls.del(SESION); return null; }
    if (!r.ok) throw await fallo(r, 'al renovar la sesión');
    guardarSesion(await r.json());
    return ls.get(SESION);
  }
  async function salir() {
    const s = ls.get(SESION);
    if (s) fetch(`${BASE}/auth/v1/logout`, { method: 'POST', headers: { ...json, Authorization: `Bearer ${s.access_token}` } }).catch(() => {});
    ls.del(SESION); ls.del(SYNC);
    estado = 'fuera';
    pintar();
  }

  // ---------- Sincronizar ----------
  let estado = ls.get(SESION) ? 'pendiente' : 'fuera', ultima = null, ocupado = false, otraVez = false, espera = null, motivo = '';
  // El motivo técnico de un error de Supabase, en pocas palabras, para mostrarlo en letra chica.
  const MOTIVOS = {
    PGRST205: 'tabla no encontrada', PGRST106: 'esquema no expuesto', '42501': 'permiso denegado', '42P01': 'tabla no encontrada',
    PGRST301: 'sesión inválida', PGRST303: 'sesión vencida', '23514': 'datos con formato inválido', '23503': 'usuario inexistente',
  };
  async function fallo(r, paso) {
    let j = {}; try { j = await r.json(); } catch (_) { /* sin cuerpo */ }
    const que = MOTIVOS[j.code] || (r.status === 401 ? 'sin autorización' : r.status === 403 ? 'permiso denegado' : r.status === 404 ? 'no encontrado' : 'error del servidor');
    const e = new Error(`${paso}: ${que} (${[r.status, j.code].filter(Boolean).join(', ')})`);
    e.tecnico = true;
    return e;
  }
  async function sincronizar() {
    if (ocupado) { otraVez = true; return; }
    ocupado = true;
    try {
      const s = await sesion();
      if (!s) { estado = 'fuera'; return; }
      const h = { ...json, Authorization: `Bearer ${s.access_token}` };
      const r = await fetch(`${BASE}/rest/v1/marcas?select=datos&user_id=eq.${s.usuario.id}`, { headers: h });
      if (!r.ok) throw await fallo(r, 'al leer');
      const remota = (await r.json())[0]?.datos || null;
      const guardada = ls.get(SYNC);
      const base = guardada && guardada.usuario === s.usuario.id ? guardada : null;
      const inicio = new Date().toISOString();
      const { datos } = Marcas.sincronizar(remota, base);
      if (JSON.stringify(datos.marcas) !== JSON.stringify(remota?.marcas || null)) {
        const w = await fetch(`${BASE}/rest/v1/marcas?on_conflict=user_id`, {
          method: 'POST', headers: { ...h, Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify({ user_id: s.usuario.id, datos }),
        });
        if (!w.ok) throw await fallo(w, 'al guardar');
      }
      ls.set(SYNC, { usuario: s.usuario.id, desde: inicio, ids: Object.keys(datos.marcas) });
      estado = 'ok'; ultima = new Date(); motivo = '';
    } catch (e) {
      estado = navigator.onLine === false ? 'sin-conexion' : 'error';
      motivo = e.tecnico ? e.message : `sin respuesta de Supabase (${e.message || e.name})`;
    } finally {
      ocupado = false;
      pintar();
      if (otraVez) { otraVez = false; setTimeout(sincronizar, 300); }
    }
  }
  const pronto = () => { if (!ls.get(SESION)) return; clearTimeout(espera); espera = setTimeout(sincronizar, 2500); };

  // ---------- Sección "Tu cuenta" (Mis marcas) ----------
  const caja = document.querySelector('[data-cuenta-panel]');
  function pintar() {
    if (!caja) return;
    const s = ls.get(SESION);
    caja.querySelector('[data-cuenta-fuera]').hidden = !!s;
    caja.querySelector('[data-cuenta-dentro]').hidden = !s;
    if (!s) return;
    caja.querySelector('[data-cuenta-quien]').textContent = s.usuario.email;
    const hora = ultima ? ultima.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '';
    caja.querySelector('[data-cuenta-estado]').textContent = {
      ok: `Sincronizado a las ${hora}.`,
      pendiente: 'Sincronizando…',
      'sin-conexion': 'Sin conexión: tus marcas siguen guardadas en este navegador y se sincronizan cuando vuelva.',
      error: 'No se pudo sincronizar. Tus marcas siguen guardadas en este navegador; se vuelve a intentar solo.',
    }[estado] || '';
    // En letra chica, el motivo técnico del último error (para saber qué pasó).
    caja.querySelector('[data-cuenta-motivo]').textContent = ['error', 'sin-conexion'].includes(estado) && motivo ? `Motivo: ${motivo}` : '';
  }
  if (caja) {
    caja.querySelector('[data-cuenta-entrar]').addEventListener('click', () => { entrar().catch(() => { caja.querySelector('[data-cuenta-aviso]').textContent = 'No se pudo abrir el ingreso con Google.'; }); });
    caja.querySelector('[data-cuenta-sincronizar]').addEventListener('click', () => { estado = 'pendiente'; pintar(); sincronizar(); });
    caja.querySelector('[data-cuenta-salir]').addEventListener('click', salir);
    caja.hidden = false;
    pintar();
  }

  // ---------- Arranque ----------
  async function arrancar() {
    const url = new URL(location.href);
    const codigo = url.searchParams.get('code');
    if (url.searchParams.has('error') || (codigo && ls.get(VERIFICADOR))) {
      const volver = ls.get(VOLVER);
      ls.del(VOLVER);
      url.searchParams.delete('code'); url.searchParams.delete('error'); url.searchParams.delete('error_code'); url.searchParams.delete('error_description');
      history.replaceState(null, '', url.pathname + url.search + url.hash);
      if (codigo) {
        try { await canjear(codigo); } catch (_) { ls.set('banco-musica:aviso-cuenta', 'No se pudo completar el ingreso con Google. Probá de nuevo.'); }
      }
      if (volver && volver !== location.href) { location.replace(volver); return; }
    }
    const aviso = ls.get('banco-musica:aviso-cuenta');
    if (aviso && caja) { caja.querySelector('[data-cuenta-aviso]').textContent = aviso; ls.del('banco-musica:aviso-cuenta'); }
    if (ls.get(SESION)) { estado = 'pendiente'; pintar(); sincronizar(); }
  }
  document.addEventListener('marcas-cambiaron', pronto);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && (!ultima || Date.now() - ultima > 30000)) pronto(); });
  window.addEventListener('online', pronto);
  arrancar();
  window.Cuenta = { sincronizar, salir };
})();
