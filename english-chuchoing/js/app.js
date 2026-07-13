/* English ChuchoIng — Módulo 1: lectura contextual con palabras tocables
   y preguntas de comprensión. Vanilla JS, sin dependencias. */

(function () {
  "use strict";

  var lecciones = [];
  var leccionActual = null;

  // --- Referencias al DOM ---
  var $ = function (id) { return document.getElementById(id); };

  var vistas = {
    home: $("view-home"),
    reading: $("view-reading"),
    quiz: $("view-quiz")
  };

  var btnBack = $("btn-back");
  var tooltip = $("tooltip");
  var tooltipEn = $("tooltip-en");
  var tooltipEs = $("tooltip-es");

  // --- Navegación entre vistas ---

  function mostrarVista(nombre) {
    Object.keys(vistas).forEach(function (k) {
      vistas[k].hidden = k !== nombre;
    });
    btnBack.hidden = nombre === "home";
    ocultarTooltip();
    window.scrollTo(0, 0);
  }

  btnBack.addEventListener("click", function () {
    if (!vistas.quiz.hidden) {
      abrirLectura(leccionActual);
    } else {
      mostrarVista("home");
    }
  });

  // --- Carga de lecciones ---

  function cargarLecciones() {
    fetch("data/lessons.json")
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        lecciones = data.lecciones || [];
        renderHome();
      })
      .catch(function () {
        $("lesson-list").innerHTML =
          '<li class="home-intro">No se pudieron cargar las lecciones. ' +
          "Revisa tu conexión e intenta de nuevo.</li>";
      });
  }

  function renderHome() {
    var lista = $("lesson-list");
    lista.innerHTML = "";
    lecciones.forEach(function (leccion) {
      var li = document.createElement("li");
      var card = document.createElement("button");
      card.className = "lesson-card";
      card.type = "button";

      var h3 = document.createElement("h3");
      h3.textContent = leccion.titulo;

      var meta = document.createElement("span");
      meta.className = "lesson-meta";
      meta.textContent =
        (leccion.nivel ? leccion.nivel + " · " : "") +
        leccion.palabras.length + " palabras nuevas · " +
        leccion.preguntas.length + " preguntas";

      card.appendChild(h3);
      card.appendChild(meta);
      card.addEventListener("click", function () {
        abrirLectura(leccion);
      });
      li.appendChild(card);
      lista.appendChild(li);
    });
  }

  // --- Vista de lectura ---

  function abrirLectura(leccion) {
    leccionActual = leccion;
    $("reading-title").textContent = leccion.titulo;
    renderTexto(leccion);
    mostrarVista("reading");
  }

  function normalizar(palabra) {
    return palabra.toLowerCase().replace(/[^a-z']/g, "");
  }

  function renderTexto(leccion) {
    var contenedor = $("reading-text");
    contenedor.innerHTML = "";

    var mapa = {};
    leccion.palabras.forEach(function (p) {
      mapa[normalizar(p.en)] = p;
    });

    // Separa el texto en palabras y espacios/puntuación, conservándolos.
    var tokens = leccion.texto.split(/(\s+)/);

    tokens.forEach(function (token) {
      if (/^\s*$/.test(token)) {
        contenedor.appendChild(document.createTextNode(token));
        return;
      }
      // Separa la puntuación pegada a la palabra ("bowl." → "bowl" + ".")
      var m = token.match(/^([^A-Za-z']*)([A-Za-z'][A-Za-z'-]*)?(.*)$/);
      var antes = m[1] || "";
      var palabra = m[2] || "";
      var despues = m[3] || "";

      if (antes) contenedor.appendChild(document.createTextNode(antes));

      var entrada = palabra && mapa[normalizar(palabra)];
      if (entrada) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "word";
        btn.textContent = palabra;
        btn.setAttribute("aria-label", palabra + ", ver significado");
        btn.addEventListener("click", function (ev) {
          ev.stopPropagation();
          mostrarTooltip(btn, entrada);
        });
        contenedor.appendChild(btn);
      } else if (palabra) {
        contenedor.appendChild(document.createTextNode(palabra));
      }

      if (despues) contenedor.appendChild(document.createTextNode(despues));
    });
  }

  // --- Tooltip ---

  var palabraActiva = null;

  function mostrarTooltip(btn, entrada) {
    if (palabraActiva === btn && !tooltip.hidden) {
      ocultarTooltip();
      return;
    }
    ocultarTooltip();

    tooltipEn.textContent = entrada.en;
    tooltipEs.textContent = entrada.es;
    tooltip.hidden = false;

    btn.classList.add("active", "seen");
    palabraActiva = btn;

    var rect = btn.getBoundingClientRect();
    var margen = 8;
    var top = rect.top + window.scrollY - tooltip.offsetHeight - margen;
    var left =
      rect.left + window.scrollX + rect.width / 2 - tooltip.offsetWidth / 2;

    // Mantener dentro de la pantalla
    var minLeft = 8;
    var maxLeft = document.documentElement.clientWidth - tooltip.offsetWidth - 8;
    left = Math.max(minLeft, Math.min(left, maxLeft));

    // Flecha apuntando a la palabra aunque el tooltip se haya desplazado
    var arrowX = rect.left + window.scrollX + rect.width / 2 - left;
    arrowX = Math.max(12, Math.min(arrowX, tooltip.offsetWidth - 12));
    tooltip.style.setProperty("--arrow-x", arrowX + "px");

    tooltip.style.top = top + "px";
    tooltip.style.left = left + "px";
  }

  function ocultarTooltip() {
    tooltip.hidden = true;
    if (palabraActiva) {
      palabraActiva.classList.remove("active");
      palabraActiva = null;
    }
  }

  document.addEventListener("click", function (ev) {
    if (!ev.target.closest(".word")) ocultarTooltip();
  });
  window.addEventListener("scroll", ocultarTooltip, { passive: true });

  // --- Preguntas de comprensión ---

  $("btn-done").addEventListener("click", function () {
    abrirQuiz(leccionActual);
  });

  function abrirQuiz(leccion) {
    $("quiz-title").textContent = leccion.titulo;
    $("quiz-result").hidden = true;

    var total = leccion.preguntas.length;
    var respondidas = 0;
    var aciertos = 0;

    var progreso = $("quiz-progress");
    progreso.textContent = "0 de " + total + " respondidas";

    var contenedor = $("quiz-questions");
    contenedor.innerHTML = "";

    leccion.preguntas.forEach(function (q, i) {
      var card = document.createElement("div");
      card.className = "question-card";

      var h3 = document.createElement("h3");
      h3.textContent = (i + 1) + ". " + q.pregunta;
      card.appendChild(h3);

      var opciones = document.createElement("div");
      opciones.className = "options";

      var feedback = document.createElement("p");
      feedback.className = "feedback";
      feedback.hidden = true;

      q.opciones.forEach(function (texto, idx) {
        var opt = document.createElement("button");
        opt.type = "button";
        opt.className = "option";
        opt.textContent = texto;

        opt.addEventListener("click", function () {
          // Feedback inmediato y se bloquea la pregunta
          var botones = opciones.querySelectorAll(".option");
          botones.forEach(function (b) { b.disabled = true; });

          var esCorrecta = idx === q.correcta;
          if (esCorrecta) {
            opt.classList.add("correct");
            feedback.textContent = "¡Correcto! ✓";
            feedback.className = "feedback ok";
            aciertos++;
          } else {
            opt.classList.add("incorrect");
            botones[q.correcta].classList.add("correct");
            feedback.textContent =
              "Incorrecto. La respuesta era: " + q.opciones[q.correcta];
            feedback.className = "feedback fail";
          }
          feedback.hidden = false;

          respondidas++;
          progreso.textContent = respondidas + " de " + total + " respondidas";
          if (respondidas === total) {
            mostrarResultado(aciertos, total);
          }
        });

        opciones.appendChild(opt);
      });

      card.appendChild(opciones);
      card.appendChild(feedback);
      contenedor.appendChild(card);
    });

    mostrarVista("quiz");
  }

  function mostrarResultado(aciertos, total) {
    $("quiz-score").textContent = aciertos + " / " + total;
    var mensaje;
    if (aciertos === total) {
      mensaje = "¡Excelente! Entendiste todo el texto. \u{1F31F}";
    } else if (aciertos >= total / 2) {
      mensaje = "¡Bien hecho! Vuelve a leer para mejorar. \u{1F44D}";
    } else {
      mensaje = "No te preocupes: relee el texto y toca las palabras que no conozcas. \u{1F4AA}";
    }
    $("quiz-message").textContent = mensaje;
    $("quiz-result").hidden = false;
    $("quiz-result").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  $("btn-reread").addEventListener("click", function () {
    abrirLectura(leccionActual);
  });

  $("btn-home").addEventListener("click", function () {
    mostrarVista("home");
  });

  // --- PWA: service worker y estado offline ---

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function (err) {
        console.warn("Service worker no registrado:", err);
      });
    });
  }

  var badge = $("offline-badge");
  function actualizarConexion() {
    badge.hidden = navigator.onLine;
  }
  window.addEventListener("online", actualizarConexion);
  window.addEventListener("offline", actualizarConexion);
  actualizarConexion();

  // --- Inicio ---
  cargarLecciones();
})();
