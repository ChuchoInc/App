# Contexto de continuidad — Ingeniería de Software Firebase 2026

Este documento permite continuar el proyecto desde otro computador o desde un hilo nuevo de Codex sin depender del historial de la conversación original.

## 1. Propósito del aplicativo

Aplicación docente para organizar sesiones de clase virtual, publicar contenido, realizar actividades individuales o grupales y mantener a los estudiantes participando durante la clase.

El docente debe poder:

- Crear sesiones sin depender de una cantidad fija.
- Subir el contenido de cada sesión mediante un archivo HTML.
- Importar una cantidad variable de preguntas desde CSV o Excel.
- Crear actividades individuales o grupales.
- Configurar una actividad como tarea o actividad en vivo.
- En actividades en vivo, mostrar todas las preguntas o avanzar una pregunta a la vez.
- Cargar la respuesta correcta y una explicación junto con cada pregunta.
- Ver en tiempo real quién respondió, quién acertó, quién falló y quién falta.
- Cerrar respuestas antes de realizar la retroalimentación.
- Mantener oculto para el estudiante si acertó o falló, hasta que el docente decida revelar la solución.
- Recibir trabajos grupales con integrantes, porcentajes de participación, evidencias y observaciones.

El estudiante debe poder:

- Ingresar con Google.
- Consultar las sesiones publicadas.
- Responder actividades individuales o grupales.
- En una actividad guiada, ver solamente la pregunta activa.
- Recibir únicamente la confirmación de que su respuesta fue registrada.
- Esperar a que el docente habilite la siguiente pregunta.

## 2. Alcance acordado para la versión 0.1

- Sesiones configurables por el docente.
- Contenido HTML por sesión.
- Importación de preguntas con cantidad variable.
- Actividades individuales y grupales.
- Actividades tipo tarea y tipo en vivo.
- Ritmo guiado por el docente o avance libre.
- Preguntas de selección, verdadero/falso, respuesta corta y respuesta abierta.
- Corrección automática, manual o mixta.
- Apertura, cierre y navegación entre preguntas.
- Tablero docente de respuestas en tiempo real.
- Respuestas correctas protegidas y ocultas para estudiantes.
- Entregas grupales con participación por integrante.
- Exportación de resultados.

## 3. Referentes entregados por el docente

Se revisaron dos ejemplos funcionales pertenecientes a otra asignatura:

- `Google_Sheet_Sesion_4_GI_Gobierno_Datos_Cloud_CORREGIDA.xlsx`
- `Sesion_4_Gestion_Informacion_Gobierno_Datos_Cloud.html`

La hoja que trabajan los estudiantes en ese ejemplo es `PLANTILLA_S4`. Las otras hojas contienen instrucciones, grupos oficiales, listas auxiliares, recursos y control docente.

Estos archivos son referentes de funcionamiento. No deben copiarse literalmente sus nombres, grupos, temática ni preguntas al aplicativo de Ingeniería de Software. Se reutiliza la idea: contenido HTML, preguntas variables, participación y control docente.

Observación encontrada en el referente: las instrucciones mencionan el selector de grupo en `B5`, pero la plantilla lo tiene en `B4`.

## 4. Estado actual del código

El proyecto original ya incluía:

- React y Vite.
- Autenticación de Google con Firebase.
- Sesiones S1 a S5.
- Contenido HTML editable.
- Importación básica de preguntas CSV.
- Entregas con información del grupo y participación.
- Panel docente, calificación, retroalimentación y exportación CSV.

Durante el trabajo con Codex se agregó:

- Repositorio Git local.
- `.gitignore` para excluir `.env`, dependencias y archivos generados.
- Reglas de Firestore más estrictas.
- Colección `activities` para actividades en vivo.
- Colección `answerKeys` reservada para respuestas correctas y explicaciones.
- Colección `liveResponses` para respuestas individuales en vivo.
- Actividades guiadas por el docente o de avance libre.
- Controles para abrir, cerrar, retroceder y avanzar preguntas.
- Enlace independiente para cada actividad.
- Tablero docente con respuestas correctas, incorrectas y pendientes de revisión manual.
- Bloqueo de la respuesta del estudiante después del envío.
- Importación CSV con vista previa.
- Plantilla `templates/preguntas_en_vivo_ejemplo.csv`.
- Dependencias fijadas a versiones concretas en `package.json`.

