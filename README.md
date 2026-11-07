# Banco de música

Banco de aprendizaje de géneros musicales. Es un sitio estático con fichas conectadas de corrientes, músicos, discos y regiones.

Requiere Node 20 o superior. No tiene dependencias que instalar.

```
npm run servir        # construye y abre en http://localhost:4321/
npm run servir:pages  # igual, pero bajo /guia-musica/, como en GitHub Pages
npm run construir     # valida los datos y genera dist/
npm run verificar     # compara los discos con MusicBrainz, Discogs y Spotify
npm run auditar       # informa qué tan sólido es el respaldo de cada ficha
```

- `datos/`: las fichas en JSON. El formato está en [docs/modelo-de-datos.md](docs/modelo-de-datos.md) y las reglas, en [docs/criterios-editoriales.md](docs/criterios-editoriales.md).
- `scripts/`: carga, validación, generación del sitio y verificación.
- `sitio/`: estilos y JavaScript que usa el navegador.
- `previo/`: la versión anterior, solo en tu computadora. Git la ignora.
- `dist/`: el sitio generado. No se edita a mano.

Cada push a `main` publica el sitio en GitHub Pages.
