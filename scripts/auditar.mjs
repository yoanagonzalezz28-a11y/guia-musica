// Informe de calidad: muestra qué tan sólido es el respaldo de cada ficha. No modifica nada.
import { cargarGenero, cargarFuentes, fuentesDe } from './datos.mjs';

const g = cargarGenero('jazz');
const fuentes = cargarFuentes();
const ANIO = new Date().getFullYear();
const ALTOS = new Set(['musico', 'guia-critica', 'especialista']);

const fichas = [...g.discos.map(x => ['disco', x]), ...g.musicos.map(x => ['músico', x])];
const conteo = { completa: 0, extracto: 0, indirecta: 0 };
const sinAlto = [], sinLeido = [];
for (const [tipo, x] of fichas) {
  const res = x.respaldo || [];
  res.forEach(r => { conteo[r.acceso]++; });
  if (!res.some(r => ALTOS.has(fuentes[r.fuente].nivel))) sinAlto.push(`${tipo} ${x.id}`);
  if (!res.some(r => r.acceso === 'completa')) sinLeido.push(`${tipo} ${x.id}`);
}

const conMusico = fichas.filter(([, x]) => (x.respaldo || []).some(r => fuentes[r.fuente].nivel === 'musico')).length;
console.log(`Fichas: ${g.discos.length} discos y ${g.musicos.length} músicos.`);
console.log(`Mínimo de dos fuentes: ${fichas.filter(([, x]) => fuentesDe(x).size >= 2).length} de ${fichas.length}.`);
console.log(`Con opinión de músicos: ${conMusico} de ${fichas.length}.`);
console.log(`Respaldos: ${conteo.completa} leídos, ${conteo.extracto} solo extracto, ${conteo.indirecta} citados por terceros.`);
console.log(`Redescubrimientos: ${g.discos.filter(x => x.redescubrimiento).map(x => x.id).join(', ')}.`);
console.log(`Spotify: ${g.discos.filter(x => x.spotify.estado === 'verificado').length} directos, ${g.discos.filter(x => x.spotify.estado === 'busqueda').length} por búsqueda.`);
console.log(`\nSin músico, guía crítica ni especialista (${sinAlto.length}):\n  ${sinAlto.join('\n  ') || 'ninguna'}`);
console.log(`\nSin ninguna fuente leída completa (${sinLeido.length}):\n  ${sinLeido.join('\n  ') || 'ninguna'}`);
console.log('\nEscena actual:');
for (const r of g.regiones) {
  for (const e of r.escenaActual) {
    const aviso = ANIO - e.ultimaActividad >= 2 ? '  <- revisar: dato con dos años o más' : '';
    console.log(`  ${r.nombre}: ${e.nombre}, ${e.ultimaActividad}${aviso}`);
  }
}
console.log('\nGioia: cotejo pendiente en todas las fichas.');