Archivos principales:

- `src/main.jsx`: aplicación original, sesiones, entregas y panel docente.
- `src/LiveActivities.jsx`: experiencia docente y estudiantil para actividades en vivo.
- `src/lib/csv.js`: lectura y normalización de CSV.
- `src/lib/firebase.js`: configuración e inicialización de Firebase.
- `src/styles.css`: estilos generales y de actividades en vivo.
- `firestore.rules`: autorización y protección de datos.
- `README.md`: instrucciones generales.

## 5. Estado real y asuntos pendientes

El código del primer recorrido de actividades en vivo está escrito y fue compilado correctamente con Node.js `v24.17.0`, npm `11.13.0` y Vite `8.0.16`. La verificación transformó 38 módulos y generó el paquete de producción sin errores.

La instalación dentro de la carpeta sincronizada de Google Drive resultó excesivamente lenta por la cantidad de archivos de `node_modules`. La compilación se verificó con una copia temporal local. Para trabajar normalmente se recomienda clonar el repositorio de GitHub en una carpeta local, por ejemplo `C:\proyectos\ingenieria-software-firebase-2026`, y dejar GitHub como respaldo y mecanismo de sincronización.

El 19 de junio de 2026 se creó una copia local operativa en `C:\Users\Prsala312\Projects\ingenieria-software-firebase-2026`. Allí `npm install` y `npm run build` funcionan correctamente. PowerShell quedó configurado como `RemoteSigned` únicamente para el usuario actual, por lo que `npm` funciona sin privilegios de administrador. Firebase CLI `15.22.0` quedó instalado como dependencia de desarrollo del proyecto y puede ejecutarse con `npx firebase` o mediante `npm run deploy`.

Los accesos `INICIAR_APP.cmd` y `VERIFICAR_APP.cmd` permiten iniciar o compilar mediante doble clic y usan `npm.cmd`, evitando problemas con políticas de PowerShell.

Pendiente inmediato:

1. Probar el recorrido autenticado con una cuenta docente y una cuenta estudiante.
2. Cargar o sembrar las sesiones en Firestore; sin datos, S1 muestra “Sesión no disponible todavía”.
3. Publicar las nuevas reglas de Firestore antes de usar actividades en vivo.
4. Implementar lectura directa de archivos `.xlsx`; actualmente el nuevo importador en vivo acepta CSV.
5. Implementar carga directa de archivos HTML; el editor original todavía recibe HTML pegado en un campo.
6. Completar las modalidades grupales dentro del nuevo modelo de actividades.
7. Evitar o gestionar preguntas antiguas cuando se reemplaza una importación.
8. Agregar pruebas y manejo uniforme de errores.

No afirmar que la versión nueva está publicada hasta completar la compilación, las pruebas y el despliegue.

## 6. Modelo de datos introducido

### `activities/{activityId}`

- `sessionId`
- `title`
- `modality`: inicialmente `individual`
- `delivery`: inicialmente `live`
- `pace`: `teacher` o `self`
- `status`: `draft`, `open` o `closed`
- `currentQuestionNumber`
- `revealResults`

### `questions/{questionId}`

Datos visibles para usuarios autenticados:

- `activityId`
- `sessionId`
- `number`
- `type`
- `prompt`
- `description`
- `options`
- `required`
- `points`

### `answerKeys/{questionId}`

Solo el docente puede leer o escribir:

- `activityId`
- `questionId`
- `correctAnswer`
- `explanation`

La respuesta correcta no debe añadirse a `questions`, porque el navegador del estudiante podría inspeccionarla antes de la retroalimentación.

### `liveResponses/{responseId}`

- `activityId`
- `questionId`
- `questionNumber`
- `responderUid`
- `responderName`
- `responderEmail`
- `answer`
- `submittedAt`

El identificador combina actividad, usuario y pregunta para impedir múltiples respuestas a la misma pregunta. Las reglas no permiten que el estudiante modifique una respuesta ya enviada.

## 7. Formato CSV inicial para actividades en vivo

```csv
numero,tipo,pregunta,descripcion,opciones,respuesta_correcta,retroalimentacion,puntaje,obligatorio
1,seleccion,¿Pregunta?,Ayuda,Opción A|Opción B,Opción A,Explicación,1,Sí
```

