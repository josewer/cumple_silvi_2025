// =============================================================================
// MSN GAMES - PIZARRA COMPARTIDA RETRO (PICTIONARY NETMEETING / MSN)
// =============================================================================

(function() {
  const SECRET_WORDS = [
    "Pingüino enfadado", "Tarta quemada", "Siesta de 4 horas", "Cerdito comilón",
    "Abrazo de oso", "Zumbido a las 3am", "Bocata de panceta", "Avril Lavigne",
    "Playa con pingüinos", "Paseo en moto", "Cena romántica", "Helado de fresa",
    "Gafas de sol", "Café con leche", "Despertador sonando", "Caja de bombones",
    "Viaje a París", "Perrito caliente", "Palomitas de cine", "Besito de esquimal",
    "Peluche gigante", "Flor rosa", "Guitarra rockera", "Carta de amor",
    "Estrella fugaz", "Bailar bajo la lluvia", "Manta y sofá", "Risa floja",
    "Corona de princesa", "Pastel de fresa", "Noche de videojuegos", "Cerdito volador",
    "Corazón flechado", "Maleta de viaje", "Cámara de fotos", "Panceta crujiente",
    "Superhéroe porcino", "Paraguas roto", "Ducha calentita", "Regalo sorpresa"
  ];

  let isLiveGame = false;
  let isChimpiRole = false;
  let isDrawer = true; // Chimpi dibuja en turno 1 en modo P2P, o Pinchi
  let currentWord = "";
  let timeLeft = 60;
  let timerInterval = null;
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

    // Chimpi dibuja primero en modo Live si está conectado; en solitario dibuja el usuario local
    isDrawer = isLiveGame ? isChimpiRole : true;
    pickNewWord();
    clearInterval(timerInterval);
    window._activeGameCleanup = () => { clearInterval(timerInterval); };

    if (content) {
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
          <div class="wb-info-bar">
            <span id="wbRoleStatus" style="color:#0078d7;">
              ${isDrawer ? `✏️ Tu palabra: <b>"${currentWord}"</b>` : '👀 ¡Adivina qué dibuja tu pareja!'}
            </span>
            <span id="wbTimer" style="color:#e84118;">⏳ 60s</span>
          </div>

          <div class="wb-toolbar" id="wbToolbar" style="${isDrawer ? '' : 'pointer-events:none;opacity:0.6;'}">
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

          <div id="wbResultMsg" style="font-size:12px;font-weight:bold;color:#28a745;margin-top:6px;min-height:16px;"></div>

          <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
            <button class="msn-game-launch-btn" style="padding:5px 12px;font-size:12px;" onclick="window.newWhiteboardRound()">
              🔄 Siguiente Ronda / Palabra
            </button>
            ${typeof hubBackBtnHtml === 'function' ? hubBackBtnHtml() : ''}
          </div>
        </div>
      `;

      setupCanvas();
      setupToolbar();
      startTimer();
    }

    if (modal) modal.style.display = 'flex';
  }

  function pickNewWord() {
    const idx = Math.floor(Math.random() * SECRET_WORDS.length);
    currentWord = SECRET_WORDS[idx];
  }

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
    const res = document.getElementById('wbResultMsg');
    if (res) {
      res.style.color = '#e74c3c';
      res.textContent = `⏰ ¡Tiempo agotado! La palabra era: "${currentWord}".`;
    }
    if (typeof playRetroTone === 'function') playRetroTone(220, 'sawtooth', 0.25);
  }

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

      // Enviar coordenadas normalizadas de 0 a 1000
      if (isLiveGame) {
        const conn = getConnection();
        if (conn) {
          try {
            conn.send({
              type: 'WB_DRAW',
              x0: Math.round(lastX / 320 * 1000),
              y0: Math.round(lastY / 320 * 1000),
              x1: Math.round(pos.x / 320 * 1000),
              y1: Math.round(pos.y / 320 * 1000),
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
    const cleanGuess = text.toLowerCase().trim();
    const cleanTarget = currentWord.toLowerCase().trim();

    if (cleanGuess === cleanTarget || (cleanGuess.length > 4 && cleanTarget.includes(cleanGuess))) {
      // ¡Acierto!
      clearInterval(timerInterval);
      const res = document.getElementById('wbResultMsg');
      if (res) {
        res.style.color = '#28a745';
        res.innerHTML = `🎉 ¡CORRECTO! Han acertado: <b>"${currentWord}"</b> 🌟`;
      }
      playVictoryPop();
      if (typeof dispararConfetiCanvas === 'function') dispararConfetiCanvas();

      if (isLiveGame) {
        const conn = getConnection();
        if (conn) try { conn.send({ type: 'WB_GUESS_CORRECT', word: currentWord }); } catch (e) {}
      }

      // Invertir roles tras 2.5s
      setTimeout(() => {
        isDrawer = !isDrawer;
        openWhiteboardGame(!isLiveGame);
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

  window.newWhiteboardRound = function() {
    openWhiteboardGame(!isLiveGame);
  };

  // Manejadores WebRTC
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
    clearInterval(timerInterval);
    const res = document.getElementById('wbResultMsg');
    if (res) {
      res.style.color = '#28a745';
      res.innerHTML = `🎉 ¡Tu pareja ha adivinado la palabra: <b>"${data.word || currentWord}"</b>! 💖`;
    }
    playVictoryPop();
    if (typeof dispararConfetiCanvas === 'function') dispararConfetiCanvas();
    setTimeout(() => {
      isDrawer = !isDrawer;
      openWhiteboardGame(!isLiveGame);
    }, 2500);
  };

  window.openWhiteboardGame = openWhiteboardGame;
})();
