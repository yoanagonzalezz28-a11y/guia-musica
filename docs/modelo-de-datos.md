# Modelo de datos (propuesta de la Etapa 1)

Cada ficha es un archivo JSON propio, y las fichas se conectan por `id`.

```
datos/
  fuentes.json              registro de fuentes
  generos.json              jazz, clásica, post-rock
  jazz/
    genero.json             configuración y regiones planificadas
    corrientes/bebop.json
    regiones/cuba.json
    musicos/parker.json
    discos/moanin.json
    comparaciones/bebop-vs-hard-bop.json
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
| `musicos` | `musico` (id o `null`), `nombre`, `instrumento`, `nota` | Se puede listar a alguien antes de que tenga ficha |
| `personalNota` | Aclaración sobre la lista de músicos | Hay sesiones con personal dudoso, como la de "Ko-Ko" |
| `corrientes`, `corrienteNota`, `regiones` | Clasificación y por qué | Algunas ubicaciones son provisorias y conviene decirlo |
| `comentario` | Texto propio | |
| `spotify` | `verificado` con link, o `busqueda` con consulta | Nunca se inventa un link |
| `ids` | MusicBrainz, Discogs, Wikidata, Wikipedia | Permite volver a verificar la ficha |
| `discrepancias` | Dónde no coinciden las fuentes | Se muestra en la ficha |
| `respaldo` | `fuente`, `acceso` y `aporta` | Mínimo dos fuentes; ver [criterios](criterios-editoriales.md) |
| `redescubrimiento` | `motivo` | Etiqueta para joyas poco conocidas |
| `corrientePendiente` | Nombre de la corriente por cargar | Permite cargar discos regionales antes de migrarla |
| `revision` | `borrador` o `revisado`, y estado del cotejo con Gioia | Controla tu aprobación |

### Músico

Datos básicos (`nombre`, `apodo`, `nacimiento`, `muerte`, `instrumentos`, `corrientes`, `regiones`, `resumen`, `spotify`) más `epocas`:

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

### Corriente

`nombre`, `lema`, `tinta` y `tintaTexto` (sus colores), `periodo` (`desde`, `hasta`, `aproximado`), `deriva`, `derivaPendiente`, `regiones`, `lugares`, `texto`, `suena`, `hitos`, `legado`, `musicos`, `musicosPendientes`, `discosEsenciales`.

### Región

`nombre`, `resumen`, `texto`, `corrientes`, `musicos`, `discos`, `figurasPendientes`, `sellos` y `escenaActual` (`nombre`, `instrumento`, `base`, `ultimaActividad`, `detalle`, `fuentes`). Las regiones que todavía no tienen ficha se listan en `genero.json`.

### Comparación

`a`, `b`, `tintaCruce`, `intro`, `ejes` (`eje`, `a`, `b`) y `escuchaParalela` (dos temas y una consigna).

## Citas

En cualquier texto, `[^wp-bebop]` genera una nota numerada que enlaza a `fuentes.json`. Cada fuente tiene un `estado`: `consultada` o `pendiente`.

## Marcas personales

Se guardan en `localStorage`, nunca en estos archivos:

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
    }
  }
}
```

Al importar, escuchado y puntaje se resuelven por separado: gana el cambio más reciente de cada campo. Las notas distintas se conservan todas con su fecha, y las iguales quedan como una. También se aceptan archivos de la versión 1.

El prefijo `disco:` deja lugar para marcar también músicos o corrientes más adelante. Por eso los `id` no deberían cambiar una vez publicados: si cambian, se pierde la marca y se rompe el link.

## Qué rechaza la validación

El sitio no se construye si:

- una referencia apunta a una ficha que no existe;
- un texto cita una fuente inexistente o `pendiente`, **como Gioia hoy**;
- un disco se edita antes de grabarse;
- una época incluye un disco donde ese músico no figura;
- un músico lidera un disco que no está en ninguna de sus épocas;
- un link de Spotify no tiene el formato de un álbum.

`npm run verificar` compara además cada disco con MusicBrainz, Discogs y Spotify, y avisa si algo no coincide. No modifica los datos.

## Límites conocidos

- **Spotify:** "verificado" significa que el álbum existe y que el título coincide. Esa comprobación no confirma el artista, y el link puede llevar a una reedición.
- **Temas:** no hay una ficha por tema. "Ko-Ko" aparece solo como texto dentro de un disco.
- **Clásica:** el modelo no le sirve tal cual, porque ahí una obra tiene muchas grabaciones. Va a necesitar un tipo de ficha "obra", que conviene diseñar en esa etapa.
- **Podcasts:** los links de la versión anterior todavía no se migraron ni se verificaron.
