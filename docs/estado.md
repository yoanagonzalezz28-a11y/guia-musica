# Estado del proyecto

Actualizado el 25 de noviembre de 2026. Sitio publicado: <https://yoanagonzalezz28-a11y.github.io/guia-musica/> (cada push a `main` publica).

## Playlists de Spotify

`npm run playlists` crea y actualiza en la cuenta de Spotify de Yoana "Banco de música · Recorrido completo" (un tema de cada disco con link de Spotify, por año de grabación) y una "Banco de música · <época>" por época, con el mismo tema de cada disco.

- **Cómo se elige el tema:** el que nombra la reseña entre comillas (sin contar nombres de épocas ni de regiones); si no nombra ninguno, el primer resultado de la búsqueda de temas de Spotify para ese álbum. La API ya no da la popularidad (`popularity` no viene y "temas más escuchados" da 403), pero la búsqueda ordena en buena parte por ella. Si la búsqueda no sirve, el tema que se llama como el disco o el primero del álbum. Los temas sueltos enlazados dentro de una recopilación (`dentroDe`) usan el tema del título.
- **Lo elegido no cambia:** queda en `datos/spotify-playlists.json` (se sube a GitHub). Al volver a correr, solo se eligen los discos nuevos o los que cambiaron de álbum, y cada playlist se reescribe en orden si falta o sobra algo. Los cambios hechos a mano en la playlist se pisan.
- **Autorización:** flujo "authorization code" con la Redirect URI `http://127.0.0.1:8080/callback` y los permisos de playlists. El token queda en `.spotify-sesion.json`, que está en `.gitignore`. Para volver a autorizar: `npm run playlists -- --autorizar`.
- **Límites de Spotify (22/11/2026):** corta por cantidad, no por velocidad, y cada tipo de consulta por separado. La búsqueda y la consulta de álbumes se bloquearon después de unas 1000 consultas, con esperas de 8 a 24 horas. El script va a una consulta por segundo, casi siempre resuelve un disco con una sola búsqueda, aplaza los que necesitan la lista completa del álbum cuando esa consulta está bloqueada y guarda el avance. Si todo se bloquea, dice hasta qué hora esperar.
- **Visibilidad:** Spotify crea las playlists públicas aunque se pida que sean privadas, y la API responde bien al pedido de cambiarlas a privadas pero no cambia nada. Se cambian a mano en la app. Los botones del sitio ("Escuchar esta época en Spotify" en cada época y "Escuchar el recorrido completo en Spotify" en la portada del jazz) aparecen solo después de `npm run playlists -- --publicar`.
- **Terminado el 25/11/2026:** 1414 de 1422 discos con tema, sin temas repetidos: 1238 por la búsqueda, 145 por la reseña, 22 primer tema del álbum, 6 tema del título y 3 dentro de una recopilación. Las 19 playlists están creadas y al día; la del recorrido completo tiene 1414 temas.
- **8 discos sin tema**, porque el link del banco lleva a una edición que Spotify no deja escuchar en Uruguay (todos los temas con la restricción "market"): *Afrodeezia* y *Laid Black* (Marcus Miller), *An Ordinary Day in an Unusual Place* (Us3), *Gratitude* (Chris Potter), *Light Blue* (Ernesto Jodos), *Rosemary's Baby* (Komeda), *Silver Pony* (Cassandra Wilson) y *Tempo feliz* (Baden Powell). Se vuelven a intentar en cada corrida. Para incluirlos, habría que cambiar el link del disco por una edición disponible.
- **Pendiente de Yoana:** decidir si las playlists pasan a privadas (a mano en la app; mientras tanto son públicas) y cuándo se prenden los botones del sitio.

## Cuenta y respaldos