Tipos iniciales:

- `seleccion`
- `verdadero_falso`
- `short`
- `paragraph`

Las opciones se separan con `|`. Una respuesta sin clave queda pendiente de revisión manual y no debe contarse como incorrecta automáticamente.

## 8. Instalación en un computador nuevo

### Programas necesarios

Instalar:

1. Git: <https://git-scm.com/downloads>
2. Node.js en versión LTS: <https://nodejs.org/>
3. Google Drive para escritorio, si se continuará usando la carpeta sincronizada: <https://www.google.com/drive/download/>
4. Codex y acceso con la misma cuenta de ChatGPT.

Comprobar en PowerShell:

```powershell
git --version
node --version
npm --version
```

### Obtener el proyecto

La opción recomendada es clonarlo desde GitHub:

```powershell
git clone https://github.com/USUARIO/NOMBRE-DEL-REPOSITORIO.git
cd NOMBRE-DEL-REPOSITORIO
```

Si todavía no está en GitHub, permitir que Google Drive termine de sincronizar la carpeta y abrir esa carpeta desde Codex.

### Configurar Firebase

El archivo `.env` no se guarda en GitHub. En el nuevo computador:

```powershell
Copy-Item .env.example .env
```

Revisar `.env` y completar las variables de Firebase y el correo administrador. El archivo original puede copiarse de manera privada desde el computador anterior; no debe enviarse a un repositorio público.

### Instalar y ejecutar

```powershell
npm install
npm run dev
```

Vite mostrará una dirección parecida a:

```text
http://localhost:5173
```

Abrirla en el navegador. Probar primero como docente y luego en una ventana privada con otra cuenta como estudiante.

### Verificar la compilación

```powershell
npm run build
```

La compilación correcta debe crear la carpeta `dist` sin errores.

### Instalar Firebase CLI y publicar

```powershell
npm install -g firebase-tools
firebase login
npm run deploy
```

El despliegue definido publica Firebase Hosting y las reglas de Firestore. Antes de hacerlo, revisar que `.firebaserc` apunte al proyecto Firebase correcto.

## 9. Crear una copia en GitHub

El repositorio Git local ya fue inicializado, pero aún no tiene un repositorio remoto ni un primer commit confirmado.

### Crear el repositorio remoto

1. Entrar a <https://github.com/new>.
2. Escribir un nombre, por ejemplo `ingenieria-software-firebase-2026`.
3. Elegir repositorio privado mientras el proyecto está en desarrollo.
4. No seleccionar README, `.gitignore` ni licencia, porque el proyecto ya contiene archivos.
5. Presionar **Create repository**.

### Registrar la primera versión

En PowerShell, dentro de la carpeta del proyecto:

```powershell
git status
git add .
git commit -m "Primera versión del aplicativo docente"
git branch -M main
git remote add origin https://github.com/USUARIO/ingenieria-software-firebase-2026.git
git push -u origin main
```

Reemplazar `USUARIO` y el nombre del repositorio. GitHub puede pedir autenticación mediante navegador o token.

Antes de `git push`, comprobar que `.env` no aparezca en `git status`. Está excluido por `.gitignore`.

### Guardar cambios posteriores

Después de cada avance estable:

```powershell
git status
git add .
git commit -m "Descripción breve del cambio"
git push
```

En otro computador, antes de trabajar:

```powershell
git pull
```

No trabajar simultáneamente sobre los mismos archivos en dos computadores sin hacer `git push` en uno y `git pull` en el otro.

## 10. Instrucción sugerida para un hilo nuevo de Codex

```text
Lee por completo CONTEXTO_CODEX.md, README.md, package.json, firestore.rules y los archivos de src. Continúa el proyecto desde su estado actual. Primero instala dependencias, ejecuta npm run build y corrige los errores sin eliminar funcionalidades existentes. Después prueba el recorrido de una actividad en vivo como docente y estudiante. No publiques ni despliegues hasta informarme los resultados de las pruebas.
```

## 11. Prioridad recomendada para continuar

1. Lograr `npm install` y `npm run build`.
2. Probar localmente la actividad en vivo.
3. Corregir cualquier problema de reglas o interfaz.
4. Añadir importación Excel.
5. Añadir carga directa del HTML.
6. Completar actividades y trabajos grupales.
7. Desplegar una versión de prueba.
