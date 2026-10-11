// =============================================================================
// MSN GAMES - PIZARRA COMPARTIDA RETRO (PICTIONARY NETMEETING / MSN)
// =============================================================================

(function() {
  const SECRET_WORDS = [
    "Pingüino", "Cerdito", "Tarta", "Pizza", "Guitarra", "Corazón", "Sol", "Luna",
    "Flor", "Coche", "Avión", "Barco", "Casa", "Árbol", "Helado", "Gato",
    "Perro", "Reloj", "Estrella", "Nube", "Plátano", "Manzana", "Regalo", "Pez",
    "Paraguas", "Sombrero", "Pelota", "Taza", "Teléfono", "Bicicleta", "Corona", "Vela",
    "Gafas", "Mariposa", "Globo", "Queso", "Libro", "Cuchara", "Cámara", "Zapato"
  ];

  // Bocetos animados para cuando Chimpi dibuja en modo solitario
  const CHIMPI_DOODLES = {
    "Sol": [
      // Círculo central
      { x0: 160, y0: 120, x1: 190, y1: 135, c: '#f1c40f', s: 4 },
      { x0: 190, y0: 135, x1: 200, y1: 160, c: '#f1c40f', s: 4 },
      { x0: 200, y0: 160, x1: 190, y1: 190, c: '#f1c40f', s: 4 },
      { x0: 190, y0: 190, x1: 160, y1: 200, c: '#f1c40f', s: 4 },
      { x0: 160, y0: 200, x1: 130, y1: 190, c: '#f1c40f', s: 4 },
      { x0: 130, y0: 190, x1: 120, y1: 160, c: '#f1c40f', s: 4 },
      { x0: 120, y0: 160, x1: 130, y1: 135, c: '#f1c40f', s: 4 },
      { x0: 130, y0: 135, x1: 160, y1: 120, c: '#f1c40f', s: 4 },
      // Rayos
      { x0: 160, y0: 110, x1: 160, y1: 80, c: '#f39c12', s: 4 },
      { x0: 160, y0: 210, x1: 160, y1: 240, c: '#f39c12', s: 4 },
      { x0: 110, y0: 160, x1: 80, y1: 160, c: '#f39c12', s: 4 },
      { x0: 210, y0: 160, x1: 240, y1: 160, c: '#f39c12', s: 4 },
      { x0: 125, y0: 125, x1: 100, y1: 100, c: '#f39c12', s: 4 },
      { x0: 195, y0: 125, x1: 220, y1: 100, c: '#f39c12', s: 4 },
      { x0: 125, y0: 195, x1: 100, y1: 220, c: '#f39c12', s: 4 },
      { x0: 195, y0: 195, x1: 220, y1: 220, c: '#f39c12', s: 4 }
    ],
    "Casa": [
      // Base cuadrada
      { x0: 110, y0: 150, x1: 210, y1: 150, c: '#0984e3', s: 4 },
      { x0: 210, y0: 150, x1: 210, y1: 250, c: '#0984e3', s: 4 },
      { x0: 210, y0: 250, x1: 110, y1: 250, c: '#0984e3', s: 4 },
      { x0: 110, y0: 250, x1: 110, y1: 150, c: '#0984e3', s: 4 },
      // Tejado triangular
      { x0: 95, y0: 150, x1: 160, y1: 90, c: '#e74c3c', s: 4 },
      { x0: 160, y0: 90, x1: 225, y1: 150, c: '#e74c3c', s: 4 },
      // Puerta y ventana
      { x0: 145, y0: 250, x1: 145, y1: 200, c: '#2d3436', s: 4 },
      { x0: 145, y0: 200, x1: 175, y1: 200, c: '#2d3436', s: 4 },
      { x0: 175, y0: 200, x1: 175, y1: 250, c: '#2d3436', s: 4 },
      { x0: 175, y0: 170, x1: 195, y1: 170, c: '#f1c40f', s: 3 },
      { x0: 195, y0: 170, x1: 195, y1: 190, c: '#f1c40f', s: 3 },
      { x0: 195, y0: 190, x1: 175, y1: 190, c: '#f1c40f', s: 3 },
      { x0: 175, y0: 190, x1: 175, y1: 170, c: '#f1c40f', s: 3 }
    ],
    "Corazón": [
      { x0: 160, y0: 130, x1: 130, y1: 95, c: '#e74c3c', s: 5 },
      { x0: 130, y0: 95, x1: 100, y1: 110, c: '#e74c3c', s: 5 },
      { x0: 100, y0: 110, x1: 95, y1: 145, c: '#e74c3c', s: 5 },
      { x0: 95, y0: 145, x1: 160, y1: 235, c: '#e74c3c', s: 5 },
      { x0: 160, y0: 130, x1: 190, y1: 95, c: '#e74c3c', s: 5 },
      { x0: 190, y0: 95, x1: 220, y1: 110, c: '#e74c3c', s: 5 },
      { x0: 220, y0: 110, x1: 225, y1: 145, c: '#e74c3c', s: 5 },
      { x0: 225, y0: 145, x1: 160, y1: 235, c: '#e74c3c', s: 5 }
    ],
    "Árbol": [
      // Tronco
      { x0: 150, y0: 250, x1: 150, y1: 170, c: '#795548', s: 6 },
      { x0: 170, y0: 250, x1: 170, y1: 170, c: '#795548', s: 6 },
      // Copa
      { x0: 160, y0: 170, x1: 110, y1: 155, c: '#2ecc71', s: 5 },
      { x0: 110, y0: 155, x1: 105, y1: 115, c: '#2ecc71', s: 5 },
      { x0: 105, y0: 115, x1: 135, y1: 85, c: '#2ecc71', s: 5 },
      { x0: 135, y0: 85, x1: 185, y1: 85, c: '#2ecc71', s: 5 },
      { x0: 185, y0: 85, x1: 215, y1: 115, c: '#2ecc71', s: 5 },
      { x0: 215, y0: 115, x1: 210, y1: 155, c: '#2ecc71', s: 5 },
      { x0: 210, y0: 155, x1: 160, y1: 170, c: '#2ecc71', s: 5 }
    ]
  };

  let isLiveGame = false;
  let isChimpiRole = false;

  // Estado de roles por turnos alternos
  let roundNumber = 1;
  let currentDrawer = 'PINCHI'; // 'PINCHI' (dibuja Pinchi) o 'CHIMPI' (dibuja Chimpi)
  let isDrawer = true; // Booleano para el usuario local

  let currentWord = "";
  let timeLeft = 60;
  let timerInterval = null;
  let botActionTimer = null;
  let currentColor = "#000000";
  let brushSize = 4;
  let isEraser = false;
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;

  function getConnection() {
    return (window.liveChimpi && window.liveChimpi.conn && window.liveChimpi.conn.open)
      ? window.liveChimpi.conn
      : (window._liveConnection && window._liveConnection.open ? window._liveConnection : null);
  }

  function pickNewWord() {
    const idx = Math.floor(Math.random() * SECRET_WORDS.length);
    return SECRET_WORDS[idx];
  }

  function openWhiteboardGame(forceSolo) {
    if (typeof closeGameModal === 'function') closeGameModal(true);

    const modal = window.gameModal || document.getElementById('gameModal');
    const title = window.gameTitle || document.getElementById('gameTitle');
    const content = window.gameContent || document.getElementById('gameContent');

    if (title) title.innerHTML = '🎨 MSN Games - Pizarra de NetMeeting: Dibuja y Adivina';

    const conn = getConnection();
    isLiveGame = !forceSolo && !!conn;
    isChimpiRole = !!window._isChimpiMode;
    window._activeLiveGame = isLiveGame ? 'Pizarra MSN' : null;

    // Resetear a Ronda 1 inicial: Pinchi empieza dibujando (o se alterna)
    roundNumber = 1;
    currentDrawer = 'PINCHI';
    currentWord = pickNewWord();

    clearTimers();
    window._activeGameCleanup = clearTimers;

    renderWhiteboardUI();

    if (modal) modal.style.display = 'flex';
  }

  function clearTimers() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    if (botActionTimer) { clearInterval(botActionTimer); clearTimeout(botActionTimer); botActionTimer = null; }
  }

  // Renderizar o refrescar toda la interfaz de la ronda
  function renderWhiteboardUI() {
    clearTimers();

    // Determinar si el usuario local dibuja en esta ronda
    if (isLiveGame) {
      isDrawer = isChimpiRole ? (currentDrawer === 'CHIMPI') : (currentDrawer === 'PINCHI');
    } else {
      // Modo solitario:
      // Cuando currentDrawer === 'PINCHI', dibuja el usuario local (Pinchi).
      // Cuando currentDrawer === 'CHIMPI', dibuja Chimpi (la IA simula trazos y tú adivinas).
      isDrawer = (currentDrawer === 'PINCHI');
    }

    const drawerName = currentDrawer === 'PINCHI' ? 'Pinchi 🐧' : 'Chimpi 🐷';
    const guesserName = currentDrawer === 'PINCHI' ? 'Chimpi 🐷' : 'Pinchi 🐧';

    const content = window.gameContent || document.getElementById('gameContent');
    if (!content) return;

    content.innerHTML = `
      <style>
        .wb-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 340px;
          margin: 0 auto;
          user-select: none;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .wb-round-badge {
          width: 320px;
          background: #f1f2f6;
          border: 1px solid #ced6e0;
          border-radius: 6px;
          padding: 4px 8px;
          font-size: 11px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;
          box-sizing: border-box;
        }
        .wb-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #dcdde1;
          border: 2px solid #718093;
          border-bottom: none;
          width: 320px;
          padding: 4px 6px;
          box-sizing: border-box;
          border-radius: 6px 6px 0 0;
          gap: 4px;
        }
        .wb-tool-btn {
          background: #f5f6fa;
          border: 1px solid #7f8fa6;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 13px;
          cursor: pointer;
        }
        .wb-tool-btn.active {
          background: #0078d7;
          color: #fff;
          border-color: #004a9f;
        }
        .wb-colors {
          display: flex;
          gap: 4px;
        }
        .wb-color-swatch {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 1.5px solid #fff;
          box-shadow: 0 0 2px rgba(0,0,0,0.5);
          cursor: pointer;
        }
        .wb-color-swatch.active {
          outline: 2px solid #0078d7;
        }
        .wb-canvas-frame {
          border: 2px solid #718093;
          background: #ffffff;
          width: 320px;
          height: 320px;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.15);
          touch-action: none;
          position: relative;
        }
        .wb-canvas {
          display: block;
          width: 320px;
          height: 320px;
          cursor: crosshair;
        }
        .wb-info-bar {
          width: 320px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          font-weight: bold;
          padding: 4px 2px;
          margin-top: 4px;
          box-sizing: border-box;
        }
        .wb-guess-box {
          display: flex;
          gap: 6px;
          width: 320px;
          margin-top: 6px;
        }
        .wb-guess-input {
          flex: 1;
          padding: 6px 8px;
          border: 2px solid #0078d7;
          border-radius: 6px;
          font-size: 13px;
        }
      </style>

      <div class="wb-container">
        <div class="wb-round-badge">
          <span><b>Ronda ${roundNumber}:</b> 🎨 Dibuja: <b>${drawerName}</b></span>
          <span style="color:#0078d7;">👀 Adivina: <b>${guesserName}</b></span>
        </div>

        <div class="wb-info-bar">
          <span id="wbRoleStatus" style="color:#0078d7;">
            ${isDrawer 
              ? `✏️ Tu palabra: <b>"${currentWord}"</b>` 
              : `👀 Adivina qué dibuja <b>${drawerName}</b>:`}
          </span>
          <span id="wbTimer" style="color:#e84118;">⏳ 60s</span>
        </div>

        <div class="wb-toolbar" id="wbToolbar" style="${isDrawer ? '' : 'pointer-events:none;opacity:0.4;'}">
          <button class="wb-tool-btn active" id="wbPenBtn" title="Lápiz">✏️</button>
          <button class="wb-tool-btn" id="wbEraserBtn" title="Goma">🧽</button>
          <div class="wb-colors">
            <div class="wb-color-swatch active" data-color="#000000" style="background:#000000;"></div>
            <div class="wb-color-swatch" data-color="#e74c3c" style="background:#e74c3c;"></div>
            <div class="wb-color-swatch" data-color="#0984e3" style="background:#0984e3;"></div>
            <div class="wb-color-swatch" data-color="#2ecc71" style="background:#2ecc71;"></div>
            <div class="wb-color-swatch" data-color="#f1c40f" style="background:#f1c40f;"></div>
            <div class="wb-color-swatch" data-color="#fd79a8" style="background:#fd79a8;"></div>
          </div>
          <button class="wb-tool-btn" id="wbClearBtn" title="Borrar todo">🗑️</button>
        </div>

        <div class="wb-canvas-frame">
          <canvas class="wb-canvas" id="wbCanvas" width="320" height="320"></canvas>
        </div>

        <div class="wb-guess-box" id="wbGuessBox" style="${isDrawer ? 'display:none;' : 'display:flex;'}">
          <input type="text" class="wb-guess-input" id="wbGuessInput" placeholder="Escribe tu respuesta aquí...">
          <button class="msn-game-launch-btn" style="padding:6px 12px;font-size:12px;" onclick="window.submitWhiteboardGuess()">
            Enviar 🚀
          </button>
        </div>

        <div id="wbResultMsg" style="font-size:12px;font-weight:bold;color:#28a745;margin-top:6px;min-height:18px;text-align:center;"></div>

        <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
          <button class="msn-game-launch-btn" style="padding:5px 12px;font-size:12px;" onclick="window.newWhiteboardRound()">
            🔄 Siguiente Ronda (Cambiar Roles)
          </button>
          ${typeof hubBackBtnHtml === 'function' ? hubBackBtnHtml() : ''}
        </div>
      </div>
    `;

    setupCanvas();
    setupToolbar();
    startTimer();

    // Comportamiento del bot en modo solitario
    if (!isLiveGame) {
      if (currentDrawer === 'CHIMPI') {
        // Chimpi es el dibujante bot: animar trazos en la pizarra
        startChimpiBotDrawing();
      } else {
        // Pinchi es el dibujante humano: Chimpi bot va adivinando de fondo
        startChimpiBotGuessing();
      }
    }
  }

  // ===========================================================================
  // SIMULACIÓN DE CHIMPI EN MODO SOLITARIO (DIBUJANDO O ADIVINANDO)
  // ===========================================================================
  function startChimpiBotDrawing() {
    const doodleKeys = Object.keys(CHIMPI_DOODLES);
    let chosenKey = doodleKeys.find(k => k.toLowerCase() === currentWord.toLowerCase());
    if (!chosenKey) {
      chosenKey = doodleKeys[Math.floor(Math.random() * doodleKeys.length)];
      currentWord = chosenKey; // ajustar a un dibujo visible
    }

    const strokes = CHIMPI_DOODLES[chosenKey] || [];
    let strokeIdx = 0;

    const res = document.getElementById('wbResultMsg');
    if (res) res.textContent = "Chimpi: ¡Allá voy! A ver si adivinas qué estoy dibujando... 🐷✏️";

    botActionTimer = setInterval(() => {
      if (strokeIdx >= strokes.length) {
        clearInterval(botActionTimer);
        botActionTimer = null;
        return;
      }
      const st = strokes[strokeIdx];
      drawLine(st.x0, st.y0, st.x1, st.y1, st.c, st.s);
      playPencilSound();
      strokeIdx++;
    }, 700);
  }

  function startChimpiBotGuessing() {
    let guessStep = 0;
    const botGuesses = [
      "Chimpi: Hummm... parece algo redondo... ¿será una pelota? 🐷",
      "Chimpi: Oinss... no sé si es una tarta o una casa... 🤔",
      "Chimpi: ¡Calculando con mi hocico detective...!"
    ];

    botActionTimer = setInterval(() => {
      guessStep++;
      const res = document.getElementById('wbResultMsg');

      if (guessStep === 1 && res) {
        res.style.color = '#e67e22';
        res.textContent = botGuesses[Math.floor(Math.random() * botGuesses.length)];
      } else if (guessStep === 2 && res) {
        res.style.color = '#e67e22';
        res.textContent = `Chimpi: ¡Casi lo tengo! ¿Tiene que ver con "${currentWord.slice(0, 2)}..."? 🐽`;
      } else if (guessStep >= 3) {
        clearInterval(botActionTimer);
        botActionTimer = null;
        // Chimpi acierta la palabra
        checkGuess(currentWord);
      }
    }, 12000); // va soltando ocurrencias cada 12s
  }

  // ===========================================================================
  // TEMPORIZADOR Y FINALIZACIÓN DE RONDA
  // ===========================================================================
  function startTimer() {
    clearInterval(timerInterval);
    timeLeft = 60;
    const tElem = document.getElementById('wbTimer');
    if (tElem) tElem.textContent = `⏳ ${timeLeft}s`;

    timerInterval = setInterval(() => {
      timeLeft--;
      const el = document.getElementById('wbTimer');
      if (el) el.textContent = `⏳ ${timeLeft}s`;
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        handleTimeUp();
      }
    }, 1000);
  }

  function handleTimeUp() {
    clearTimers();
    const res = document.getElementById('wbResultMsg');
    if (res) {
      res.style.color = '#e74c3c';
      res.textContent = `⏰ ¡Tiempo agotado! La palabra era: "${currentWord}". Cambiando de turno...`;
    }
    if (typeof playRetroTone === 'function') playRetroTone(220, 'sawtooth', 0.25);

    setTimeout(() => {
      window.nextWhiteboardRound();
    }, 3000);
  }

  // ===========================================================================
  // LIENZO Y DIBUJO TÁCTIL / RATÓN
  // ===========================================================================
  function setupCanvas() {
    const canvas = document.getElementById('wbCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    function getCoords(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    }

    function onStart(e) {
      if (!isDrawer) return;
      isDrawing = true;
      const pos = getCoords(e);
      lastX = pos.x;
      lastY = pos.y;
      playPencilSound();
    }

    function onMove(e) {
      if (!isDrawing || !isDrawer) return;
      e.preventDefault();
      const pos = getCoords(e);
      const color = isEraser ? '#ffffff' : currentColor;
      const size = isEraser ? 14 : brushSize;

      drawLine(lastX, lastY, pos.x, pos.y, color, size);

      // Enviar coordenadas normalizadas de 0 a 1000 por WebRTC
      if (isLiveGame) {
        const conn = getConnection();
        if (conn) {
          try {
            conn.send({
              type: 'WB_DRAW',
              x0: Math.round((lastX / 320) * 1000),
              y0: Math.round((lastY / 320) * 1000),
              x1: Math.round((pos.x / 320) * 1000),
              y1: Math.round((pos.y / 320) * 1000),
              color: color,
              size: size
            });
          } catch (err) {}
        }
      }

      lastX = pos.x;
      lastY = pos.y;
    }

    function onEnd() {
      isDrawing = false;
    }

    canvas.onmousedown = onStart;
    canvas.onmousemove = onMove;
    window.onmouseup = onEnd;

    canvas.ontouchstart = onStart;
    canvas.ontouchmove = onMove;
    canvas.ontouchend = onEnd;
  }

  function drawLine(x0, y0, x1, y1, color, size) {
    const canvas = document.getElementById('wbCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }

  function playPencilSound() {
    try {
      const ctx = window.retroAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.03, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
      noise.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch (e) {}
  }

  function setupToolbar() {
    const penBtn = document.getElementById('wbPenBtn');
    const eraserBtn = document.getElementById('wbEraserBtn');
    const clearBtn = document.getElementById('wbClearBtn');
    const swatches = document.querySelectorAll('.wb-color-swatch');

    if (penBtn) {
      penBtn.onclick = () => {
        isEraser = false;
        penBtn.classList.add('active');
        if (eraserBtn) eraserBtn.classList.remove('active');
      };
    }
    if (eraserBtn) {
      eraserBtn.onclick = () => {
        isEraser = true;
        eraserBtn.classList.add('active');
        if (penBtn) penBtn.classList.remove('active');
      };
    }
    if (clearBtn) {
      clearBtn.onclick = () => {
        clearCanvas();
        if (isLiveGame) {
          const conn = getConnection();
          if (conn) try { conn.send({ type: 'WB_CLEAR' }); } catch (e) {}
        }
      };
    }
    swatches.forEach(s => {
      s.onclick = () => {
        swatches.forEach(x => x.classList.remove('active'));
        s.classList.add('active');
        currentColor = s.getAttribute('data-color');
        isEraser = false;
        if (penBtn) penBtn.classList.add('active');
        if (eraserBtn) eraserBtn.classList.remove('active');
      };
    });
  }

  function clearCanvas() {
    const canvas = document.getElementById('wbCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // ===========================================================================
  // SISTEMA DE ADIVINANZA Y CAMBIO DE ROLES
  // ===========================================================================
  window.submitWhiteboardGuess = function() {
    const input = document.getElementById('wbGuessInput');
    if (!input) return;
    const guess = input.value.trim();
    if (!guess) return;
    input.value = '';

    checkGuess(guess);

    if (isLiveGame) {
      const conn = getConnection();
      if (conn) try { conn.send({ type: 'WB_GUESS', text: guess }); } catch (e) {}
    }
  };

  function checkGuess(text) {
    const normalize = (s) => (s || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const cleanGuess = normalize(text);
    const cleanTarget = normalize(currentWord);

    if (cleanGuess === cleanTarget || (cleanGuess.length >= 3 && cleanTarget === cleanGuess)) {
      // ¡Acierto!
      clearTimers();
      const res = document.getElementById('wbResultMsg');
      if (res) {
        res.style.color = '#28a745';
        res.innerHTML = `🎉 ¡CORRECTO! Han acertado: <b>"${currentWord}"</b> 🌟<br><span style="font-size:11px;color:#666;">Cambiando de dibujante...</span>`;
      }
      playVictoryPop();
      if (typeof dispararConfetiCanvas === 'function') dispararConfetiCanvas();

      if (isLiveGame) {
        const conn = getConnection();
        if (conn) try { conn.send({ type: 'WB_GUESS_CORRECT', word: currentWord }); } catch (e) {}
      }

      // Pasar a la siguiente ronda con cambio de roles tras 2.5s
      setTimeout(() => {
        window.nextWhiteboardRound();
      }, 2500);
    } else {
      const res = document.getElementById('wbResultMsg');
      if (res) {
        res.style.color = '#e67e22';
        res.textContent = `❌ "${text}" no es correcto. ¡Sigue probando!`;
      }
      if (typeof playRetroTone === 'function') playRetroTone(300, 'sine', 0.1);
    }
  }

  function playVictoryPop() {
    const notes = [392, 523.25, 659.25, 783.99]; // Sol - Do - Mi - Sol
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (typeof playRetroTone === 'function') playRetroTone(freq, 'triangle', 0.18);
      }, idx * 100);
    });
  }

  // Avanzar a la siguiente ronda alternando el rol del dibujante
  window.nextWhiteboardRound = function(isRemoteSync, data) {
    if (isRemoteSync && data) {
      roundNumber = data.round;
      currentDrawer = data.drawer;
      currentWord = data.word;
    } else {
      roundNumber++;
      currentDrawer = (currentDrawer === 'PINCHI') ? 'CHIMPI' : 'PINCHI';
      currentWord = pickNewWord();

      if (isLiveGame) {
        const conn = getConnection();
        if (conn) {
          try {
            conn.send({
              type: 'WB_ROUND',
              round: roundNumber,
              drawer: currentDrawer,
              word: currentWord
            });
          } catch (e) {}
        }
      }
    }

    renderWhiteboardUI();
  };

  window.newWhiteboardRound = function() {
    window.nextWhiteboardRound(false);
  };

  // ===========================================================================
  // MANEJADORES WEBRTC
  // ===========================================================================
  window._handleRemoteWhiteboardDraw = function(data) {
    if (!data) return;
    const x0 = (data.x0 / 1000) * 320;
    const y0 = (data.y0 / 1000) * 320;
    const x1 = (data.x1 / 1000) * 320;
    const y1 = (data.y1 / 1000) * 320;
    drawLine(x0, y0, x1, y1, data.color || '#000000', data.size || 4);
    playPencilSound();
  };

  window._handleRemoteWhiteboardClear = function() {
    clearCanvas();
  };

  window._handleRemoteWhiteboardGuess = function(data) {
    if (!data || !data.text) return;
    checkGuess(data.text);
  };

  window._handleRemoteWhiteboardCorrect = function(data) {
    clearTimers();
    const res = document.getElementById('wbResultMsg');
    if (res) {
      res.style.color = '#28a745';
      res.innerHTML = `🎉 ¡Tu pareja ha adivinado la palabra: <b>"${data.word || currentWord}"</b>! 💖<br><span style="font-size:11px;color:#666;">Cambiando de dibujante...</span>`;
    }
    playVictoryPop();
    if (typeof dispararConfetiCanvas === 'function') dispararConfetiCanvas();
    setTimeout(() => {
      window.nextWhiteboardRound();
    }, 2500);
  };

  window._handleRemoteWhiteboardRound = function(data) {
    if (!data) return;
    window.nextWhiteboardRound(true, data);
  };

  window.openWhiteboardGame = openWhiteboardGame;
})();
