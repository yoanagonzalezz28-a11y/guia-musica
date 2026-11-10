# Modelo de datos

Cada ficha es un archivo JSON propio, y las fichas se conectan por `id`. El `id` es el nombre del archivo, sin `.json`.

```
datos/
  fuentes.json              registro de fuentes
  generos.json              jazz, clásica, post-rock
  ids-publicados.json       todos los ids de épocas, músicos y discos que se publicaron alguna vez
  renombres.json            qué pasó con cada id publicado que ya no existe
  jazz/
    genero.json             configuración y regiones planificadas
    corrientes/bebop.json
    regiones/cuba.json
    musicos/parker.json
    discos/moanin.json
    comparaciones/bebop-vs-hard-bop.json
    podcasts/anatomia.json
    audiovisual/…
```

## Cómo se conectan

```
corriente ◄──── disco ────► músico (lista de personal)
    ▲             ▲ ▲
    │             │ └────── época del músico (disco clave + resto)
 comparación      └──────── región
```

Lo que se escribe a mano va en un solo sentido. El resto se calcula al construir el sitio:

| Se escribe | Se calcula |
|---|---|
| Los músicos de cada disco | "Tocó con", "También toca en" |
| Las corrientes de cada disco | Lista de discos de la corriente, "Quiénes cruzan de un lado al otro" |
| `deriva` de una corriente | "De acá sale…" |

## Las cinco fichas

### Disco

| Campo | Qué guarda | Por qué así |
|---|---|---|
| `titulo`, `credito`, `tituloOriginal` | Título, cómo figura el artista y título original si cambió | *Massey Hall* se acredita a "The Quintet"; *Moanin'* salió con el nombre de la banda |
| `lideres` | Músicos con ficha que lideran | Separado del crédito impreso |
| `grabacion` | `desde`, `hasta`, `detalle` | Las sesiones pueden durar meses o años |
| `edicion` | `anio`, `detalle` | Puede haber una década de diferencia con la grabación |
| `sello`, `catalogo`, `lugar` | Datos de edición | `catalogo` y `lugar` pueden estar vacíos |
| `tipo`, `compilacion` | `estudio` o `vivo`, y si es recopilación | Un disco puede ser de estudio y además recopilación |
| `recopilacion` | `desde`, `hasta` (o `anios` como texto) y `original` | La ficha dice "Recopilación de grabaciones de 1945 a 1948" y, si se sabe, dónde salieron primero |
| `musicos` | `musico` (id o `null`), `nombre`, `instrumento`, `nota` | Se puede listar a alguien antes de que tenga ficha |
| `personalNota` | Aclaración sobre la lista de músicos | Hay sesiones con personal dudoso, como la de "Ko-Ko" |
| `corrientes`, `corrienteNota`, `regiones` | Clasificación y por qué | Algunas ubicaciones son provisorias y conviene decirlo |
| `comentario` | Reseña propia de dos o tres frases: cómo suena, qué tiene de particular y por qué está en el banco | |
| `spotify` | `verificado` con link, o `busqueda` con consulta | Nunca se inventa un link |
| `ids` | MusicBrainz, Discogs, Wikidata, Wikipedia | Permite volver a verificar la ficha |
| `discrepancias` | Dónde no coinciden las fuentes | Se muestra en la ficha |
| `respaldo` | `fuente`, `acceso` y `aporta` | Alcanza con una fuente (ver más abajo) |
| `verificacion` | `sin-verificar` si tiene una sola fuente | No se nota en el sitio; sirve para saber qué falta reforzar |
| `redescubrimiento` | `motivo` | Etiqueta para joyas poco conocidas |
| `corrientePendiente` | Nombre de la corriente por cargar | Permite cargar discos regionales antes de migrarla |
| `revision` | `estado` (`borrador` o `revisado`) y `gioia` (`pendiente` o `cotejado`) | Controla tu aprobación y el cotejo con Gioia |

### Músico

Datos básicos (`nombre`, `apodo`, `nacimiento`, `muerte`, `instrumentos`, `corrientes`, `regiones`, `resumen`, `spotify`), más `respaldo`, `verificacion` y `epocas`:

```json
{
  "titulo": "El puente",
  "desde": 1959,
  "hasta": 1962,
  "texto": "…",
  "discoClave": { "disco": "the-bridge", "explicacion": "…" },
  "discos": []
}
```

`epocasPendientes` sigue existiendo para listar etapas por cargar, pero hoy no queda ninguna.

### Corriente

`nombre`, `lema`, `tinta` y `tintaTexto` (sus colores), `periodo` (`desde`, `hasta`, `aproximado`), `deriva`, `derivaPendiente`, `regiones`, `lugares`, `texto`, `suena`, `hitos`, `legado`, `musicos`, `musicosPendientes`, `discosEsenciales`, `respaldo` y `revision`.

