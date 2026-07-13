# English ChuchoIng (nombre provisional)

PWA de aprendizaje de inglés basada en lectura contextual: textos cortos,
palabras tocables que revelan su significado en español y preguntas de
comprensión con feedback inmediato.

## Stack

- HTML/CSS/JS vanilla (sin frameworks).
- PWA: `manifest.json` + service worker (`sw.js`, offline first).
- Lecciones en JSON local (`data/lessons.json`).

## Ejecutar en local

El service worker requiere servir los archivos por HTTP (no `file://`):

```bash
cd english-chuchoing
python3 -m http.server 8080
```

Luego abrir `http://localhost:8080`.

## Módulo 1 (MVP) — Pantalla de lectura

1. Elige una lección en la pantalla inicial.
2. Lee el texto en inglés; las palabras resaltadas en color acento son
   tocables: al tocarlas aparece un tooltip con su significado en español.
3. Pulsa **"Ya leí"** para responder 3–4 preguntas de comprensión.
4. Cada respuesta recibe feedback inmediato y al final se muestra el puntaje.

## Estructura de una lección

```json
{
  "id": "chucho-the-dog",
  "titulo": "Chucho the Dog",
  "nivel": "Básico",
  "texto": "Chucho is a small brown dog...",
  "palabras": [{ "en": "brown", "es": "café / marrón" }],
  "preguntas": [
    {
      "pregunta": "What color is Chucho?",
      "opciones": ["Black", "Brown", "White"],
      "correcta": 1
    }
  ]
}
```

- `palabras`: las palabras del texto que serán tocables (coincidencia sin
  distinguir mayúsculas ni puntuación).
- `correcta`: índice (base 0) de la opción correcta dentro de `opciones`.

Para agregar lecciones basta con añadir objetos al arreglo `lecciones` de
`data/lessons.json` (y subir la versión `CACHE` en `sw.js` para refrescar el
contenido cacheado).

## Diseño

- Paleta ChuchoIng Orange: `#FFFFFF`, `#F5F5F5`, `#D9D9D9`, `#1A3A52` (azul),
  `#A0522D` (acento), `#2C2C2C` (texto).
- Distribución 75-18-7 (neutros / azul / acento).
- Mobile first.