- **Cuenta con Google probada contra el Supabase real** (21/11): `npm run probar:cuenta` dio 11 de 11. Sin sesión no se ve nada; con sesión, cada persona lee, guarda, cambia y borra solo su fila; no puede escribir la de otra; y la tabla rechaza datos con otro formato. La prueba usa un usuario de prueba con mail y contraseña (instrucciones al principio de `scripts/probar-cuenta.mjs`), que después se borra junto con el proveedor Email.
- **Repositorio privado [guia-musica-respaldos](https://github.com/yoanagonzalezz28-a11y/guia-musica-respaldos)**, con tres tareas de GitHub Actions:
  - *Mantener Supabase activo*: lunes, miércoles y viernes a las 10:23 (Uruguay) lee un `user_id` de la tabla `marcas`. El plan gratis pausa después de 7 días sin uso.
  - *Respaldo semanal*: los domingos a las 06:41 exporta la tabla a `respaldos/marcas-AAAA-MM-DD.json` y conserva las 12 copias más recientes. Si la tabla viene vacía no guarda nada y falla, para no desplazar copias buenas.
  - *Restaurar una copia*: solo a mano; por defecto solo prueba. Los pasos están en el README de ese repositorio.
  - Las tres se corrieron a mano el 21/11 y salieron bien. La primera copia tiene 1 cuenta con 0 marcas.
  - Secretos: `SUPABASE_URL` y `SUPABASE_SECRET_KEY` (la clave secreta, que saltea las reglas por fila). Están solo en ese repositorio, nunca en el código. Si una tarea falla, GitHub manda un mail.
- **Arreglo de la sincronización:** si la fila de la cuenta falta en Supabase (tabla recreada, fila perdida), el navegador lo trata como un primer ingreso y combina. Antes lo tomaba como que se había borrado todo, borraba las marcas ya sincronizadas y subía la lista vacía. `npm run probar:sincronizar` lo comprueba (5 casos).
- **Para restaurar en el sitio:** después de restaurar una copia, en cada dispositivo hay que ir a "Mis marcas" → Salir → Entrar con Google, para que el navegador combine la copia con lo suyo.

## Búsqueda de Spotify: terminada

El 10/11 se terminó la búsqueda en la API: se buscaron los 477 discos que faltaban, sin nuevos límites de Spotify. Se aplicaron 329 links seguros; 54 quedaron dudosos y 194 no aparecen. El detalle está en [sin-spotify.md](sin-spotify.md).

El 15/11 se volvió a buscar con un criterio más amplio (se aplica si coincide el artista y el título es muy parecido; quedan marcados `porSimilitud` en los datos). Quedaron 56 aplicados por similitud y 186 discos sin candidato (72 de importancia alta). Una primera tanda había dejado pasar discos equivocados (otro volumen, otro disco con título parecido, una versión para piano) por un error en la regla de los números; se corrigió la regla, se endureció (títulos completos, años, palabras del nombre del artista) y esos links se deshicieron. Cada corrida vuelve a juzgar los aplicados por similitud con el criterio vigente.

Para buscar discos nuevos, `npm run spotify` retoma solo los que no tienen link exacto. Si Spotify limita por más de dos minutos, guarda el avance, avisa hasta qué hora hay que esperar y termina.

Las credenciales están en `.env` (`SPOTIFY_CLIENT_ID` y `SPOTIFY_CLIENT_SECRET`). `.env` está en `.gitignore` y nunca entró al repositorio. La API acepta como máximo 10 resultados por búsqueda; el script hace una consulta por segundo.

## Qué está hecho

### Contenido (solo jazz, por ahora)

| | Cantidad |
|---|---|
| Épocas (corrientes) | 18 |
| Regiones | 14 |
| Músicos y grupos | 399 (254 con link de artista en Spotify) |
| Discos | 1606 (41 recopilaciones) |
| Discos con link exacto de Spotify | 1415 |
| Discos con lista de temas | 514 |
| Reseñas extensas | 19 |
| Redescubrimientos | 18 |
| Comparaciones | 3: bebop y hard bop, cool y hard bop, modal y free |
| Podcasts | 8 programas, 53 episodios, todos con link exacto de Spotify |
| Fichas audiovisuales | 45 (películas, documentales, series, conciertos y videos de canales oficiales) |
| Fuentes registradas | 719 |
| Discos con personal completo | 1189 (476 dicen en qué temas toca cada músico) |
| Mujeres con ficha | 49 de 379 músicos individuales (12,9 %) |

**Origen de los links exactos de Spotify** (cuenta del 8/11, antes de los 329 de la API del 10/11):
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
- **Puntaje con estrellas:** cinco estrellas que se tocan (área de 44 px); tocar la misma otra vez borra el puntaje. Se guarda el mismo número del 1 al 5 de siempre, así que los puntajes viejos se ven como estrellas sin convertir nada.
- **Tu perfil de escucha** (arriba de "Mis marcas", con link desde "Tu camino"): con 5 discos puntuados o más muestra los discos de 5 estrellas, los músicos favoritos, las épocas, regiones e instrumentos más escuchados y mejor puntuados, una frase de devolución y hasta 6 discos para escuchar después con el motivo ("porque te gustó Speak No Evil"). Antes, invita a puntuar. Se calcula en el navegador con `recursos/perfil.json` (60 KB comprimido), que se arma en la construcción y solo se baja en esa página. El instrumento de un disco es el de su líder; la región, la del disco o, si no tiene, la de sus líderes.
- **Llevar las marcas a otro dispositivo:** en "Mis marcas", un botón genera un link y un código QR con las marcas adentro, sin servidor ni cuenta. Al abrirlo, el otro navegador pregunta si combinar o reemplazar. El QR aparece hasta unas 55 marcas; con más, queda solo el link. "Mis marcas" también avisa que se guardan en este navegador y muestra cuándo fue la última exportación.
- **Ids estables:** si un id publicado desaparece sin estar en `datos/renombres.json`, la construcción se frena. Las marcas de un id renombrado se mudan solas al nuevo, y la dirección vieja redirige. Ya hay registrados cuatro renombres y cuatro fichas retiradas.
- **Formato de las marcas:** al convertir una versión vieja o mudar un id, la copia original queda como respaldo en el navegador. Los datos ilegibles o de una versión más nueva nunca se pisan. Detalle en [modelo-de-datos.md](modelo-de-datos.md).
- **Pruebas:** las de Playwright con Edge (43 generales, 18 de diseño y 31 de marcas) se corren a mano en local y **no están en el repositorio**. La publicación en GitHub Pages solo corre `npm run construir`, que frena ante errores en los datos, pero no espera a las pruebas del navegador.

### Cambios del 17/11/2026

- **Cuenta con Google (etapa 1):** entrar con Google desde "Mis marcas" y sincronizar las marcas entre dispositivos (Supabase, São Paulo). Detalle en [modelo-de-datos.md](modelo-de-datos.md). Se probó con 26 pruebas con un Supabase simulado (ingreso, renovación de la sesión, primera combinación, borrados de cada lado, notas, salir y sin conexión), que no quedaron guardadas, y el 21/11 contra el Supabase real (ver "Cuenta y respaldos").
- **Europa occidental:** región nueva con 63 discos (los 59 que no tenían región y los 4 de Django Reinhardt) y 17 músicos. Django estaba por error en Estados Unidos y pasó acá. Falta su escena actual.
- **Personal:** 16 discos de importancia alta completados con el buscador de Wikipedia; se descartaron tres páginas que eran de otro disco. Quedan 416 incompletos (144 de importancia alta).

### Cambios del 15/11/2026 (segunda tanda)

- **Spotify a mano:** *Forest Flower*, *Progress* y *Jealousy* (en Spotify salen juntos), *Songs: The Art of the Trio Vol. 3* y *Black Byrd* (en Spotify figura como *Blackbyrd*). Tres temas sueltos se enlazan dentro de una recopilación oficial, y la ficha lo aclara (campo `dentroDe`): *Perdido* (la toma de 1942, en *Never No Lament*), *Strange Fruit* (la grabación de Commodore, en *The Complete Commodore/Decca Masters*) y *Muskrat Ramble* (en *The Hot Fives, Volume I*).
- **YouTube:** 17 discos de importancia alta que no están en Spotify van a su álbum en YouTube Music, es decir, al canal "Topic" que arma el sello. Se buscaron con el buscador de álbumes de YouTube Music y se verificaron con oEmbed. El botón dice "YouTube" (estado `fuera`, `via: "youtube-music"`). Los de importancia media y baja siguen con la búsqueda de Spotify.
- **Músicos sin etapas:** Juan Tizol (Swing, disco clave *Caravan*), Jon Christensen (ECM, *Afric Pepperbird*) y Gilles Peterson (Acid jazz, *Positivity* de Incognito, editado por su sello) tienen ahora su etapa. Popo Romano pasó a Jazz rioplatense. Buddy Bolden (no dejó grabaciones) y Popo Romano (sin discos en el banco) siguen sin disco clave.
- **Escena actual:** con actividad de 2025-2026, Juan Pablo Chapital (Electric Miles en el Festival de Jazz de Montevideo, diciembre de 2025), Gonzalo Levin (homenaje a Coltrane en el 19.° Festival, 2 de diciembre de 2026), Andrés Hayes (Bebop Club, enero de 2026) y Seun Kuti (Coachella y gira europea, 2025). Samuel Yirga y Louiz Banks salieron de la escena actual por no tener nada documentado de los últimos dos años; siguen en la lista de su región.
- **Regiones de los discos:** 120 discos recibieron región, 78 por la de su líder y 42 a mano. GoGo Penguin, Matthew Halsall, Andy Sheppard, Shabaka Hutchings, Allan Holdsworth y Kenny Wheeler se sumaron a Reino Unido. Quedan 59 sin región porque son de países que el banco no tiene como región: Francia, Alemania, Italia, Austria, Suiza, España, Bélgica y Países Bajos.

### Revisión general del 15/11/2026

- Links internos: 57.067 en 2055 páginas, ninguno roto, ninguna ancla rota.
- Ids: ningún id publicado huérfano; los 8 renombres apuntan a fichas que existen.
- Textos de prueba o carteles provisorios visibles: ninguno.
- Celular (360 px) y modo oscuro en 18 páginas principales: sin desplazamiento horizontal ni errores.
- *Bolsa de naylon en la rama de un árbol* mostraba "Músicos" con la lista vacía: ahora la sección se oculta si no hay personal.
- El mapa de Regiones se probó y se descartó: Regiones sigue siendo una lista.

### Cambios del 10/11/2026

- **Personal:** se completó con los créditos de MusicBrainz (808 discos) y la sección de personal de Wikipedia (189). Las coincidencias de MusicBrainz con un año que no cuadra se aceptaron solo si eran un álbum común con el líder en la lista; se descartaron 41.
- **Recopilaciones:** 39 discos, cada uno con el rango de años que abarca y, cuando se sabe, dónde salieron primero las grabaciones (campo `recopilacion`).
- **Jazz rioplatense y Río de la Plata:** la época es el estilo (jazz con candombe, tango o folclore) y la región es el lugar (todo el jazz de Uruguay y la Argentina). 38 discos sin esas raíces pasaron a otras épocas y siguen en la región. La escena actual va solo en la región y se armó con premios Gardel 2023-2026, Graffiti 2025, el Festival de Punta del Este 2025-2026, el del Sodre y Jazz a la Calle.
- **Mujeres:** 20 fichas nuevas, de Lil Hardin Armstrong a Brandee Younger, y Roxana Amed y Ligia Piro en el Río de la Plata.
- **Carteles provisorios:** no queda ninguno visible. Los datos de borrador siguen en los JSON.

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
- **Spotify:** se aplican coincidencias seguras y, desde el 15/11, las muy parecidas (mismo artista, título casi igual, mismos números de volumen y años). La muestra para revisar está en sin-spotify.md.

## Los archivos de `fuentes/`

La carpeta está en `.gitignore`: **nada de esto se sube a GitHub ni se publica.**

| Archivo | Qué es | Para qué se usa |
|---|---|---|
| `Historia_del_Jazz_Gioia_Ted.pdf` | *Historia del jazz*, de Ted Gioia (Turner, 2012), copia de Yoana | Cotejar datos, ordenar las épocas y reforzar los textos, citando capítulo y página. No se copia. |
| `gioia.txt` | Texto extraído del PDF | Buscar pasajes para el cotejo. |
| `mi-jazz-spotify.csv` | 1389 discos de jazz de la discoteca de Yoana en Spotify, con link exacto | Los discos que encajan entran al banco con su link resuelto. |
| `mi-jazz-rioplatense.csv` | 35 discos de jazz rioplatense de la discoteca de Yoana, con link exacto | Igual que el anterior. "Los sueños de los otros" figura dos veces; se usa la primera edición. |

## Qué falta

1. **Revisar la muestra de Spotify por similitud** en [sin-spotify.md](sin-spotify.md) (55 aplicados).
2. **Los que no aparecen en Spotify:** 162 (49 de importancia alta, que tampoco están en YouTube Music). Los de importancia media y baja quedan con la búsqueda de Spotify.
3. **Terminar de pulir las reseñas:**
   - Quedan unas 174 con una repetición más leve entre la primera y la segunda frase. Algunas todavía repiten, como *We Three* o *Plenty, Plenty Soul*, y otras están bien.
   - Estas 12 tienen dos frases porque falta un dato particular seguro: *Son dos*, *El jardín de Ordóñez*, *Turista*, *Cajita de música*, *La cocina magnética*, *Gonzalo Levin Octeto*, *Into Forever*, *Characters*, *Everyday, Everynight*, *Ravensburg*, *Downhill from Here* y *Live in Montreux 1987*.
4. **Ampliar los datos sin cotejar con Gioia:** quedan 3 épocas sin cotejar (de 18), y la mayoría de los discos y músicos tiene una sola fuente.
5. **Más datos por disco:** quedan 416 discos con el personal incompleto (144 de importancia alta; la lista está en [personal-incompleto.md](personal-incompleto.md)). El número de catálogo sigue faltando en muchos.
   - Mujeres: siguen sin ninguna Jazz latino, Jazz manouche, Jazz modal y Acid jazz.
   - Buddy Bolden y Popo Romano no tienen disco clave. Europa occidental todavía no tiene escena actual.
   - Popo Romano no tiene discos cargados (MusicBrainz solo registra *Susurro montevideano*, de 2009, sin datos para reseñarlo). *Éthiopiques, Vol. 21* no figura como recopilación porque no se sabe qué años abarca.
6. **Pendientes de contenido opcionales:** más reseñas extensas, más comparaciones si ayudan y nuevas regiones o épocas, por ejemplo spiritual jazz o third stream, que se propusieron pero no se agregaron.
7. **Otros géneros:** música clásica y post-rock están previstos en la portada pero sin contenido.
8. **Cuentas con sincronización:** la etapa 1 (entrar con Google y sincronizar) está hecha y probada con una cuenta real. Falta:
   - Después de la prueba del 21/11: borrar el usuario de prueba en Supabase, desactivar el proveedor Email (estaba activo y permitía crear cuentas con contraseña por la API) y sacar `SUPABASE_PRUEBA_EMAIL` y `SUPABASE_PRUEBA_CLAVE` de `.env`.
   - Etapa 2: página de privacidad y opción para borrar la cuenta. La página tiene que decir que las marcas quedan en los respaldos semanales hasta 12 semanas y en el historial del repositorio de respaldos.
   - El ingreso con link por mail queda para más adelante.
9. **Opcional:** sumar las pruebas de Playwright al repositorio y a la publicación, para que el sitio solo se publique si pasan.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run construir` | Valida los datos y genera el sitio en `dist/`. |
| `npm run servir:pages` | Construye y sirve el sitio en local con la misma ruta que GitHub Pages. |
| `npm run auditar` | Lista los avisos que no frenan la construcción, como fuentes faltantes. |
| `npm run spotify` | Busca en la API de Spotify los discos sin link exacto, aplica los seguros y actualiza `docs/sin-spotify.md`. |
| `npm run verificar` | Compara cada disco con las fuentes externas (MusicBrainz) y reporta lo que no coincide, sin modificar los datos. |
| `npm run verificar:podcasts` | Comprueba los links de los podcasts. |
| `npm run probar:cuenta` | Prueba la tabla `marcas` y sus reglas contra el Supabase real. Sin usuario de prueba en `.env`, hace solo la primera comprobación. |
| `npm run probar:sincronizar` | Prueba la regla de sincronización con un navegador simulado. |
| `npm run playlists` | Elige un tema por disco y crea o actualiza las playlists del banco en Spotify. `-- --publicar` muestra los botones en el sitio; `-- --autorizar` vuelve a pedir permiso. |
