// Prueba la regla de sincronización (Marcas.sincronizar) con un navegador simulado, sin Supabase.
// Uso: npm run probar:sincronizar   (o con otra versión: node scripts/probar-sincronizar.mjs <ruta a marcas.js>)
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function cargar() {
  const almacen = new Map();
  const ctx = {
    localStorage: { getItem: k => (almacen.has(k) ? almacen.get(k) : null), setItem: (k, v) => almacen.set(k, String(v)), removeItem: k => almacen.delete(k), key: i => [...almacen.keys()][i] ?? null, get length() { return almacen.size; } },
    document: { dispatchEvent() {}, addEventListener() {} }, addEventListener() {}, setTimeout, console, Date, JSON, Event: class {},
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(readFileSync(process.argv[2] || 'sitio/marcas.js', 'utf8'), ctx);
  return { M: ctx.Marcas, almacen };
}
const marca = (fecha, puntaje) => ({ escuchado: true, fechaEscuchado: fecha, puntaje, fechaPuntaje: fecha, notas: [], titulo: 'x', completada: false, fechaCompletada: '1970-01-01T00:00:00.000Z', actualizado: fecha });
let fallas = 0;
const ok = (c, t) => { if (!c) fallas++; console.log(`${c ? 'OK   ' : 'FALLA'} ${t}`); };
const viejo = '2026-11-01T10:00:00.000Z', base = { desde: '2026-11-10T10:00:00.000Z', ids: ['disco:a', 'disco:b'] };
const local = { version: 2, marcas: { 'disco:a': marca(viejo, 4), 'disco:b': marca(viejo, 5) } };

{ // 1. La fila no existe y el navegador ya estaba sincronizado: antes se borraba todo.
  const { M, almacen } = cargar();
  almacen.set('banco-musica:marcas', JSON.stringify(local));
  const { datos } = M.sincronizar(null, base);
  ok(Object.keys(datos.marcas).length === 2, 'sin fila en la cuenta: se conservan las 2 marcas del navegador');
  ok(Object.keys(M.leer().marcas).length === 2, 'sin fila en la cuenta: el navegador no pierde nada');
}
{ // 2. La fila existe con las marcas vacías (se borraron en otro dispositivo): se sigue respetando el borrado.
  const { M, almacen } = cargar();
  almacen.set('banco-musica:marcas', JSON.stringify(local));
  const { datos } = M.sincronizar({ version: 2, marcas: {} }, base);
  ok(Object.keys(datos.marcas).length === 0, 'fila con marcas borradas en otro dispositivo: se borran también acá');
}
{ // 3. Un borrado normal de una sola marca sigue funcionando.
  const { M, almacen } = cargar();
  almacen.set('banco-musica:marcas', JSON.stringify(local));
  const { datos } = M.sincronizar({ version: 2, marcas: { 'disco:a': marca(viejo, 4) } }, base);
  ok(Object.keys(datos.marcas).join() === 'disco:a', 'una marca borrada en otro dispositivo se va de acá');
}
{ // 4. Primera vez de verdad: se combina todo.
  const { M, almacen } = cargar();
  almacen.set('banco-musica:marcas', JSON.stringify(local));
  const { datos } = M.sincronizar({ version: 2, marcas: { 'disco:c': marca(viejo, 3) } }, null);
  ok(Object.keys(datos.marcas).length === 3, 'primer ingreso: combina las del navegador y las de la cuenta');
}
console.log(fallas ? `${fallas} fallas` : 'Todo OK');
process.exitCode = fallas ? 1 : 0;
