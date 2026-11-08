# Estado del proyecto

Actualizado el 8 de noviembre de 2026. Sitio publicado: <https://yoanagonzalezz28-a11y.github.io/guia-musica/> (cada push a `main` publica).

## Para mañana: terminar la búsqueda de Spotify

La API de Spotify limitó las consultas el 8/11 a las 12:09 y pidió esperar unas 23 horas y media. Quedaron buscados 325 de los 779 discos que no tenían link exacto; faltan 454.

**Después del 9/11/2026 a las 11:58**, desde la carpeta del proyecto:

```
npm run spotify
```

- Retoma solo desde donde quedó: el avance está en `datos/spotify-busqueda.json`.
- Si Spotify vuelve a limitar por más de dos minutos, guarda el avance, avisa hasta qué hora hay que esperar y termina. Se vuelve a correr el mismo comando después de esa hora.
- Al terminar aplica los links seguros a los discos y reescribe [sin-spotify.md](sin-spotify.md) con los dudosos, los que no aparecen y los que falten buscar.
- Después: `npm run construir` para revisar el sitio en local (`npm run servir:pages` lo levanta en <http://localhost:4321/guia-musica/>) y subir los cambios a GitHub.

Las credenciales están en `.env` (`SPOTIFY_CLIENT_ID` y `SPOTIFY_CLIENT_SECRET`). `.env` está en `.gitignore` y nunca entró al repositorio. La API acepta como máximo 10 resultados por búsqueda; el script hace una consulta por segundo.

## Qué está hecho

### Contenido (solo jazz, por ahora)

| | Cantidad |
|---|---|
| Épocas (corrientes) | 18 |
| Regiones | 14 |
| Músicos y grupos | 362 (213 con cinco discos esenciales o más; 234 con link de artista en Spotify) |
| Discos | 1526 |
| Discos con link exacto de Spotify | 972 |
| Discos con lista de temas | 514 |
| Reseñas extensas | 19 |
| Redescubrimientos | 18 |
| Comparaciones | 3: bebop y hard bop, cool y hard bop, modal y free |
| Podcasts | 8 programas, 53 episodios, todos con link exacto de Spotify |
| Fichas audiovisuales | 45 (películas, documentales, series, conciertos y videos de canales oficiales) |
| Fuentes registradas | 647 |

**Origen de los 972 links exactos de Spotify:**
- 447 de los CSV de Yoana;
- 219 de MusicBrainz;
- 225 de la API de Spotify;
- 10 del buscador de Spotify;
- 71 de cargas anteriores.

- Las 18 épocas tienen texto, hitos, cómo suena, músicos, discos para empezar y fuentes. 15 están cotejadas con *Historia del jazz* de Ted Gioia por capítulo y página.
- No quedan fichas de músicos "por escribir" ni etapas de carrera pendientes.
- Todas las reseñas de discos tienen al menos dos frases. Las 1323 que tenían una sola pasaron a tres: cómo suena, qué tiene de particular y por qué está en el banco.
- El 8/11 se reescribieron 581 reseñas en las que la segunda frase repetía la primera. Ahora la primera dice cómo suena; la segunda, un dato particular (contexto, personal, sello o historia), y la tercera, por qué está en el banco. Para la frase del medio solo se usaron datos seguros; 12 reseñas quedaron con dos frases porque no había uno (ver "Qué falta").

### Sitio

- Generador estático propio, sin dependencias: `scripts/construir.mjs` arma `dist/` a partir de `datos/`.
- Validación (`scripts/datos.mjs`): frena la construcción solo ante referencias rotas, fechas imposibles y links mal formados. La falta de fuentes es un aviso; el detalle sale con `npm run auditar`.
- Marcas personales en el navegador (localStorage), con exportar e importar: disco escuchado, músico visto, puntaje, notas y época estudiada.
- **Llevar las marcas a otro dispositivo:** en "Mis marcas", un botón genera un link y un código QR con las marcas adentro, sin servidor ni cuenta. Al abrirlo, el otro navegador pregunta si combinar o reemplazar. El QR aparece hasta unas 55 marcas; con más, queda solo el link. "Mis marcas" también avisa que se guardan en este navegador y muestra cuándo fue la última exportación.
- **Ids estables:** si un id publicado desaparece sin estar en `datos/renombres.json`, la construcción se frena. Las marcas de un id renombrado se mudan solas al nuevo, y la dirección vieja redirige. Ya hay registrados cuatro renombres y cuatro fichas retiradas.
- **Formato de las marcas:** al convertir una versión vieja o mudar un id, la copia original queda como respaldo en el navegador. Los datos ilegibles o de una versión más nueva nunca se pisan. Detalle en [modelo-de-datos.md](modelo-de-datos.md).
- **Pruebas:** las de Playwright con Edge (43 generales, 18 de diseño y 31 de marcas) se corren a mano en local y **no están en el repositorio**. La publicación en GitHub Pages solo corre `npm run construir`, que frena ante errores en los datos, pero no espera a las pruebas del navegador.

## Decisiones de diseño

- **Dirección visual:** tapas y contratapas de un sello de jazz. Base crema y negro, rojo de acento, grano de impresión suave y mucho espacio vacío. Sin fotos de músicos ni logos reales de sellos.
- **Tipografías:** League Gothic para títulos y Archivo, de ancho variable, para el resto. Las dos son libres.
- **Color por época:** un color plano por época (azul profundo, naranja, violeta, rojo, verde oscuro y mostaza), con contraste comprobado en modo claro y oscuro. El nombre de la época va siempre escrito junto al color, nunca solo el color.
- **Portada del género:** "Jazz" y "El camino del jazz", con las épocas como tapas de disco agrupadas por década de inicio; las que conviven quedan una al lado de la otra.
- **Tu camino:** una línea de metro con las 18 épocas desde el principio, en gris. Cada parada se colorea a medias al marcar algo de esa época y se llena con ✓ al marcarla como estudiada. Debajo de cada parada van los años, un contador ("3 de 12") y la fecha de estudio. Abajo, la próxima parada sugerida y un selector para elegir otra.
- **Página de cada época:** un afiche con los años grandes, hitos sobre una línea y bloques numerados. El botón "Época estudiada" está arriba y al final, y no hace falta marcar todos los discos.
- **Ficha de disco:** contratapa de LP con catálogo, sello, año, ESTUDIO o EN VIVO, músicos con instrumento y temas. "Redescubrimiento" va como sticker rojo.
- **Fuentes discretas:** en el texto, como mucho un número gris; al pie, "Fuentes (n)" plegado. Página "Sobre este banco" con el criterio y todas las fuentes.
- **Tema:** claro (crema) por defecto, oscuro opcional con un botón que se recuerda en el navegador.
- **"Para ver y escuchar":** solo en las fichas con relevancia histórica que tienen películas, documentales o videos. Tiene tres grupos: podcasts, entrevistas y conciertos en YouTube, y películas y documentales. La página "Audiovisual" junta todo y se filtra por tipo.

## Criterios de contenido

- **Volumen antes que verificación.** Un disco o un músico entra con una fuente. Si le falta la segunda, queda con `verificacion: "sin-verificar"` en los datos y no se nota en el sitio. Esto reemplaza la regla de dos fuentes obligatorias de [criterios-editoriales.md](criterios-editoriales.md), que sigue valiendo para el resto: orden de las fuentes, cómo se declara el acceso y redescubrimientos.
- **Nada inventado.** Ante la duda, un dato se saca o se suaviza. Las fechas y los créditos se cotejan con MusicBrainz, Discogs y Wikipedia, y los desacuerdos se muestran en la ficha.
- **Textos propios.** No se copian de Gioia ni de otras fuentes.
- **Reseñas de disco de dos o tres frases:** cómo suena, qué tiene de particular y por qué está en el banco.
- **Qué es jazz.** El rock y la canción quedan afuera aunque sean rioplatenses: salieron Jaime Roos y Los Shakers, y El Kinto no entra. El jazz vocal no es una época sino un filtro por instrumento.
- **Podcasts:** solo episodios con link exacto de Spotify o de YouTube.
- **YouTube:** solo canales oficiales o con permiso, comprobados con el oEmbed de YouTube. Jazz Casual y Jazz Icons no tienen canal oficial: figuran como DVD, sin link.
- **Spotify:** se aplican solo coincidencias seguras de artista y título. Los dudosos los revisa Yoana.

## Los archivos de `fuentes/`

La carpeta está en `.gitignore`: **nada de esto se sube a GitHub ni se publica.**

| Archivo | Qué es | Para qué se usa |
|---|---|---|
| `Historia_del_Jazz_Gioia_Ted.pdf` | *Historia del jazz*, de Ted Gioia (Turner, 2012), copia de Yoana | Cotejar datos, ordenar las épocas y reforzar los textos, citando capítulo y página. No se copia. |
| `gioia.txt` | Texto extraído del PDF | Buscar pasajes para el cotejo. |
| `mi-jazz-spotify.csv` | 1389 discos de jazz de la discoteca de Yoana en Spotify, con link exacto | Los discos que encajan entran al banco con su link resuelto. |
| `mi-jazz-rioplatense.csv` | 35 discos de jazz rioplatense de la discoteca de Yoana, con link exacto | Igual que el anterior. "Los sueños de los otros" figura dos veces; se usa la primera edición. |

## Qué falta

1. **Terminar la búsqueda de Spotify** con `npm run spotify` (ver arriba): 454 discos todavía sin buscar.
2. **Revisar los dudosos** de [sin-spotify.md](sin-spotify.md): por ahora son 26 (13 de importancia alta). Cada uno tiene su link candidato; alcanza con decir cuáles se aprueban.
3. **Decidir qué hacer con los que no aparecen en Spotify** (por ahora 74, 25 de importancia alta): buscarlos en YouTube o sacarlos del banco.
4. **Terminar de pulir las reseñas:**
   - Quedan unas 174 con una repetición más leve entre la primera y la segunda frase. Algunas todavía repiten, como *We Three* o *Plenty, Plenty Soul*, y otras están bien.
   - Estas 12 tienen dos frases porque falta un dato particular seguro: *Son dos*, *El jardín de Ordóñez*, *Turista*, *Cajita de música*, *La cocina magnética*, *Gonzalo Levin Octeto*, *Into Forever*, *Characters*, *Everyday, Everynight*, *Ravensburg*, *Downhill from Here* y *Live in Montreux 1987*.
5. **Ampliar los datos sin cotejar con Gioia:** quedan 3 épocas sin cotejar (de 18), y la mayoría de los discos y músicos tiene una sola fuente.
6. **Más datos por disco:** el personal completo y el número de catálogo faltan en muchos discos.
7. **Pendientes de contenido opcionales:** más reseñas extensas, más comparaciones si ayudan y nuevas regiones o épocas, por ejemplo spiritual jazz o third stream, que se propusieron pero no se agregaron.
8. **Otros géneros:** música clásica y post-rock están previstos en la portada pero sin contenido.
9. **Más adelante:** evaluar cuentas con sincronización automática de las marcas. Por ahora no.
10. **Opcional:** sumar las pruebas de Playwright al repositorio y a la publicación, para que el sitio solo se publique si pasan.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run construir` | Valida los datos y genera el sitio en `dist/`. |
| `npm run servir:pages` | Construye y sirve el sitio en local con la misma ruta que GitHub Pages. |
| `npm run auditar` | Lista los avisos que no frenan la construcción, como fuentes faltantes. |
| `npm run spotify` | Busca en la API de Spotify los discos sin link exacto, aplica los seguros y actualiza `docs/sin-spotify.md`. |
| `npm run verificar` | Compara cada disco con las fuentes externas (MusicBrainz) y reporta lo que no coincide, sin modificar los datos. |
| `npm run verificar:podcasts` | Comprueba los links de los podcasts. |
