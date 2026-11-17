// Prueba la tabla de marcas contra el Supabase real, con un usuario de prueba creado en el panel
// (Authentication → Users → Add user, con contraseña y "Auto Confirm User").
// Uso: npm run probar:cuenta   (lee SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_PRUEBA_EMAIL y SUPABASE_PRUEBA_CLAVE de .env)
// Deja la tabla como estaba: al final borra la fila del usuario de prueba.
const URLB = (process.env.SUPABASE_URL || '').replace(/\/(rest|auth)\/v1\/?$/, '').replace(/\/+$/, '');
const CLAVE = process.env.SUPABASE_ANON_KEY;
const { SUPABASE_PRUEBA_EMAIL: EMAIL, SUPABASE_PRUEBA_CLAVE: PASS } = process.env;

let fallas = 0;
const ok = (c, t, extra = '') => { if (!c) fallas++; console.log(`${c ? 'OK   ' : 'FALLA'} ${t}${extra ? ` (${extra})` : ''}`); };
const pedir = async (ruta, { metodo = 'GET', token, cuerpo, prefer } = {}) => {
  const r = await fetch(URLB + ruta, {
    method: metodo,
    headers: { apikey: CLAVE, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(prefer ? { Prefer: prefer } : {}) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const texto = await r.text();
  let json = null; try { json = JSON.parse(texto); } catch (_) { /* vacío */ }
  return { status: r.status, json, texto: texto.slice(0, 160) };
};
const datos = n => ({ version: 2, marcas: { 'disco:kind-of-blue': { escuchado: true, fechaEscuchado: new Date().toISOString(), puntaje: n, fechaPuntaje: new Date().toISOString(), notas: [], titulo: 'Kind of Blue', completada: false, fechaCompletada: '1970-01-01T00:00:00.000Z', actualizado: new Date().toISOString() } } });

async function principal() {
  if (!URLB || !CLAVE) { console.error('Faltan SUPABASE_URL o SUPABASE_ANON_KEY en .env.'); return 1; }
  // 1. Sin sesión: la tabla existe pero no se puede leer.
  const anon = await pedir('/rest/v1/marcas?select=user_id');
  if (anon.json?.code === 'PGRST205') { ok(false, 'la tabla existe', 'Supabase no la encuentra: falta correr supabase/marcas.sql'); return 1; }
  ok(anon.status === 401 || anon.status === 403 || (anon.status === 200 && Array.isArray(anon.json) && !anon.json.length), 'sin sesión no se ve ninguna fila', `${anon.status} ${anon.json?.code || ''}`);

  if (!EMAIL || !PASS) { console.log('\nPara seguir hace falta un usuario de prueba: SUPABASE_PRUEBA_EMAIL y SUPABASE_PRUEBA_CLAVE en .env.'); return fallas ? 1 : 0; }

  // 2. Entrar con el usuario de prueba.
  const ses = await pedir('/auth/v1/token?grant_type=password', { metodo: 'POST', cuerpo: { email: EMAIL, password: PASS } });
  ok(ses.status === 200 && ses.json?.access_token, 'entra el usuario de prueba', ses.status !== 200 ? ses.texto : '');
  if (!ses.json?.access_token) return 1;
  const token = ses.json.access_token, uid = ses.json.user.id;

  // 3. Leer, crear, cambiar y volver a leer su propia fila (lo mismo que hace el sitio).
  const vacia = await pedir(`/rest/v1/marcas?select=datos&user_id=eq.${uid}`, { token });
  ok(vacia.status === 200, 'puede leer su fila', `${vacia.status} ${vacia.json?.code || ''}`);
  const crear = await pedir('/rest/v1/marcas?on_conflict=user_id', { metodo: 'POST', token, cuerpo: { user_id: uid, datos: datos(4) }, prefer: 'resolution=merge-duplicates,return=minimal' });
  ok(crear.status === 201 || crear.status === 200, 'puede guardar su fila', `${crear.status} ${crear.json?.code || ''} ${crear.json?.message || ''}`);
  const cambiar = await pedir('/rest/v1/marcas?on_conflict=user_id', { metodo: 'POST', token, cuerpo: { user_id: uid, datos: datos(5) }, prefer: 'resolution=merge-duplicates,return=minimal' });
  ok(cambiar.status === 201 || cambiar.status === 200, 'puede actualizarla (la misma operación que usa el sitio)', `${cambiar.status} ${cambiar.json?.code || ''}`);
  const leida = await pedir(`/rest/v1/marcas?select=datos,actualizado&user_id=eq.${uid}`, { token });
  ok(leida.json?.[0]?.datos?.marcas?.['disco:kind-of-blue']?.puntaje === 5, 'lee lo que guardó', leida.texto);

  // 4. Las reglas: no puede escribir la fila de otro, ni ver otras, ni guardar algo con otro formato.
  const otro = await pedir('/rest/v1/marcas', { metodo: 'POST', token, cuerpo: { user_id: '00000000-0000-0000-0000-000000000000', datos: datos(1) }, prefer: 'return=minimal' });
  ok(otro.status === 401 || otro.status === 403, 'no puede escribir la fila de otra persona', `${otro.status} ${otro.json?.code || ''}`);
  const todas = await pedir('/rest/v1/marcas?select=user_id', { token });
  ok(Array.isArray(todas.json) && todas.json.every(f => f.user_id === uid), 'solo ve su propia fila', `${todas.json?.length} filas`);
  const malFormato = await pedir('/rest/v1/marcas?on_conflict=user_id', { metodo: 'POST', token, cuerpo: { user_id: uid, datos: { cualquier: 'cosa' } }, prefer: 'resolution=merge-duplicates,return=minimal' });
  ok(malFormato.status === 400 && malFormato.json?.code === '23514', 'rechaza datos con otro formato', `${malFormato.status} ${malFormato.json?.code || ''}`);

  // 5. Borrar su fila (deja todo como estaba).
  const borrar = await pedir(`/rest/v1/marcas?user_id=eq.${uid}`, { metodo: 'DELETE', token });
  ok(borrar.status === 204, 'puede borrar su fila', `${borrar.status}`);
  const despues = await pedir(`/rest/v1/marcas?select=user_id&user_id=eq.${uid}`, { token });
  ok(Array.isArray(despues.json) && !despues.json.length, 'la fila quedó borrada');

  console.log(fallas ? `\n${fallas} fallas` : '\nTodo OK: la tabla y sus reglas funcionan con una sesión real.');
  return fallas ? 1 : 0;
}

process.exitCode = await principal();
