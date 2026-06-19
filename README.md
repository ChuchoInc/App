# Ingeniería de Software 2026 - MVP Firebase

Aplicación inicial para manejar sesiones, preguntas, entregas, participación por integrante y evaluación docente.

## Funciones incluidas

- React + Vite.
- Firebase Authentication con Google.
- Firestore para sesiones, preguntas, grupos/entregas y notas.
- Panel docente restringido al correo `elkit.com@gmail.com`.
- Sesiones fijas S1 a S5 con contenido HTML editable.
- Importación de preguntas por CSV.
- Formulario de respuesta por sesión.
- Participación por integrante: nombre, correo, aporte, % y observación.
- Revisión docente, nota y retroalimentación.
- Exportación básica de entregas en CSV.
- Actividades en vivo guiadas por el docente o de avance libre.
- Respuestas correctas protegidas y tablero docente en tiempo real.

## Requisitos previos

- Node.js instalado.
- Firebase CLI instalada.
- Proyecto Firebase creado: `ingenieriasoftware2026junio`.
- Authentication > Sign-in method > Google habilitado.
- Firestore creado en modo producción o prueba, luego publicar reglas.
- Hosting habilitado.

## Instalación local

```bash
npm install
npm run dev
```

La app abrirá en una URL local tipo `http://localhost:5173`.

## Configuración

El archivo `.env` ya incluye la configuración entregada. Si desea cambiar algo, edite:

```bash
.env
```

Variables usadas:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_ADMIN_EMAIL=elkit.com@gmail.com
```

## Primer uso

1. Entre con Google usando el correo administrador: `elkit.com@gmail.com`.
2. Abra `#/admin`.
3. Clic en **Crear/actualizar sesiones base**.
4. Seleccione S1.
5. Pegue el HTML real de la sesión S1.
6. Importe preguntas desde `templates/preguntas_s1_ejemplo.csv` o desde su propio CSV.
7. Active **Publicar sesión**.
8. Comparta el enlace de la sesión:

```text
https://ingenieriasoftware2026junio.web.app/#/sesion/S1
```

## Formato CSV para preguntas

```csv
sesion,numero,tipo,pregunta,descripcion,obligatorio,puntaje,criterio
S1,1,parrafo,¿Qué es la crisis del software?,Explique...,Sí,1,Comprensión
```

Campos:

- `sesion`: S1, S2, S3, S4 o S5.
- `numero`: número de la pregunta.
- `tipo`: por ahora usar `parrafo`.
- `pregunta`: enunciado.
- `descripcion`: ayuda o instrucción.
- `obligatorio`: Sí / No.
- `puntaje`: valor numérico.
- `criterio`: comprensión, análisis, proyecto, etc.

## Actividades en vivo

Desde el panel docente, seleccione una sesión y cree una actividad. Puede configurarla como guiada por el docente —una pregunta a la vez— o mostrar todas las preguntas.

Formato CSV:

```csv
numero,tipo,pregunta,descripcion,opciones,respuesta_correcta,retroalimentacion,puntaje,obligatorio
1,seleccion,¿Pregunta?,Ayuda,Opción A|Opción B,Opción A,Explicación,1,Sí
```

Tipos iniciales: `seleccion`, `verdadero_falso`, `short` y `paragraph`. Las opciones se separan con `|`. Use `templates/preguntas_en_vivo_ejemplo.csv` como punto de partida.

La clave y la retroalimentación se guardan en `answerKeys`, una colección que las reglas de Firestore reservan para el docente. El estudiante solo recibe confirmación de que su respuesta fue registrada.

## Despliegue en Firebase Hosting

Inicie sesión:

```bash
firebase login
```

Despliegue:

```bash
npm run deploy
```

La app quedará en:

```text
https://ingenieriasoftware2026junio.web.app/
```

## Notas importantes

- La clave API de Firebase en una app web no es una contraseña privada; queda visible en el cliente. La protección real depende de Authentication, Firestore Security Rules y dominios autorizados.
- Revise en Firebase Authentication que estén autorizados los dominios `localhost` y `ingenieriasoftware2026junio.web.app`.
- Las reglas de Firestore incluidas protegen el panel docente y limitan la edición de entregas.
- Este es un MVP inicial. No incluye subida de archivos pesados; para evidencias se recomienda usar enlaces de Drive o YouTube.