### Región

`nombre`, `resumen`, `texto`, `corrientes`, `musicos`, `discos`, `figurasPendientes`, `sellos` y `escenaActual` (`musico`, el id de su ficha, más `nombre`, `instrumento`, `base`, `ultimaActividad`, `detalle`, `fuentes`). Las regiones que todavía no tienen ficha se listan en `genero.json`.

### Comparación

`a`, `b`, `tintaCruce`, `intro`, `ejes` (`eje`, `a`, `b`) y `escuchaParalela` (dos temas y una consigna).

## Fuentes

**Una fuente alcanza.** Un disco o un músico entra al banco con una sola fuente en `respaldo` (o en `ids.wikipedia`). Si le falta la segunda, lleva `"verificacion": "sin-verificar"`. Eso no se nota en el sitio: es una lista de lo que conviene reforzar. `npm run auditar` muestra las fichas que tienen una fuente y no llevan esa marca.

Esto reemplaza la regla de dos fuentes obligatorias de la primera versión. El resto de los [criterios editoriales](criterios-editoriales.md) sigue igual: el orden de las fuentes, cómo se declara el acceso y los redescubrimientos.

### Cotejo con Gioia

*Historia del jazz*, de Ted Gioia (Turner, 2012), figura en `fuentes.json` con el id `gioia` y está `consultada`, así que se puede citar.

- Se coteja **por capítulo y página** de la edición castellana. La referencia va en el `aporta` del respaldo, por ejemplo: `Cap. "Las big bands", p. 256: …`.
- Cuando una ficha está cotejada, `revision.gioia` pasa de `pendiente` a `cotejado`. El pie de "Fuentes" lo indica: "Texto propio, cotejado con *Historia del jazz*".
- Gioia se usa para comprobar datos y ordenar las épocas. Sus textos no se copian.
- Hoy hay 15 de las 18 épocas cotejadas. Los discos y los músicos todavía figuran como `pendiente`.

## Citas

En cualquier texto, `[^wp-bebop]` genera una nota numerada que enlaza a `fuentes.json`. Cada fuente tiene un `estado`: `consultada` o `pendiente`. Citar una fuente `pendiente` genera un aviso.

## Ids estables

Las marcas de cada persona se guardan con el id de la ficha (`disco:moanin`), y el id también arma la dirección de la página. Por eso un id publicado no debería cambiar. Si cambia, hay que dejarlo registrado:

- **`datos/ids-publicados.json`** lista todos los ids de épocas, músicos y discos que se publicaron alguna vez. `npm run construir` suma solo los nuevos y nunca borra ninguno. Este archivo se sube con el resto de los cambios.
- **`datos/renombres.json`** dice qué pasó con cada id que ya no existe. El valor es el id nuevo o `null`, si la ficha salió del banco:

  ```json
  { "renombres": { "disco:light-as-a-feather": "disco:light-as-a-feather-corea", "musico:roos": null } }
  ```

- **La construcción se frena** si falta un id publicado y no figura en `renombres.json`. También se frena si un renombre apunta a una ficha que no existe, si se encadena en círculo o si cambia de tipo (un disco que pasa a ser músico).
- **En el navegador**, la primera vez que alguien abre el sitio después del cambio, las marcas del id viejo se mudan al nuevo. Si ya tenía marcas en el id nuevo, se combinan con la regla de conflictos. Lo mismo pasa con un archivo o un link de marcas con ids viejos.
- **Las fichas retiradas** (`null`) conservan sus marcas y sus notas. En "Mis marcas" aparecen como "ya no está en el banco".
- **La dirección vieja** redirige a la ficha nueva.

## Marcas personales

Se guardan en el `localStorage` de cada navegador, con la clave `banco-musica:marcas`, y nunca en estos archivos:

```json
{
  "version": 2,
  "marcas": {
    "disco:moanin": {
      "escuchado": true,
      "fechaEscuchado": "2026-11-06T20:00:00.000Z",
      "puntaje": 4,
      "fechaPuntaje": "2026-11-06T20:00:00.000Z",
      "notas": [{ "texto": "…", "fecha": "2026-11-06T20:00:00.000Z" }],
      "titulo": "Moanin'",
      "actualizado": "2026-11-06T20:00:00.000Z"
    },
    "corriente:bebop": { "completada": true, "fechaCompletada": "2026-11-07T18:00:00.000Z", "…": "…" }
  }
}
```

El prefijo indica el tipo: `disco:` para lo escuchado, `musico:` para lo visto y `corriente:` para una época estudiada.

### Regla de conflictos

Vale para importar un archivo, recibir un link y mudar un id renombrado:

- `escuchado`, `puntaje` y `completada` se resuelven cada uno por separado, y gana el cambio más reciente.
- Las notas distintas se conservan todas, cada una con su fecha. Las iguales quedan como una.

### Cambios de formato

Un cambio de formato no borra marcas:

- Cada versión sabe pasar a la siguiente (`MIGRACIONES` en `sitio/marcas.js`). Hoy existe el paso 1 → 2. Un formato 3 agregaría su propio paso 2 → 3, y una marca de la versión 1 pasaría por los dos.
- Antes de guardar el resultado de una conversión, la copia original queda en `banco-musica:marcas:respaldo:<fecha>`. Se conservan los tres respaldos más recientes.
- Si lo guardado no se puede leer (texto roto o formato desconocido), también pasa a respaldo antes de que una marca nueva escriba encima.
- Si lo guardado tiene un formato más nuevo que el código de la página (por ejemplo, una pestaña vieja abierta después de publicar), esa pestaña no lo toca y "Mis marcas" pide recargar.
- Los archivos exportados de la versión 1 se siguen pudiendo importar.

### Llevar las marcas a otro dispositivo

"Mis marcas" genera un link y un código QR con las marcas adentro, sin servidor ni cuenta:

- Las marcas viajan después de `#llevar=` en el link. Esa parte de la dirección no se envía al servidor, así que solo las ve quien tenga el link.
- Para que entren más marcas en el QR, cada una viaja como una lista corta: `["d:moanin", 1, fecha, 4, fecha]`. Las fechas van en minutos desde 2020, no viajan los ceros del final ni el título, y el conjunto se comprime (deflate) y se pasa a base64url. El título se recupera del índice del sitio.
- Al abrir el link, la página pregunta si **combinar** (con la regla de conflictos) o **reemplazar**. Si se reemplaza, las marcas anteriores quedan en respaldo. Si el navegador no tiene marcas, ofrece un solo botón para guardarlas.
- Hasta unas 55 marcas simples, o unos 1500 caracteres, aparece el QR, y está comprobado que se lee. Con más marcas el código sale demasiado denso, así que solo se muestra el link; probado con 600 marcas. Para cantidades grandes conviene exportar e importar el archivo.
- El generador de QR es [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator), de Kazuhiko Arase (licencia MIT). Está copiado en `sitio/qrcode.js` y no se carga de afuera.

## Qué rechaza la validación

El sitio no se construye si:

- una referencia apunta a una ficha que no existe;
- un texto cita una fuente inexistente;
- una grabación o una época termina antes de empezar, o un disco se edita antes de grabarse;
- un link de Spotify de un disco no tiene el formato de un álbum, o un link de YouTube no es de un canal registrado;
- el `id` no coincide con el nombre del archivo;
- un id publicado desapareció sin figurar en `renombres.json`.

Lo demás son avisos que no frenan la construcción y se listan con `npm run auditar`. Por ejemplo: fichas con una sola fuente sin la marca `sin-verificar`, un músico que lidera un disco que no está en ninguna de sus épocas o una cita a una fuente `pendiente`.

`npm run verificar` compara además cada disco con MusicBrainz, Discogs y Spotify, y avisa si algo no coincide. No modifica los datos.

## Límites conocidos

- **Spotify:** "verificado" significa que el álbum existe y que el título coincide. Esa comprobación no confirma el artista, y el link puede llevar a una reedición.
- **Temas:** no hay una ficha por tema. "Ko-Ko" aparece solo como texto dentro de un disco.
- **Clásica:** el modelo no le sirve tal cual, porque ahí una obra tiene muchas grabaciones. Va a necesitar un tipo de ficha "obra", que conviene diseñar en esa etapa.

## Podcasts

Cada programa es un archivo en `datos/jazz/podcasts/`, con sus episodios adentro. Hoy hay 8 programas y 53 episodios, **todos con link exacto de Spotify verificado**. Los episodios que solo estaban en otras plataformas o tenían el link roto quedaron afuera.

**Programa:** `nombre`, `conductor`, `descripcion`, `idioma`, `pais`, `web`, `rss`, `spotify`.

**Episodio:**

| Campo | Qué guarda |
|---|---|
| `titulo`, `codigo`, `fecha`, `duracionMin` | Datos del episodio |
| `spotify` | `verificado` con link exacto, `busqueda` con una consulta, o `sin-confirmar` |
| `original` | Link de la plataforma donde se publica |
| `verificacion` | Estado, código HTTP y fecha de la última comprobación |
| `temas` | Nombres de músicos, discos, corrientes o regiones |

Los `temas` se conectan solos con una ficha cuando existe. Si todavía no hay ficha, quedan esperando, y el episodio aparece solo cuando se carga.

Solo entran episodios con link exacto de Spotify o de YouTube. `npm run verificar:podcasts` vuelve a comprobar todos los links.
