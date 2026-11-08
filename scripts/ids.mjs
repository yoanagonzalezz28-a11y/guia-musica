// Ids estables: las marcas de cada persona se guardan con el id de la ficha ("disco:moanin").
// Si un id publicado desaparece sin decir adónde fue, esas marcas quedan huérfanas y el link se rompe.
//
// datos/ids-publicados.json  todos los ids de épocas, músicos y discos que alguna vez se publicaron.
//                            La construcción suma los nuevos sola; nunca borra.
// datos/renombres.json       qué pasó con cada id que ya no existe: el id nuevo, o null si la ficha salió del banco.
//                            El navegador lo usa para mover las marcas viejas al id nuevo.
import fs from 'node:fs';
import path from 'node:path';
import { RAIZ } from './datos.mjs';

const PUBLICADOS = path.join(RAIZ, 'datos', 'ids-publicados.json');
const RENOMBRES = path.join(RAIZ, 'datos', 'renombres.json');
const leer = (f, vacio) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : vacio);

export const idsConMarcas = g => [
  ...g.corrientes.map(c => `corriente:${c.id}`),
  ...g.musicos.map(m => `musico:${m.id}`),
  ...g.discos.map(d => `disco:${d.id}`),
];

// Sigue la cadena a → b → c hasta un id vigente (o null si la ficha se retiró).
export function destinoFinal(renombres, id) {
  const vistos = new Set();
  let actual = id;
  while (actual in renombres) {
    if (vistos.has(actual)) return undefined; // ciclo
    vistos.add(actual);
    actual = renombres[actual];
    if (actual === null) return null;
  }
  return actual;
}

export function revisarIds(g) {
  const { renombres = {} } = leer(RENOMBRES, {});
  const publicados = leer(PUBLICADOS, []);
  const vigentes = new Set(idsConMarcas(g));
  const errores = [];

  for (const [viejo, nuevo] of Object.entries(renombres)) {
    if (vigentes.has(viejo)) errores.push(`renombres: "${viejo}" todavía existe; si se renombró, falta borrar la ficha vieja`);
    const fin = destinoFinal(renombres, viejo);
    if (fin === undefined) errores.push(`renombres: "${viejo}" entra en un ciclo`);
    else if (fin !== null && !vigentes.has(fin)) errores.push(`renombres: "${viejo}" apunta a "${nuevo}", que no existe`);
    else if (fin !== null && viejo.split(':')[0] !== fin.split(':')[0]) errores.push(`renombres: "${viejo}" y "${fin}" son de tipos distintos`);
  }
  for (const id of publicados) {
    if (!vigentes.has(id) && !(id in renombres)) {
      errores.push(`"${id}" ya se publicó y no existe más. Agregalo a datos/renombres.json con su id nuevo, o con null si la ficha salió del banco, para que no se pierdan las marcas`);
    }
  }

  // Los ids nuevos quedan registrados desde la primera construcción.
  const nuevos = [...vigentes].filter(id => !publicados.includes(id));
  const guardar = () => {
    if (nuevos.length) fs.writeFileSync(PUBLICADOS, `${JSON.stringify([...publicados, ...nuevos].sort(), null, 1)}\n`);
  };

  const resueltos = Object.fromEntries(Object.keys(renombres).map(id => [id, destinoFinal(renombres, id) ?? null]));
  return { errores, renombres: resueltos, nuevos, guardar };
}
