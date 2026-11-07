// Servidor local para revisar dist/. Con --base /guia-musica/ simula la dirección de GitHub Pages.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { RAIZ } from './datos.mjs';

const arg = n => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : null; };
const base = arg('--base') || '/';
const puerto = Number(arg('--puerto')) || 4321;
const DIST = path.join(RAIZ, 'dist');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json' };

http.createServer((req, res) => {
  const ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (!ruta.startsWith(base)) { res.writeHead(404); return res.end('Fuera del sitio'); }
  let archivo = path.normalize(path.join(DIST, ruta.slice(base.length)));
  if (!archivo.startsWith(DIST)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(archivo) && fs.statSync(archivo).isDirectory()) archivo = path.join(archivo, 'index.html');
  if (!fs.existsSync(archivo)) { res.writeHead(404); return res.end('No encontrado'); }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(archivo)] || 'application/octet-stream' });
  fs.createReadStream(archivo).pipe(res);
}).listen(puerto, () => console.log(`Sitio en http://localhost:${puerto}${base}`));
