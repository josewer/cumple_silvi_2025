// =============================================================================
// MSN GAMES - DUELO DE ZAMPABOLLOS (TUG-OF-WAR / MACHACA-BOTONES)
// =============================================================================

(function() {
  let timeLeft = 12;
  let timerInterval = null;
  let batchInterval = null;
  let aiInterval = null;
  let clicksPinchi = 0;
  let clicksChimpi = 0;
  let localClicksBuffer = 0;
  let isGameOver = false;
  let isLiveGame = false;
  let isChimpiRole = false;

  function getConnection() {
    return (window.liveChimpi && window.liveChimpi.conn && window.liveChimpi.conn.open)
      ? window.liveChimpi.conn
      : (window._liveConnection && window._liveConnection.open ? window._liveConnection : null);
  }

  function openTugOfWarGame(forceSolo) {
    if (typeof closeGameModal === 'function') closeGameModal(true);

    const modal = window.gameModal || document.getElementById('gameModal');
    const title = window.gameTitle || document.getElementById('gameTitle');
    const content = window.gameContent || document.getElementById('gameContent');

    if (title) title.innerHTML = '🎂 MSN Games - Zampabollos: ¡El Duelo por la Tarta!';

    const conn = getConnection();
    isLiveGame = !forceSolo && !!conn;
    isChimpiRole = !!window._isChimpiMode;
    window._activeLiveGame = isLiveGame ? 'Zampabollos MSN' : null;

    clicksPinchi = 0;
    clicksChimpi = 0;
    localClicksBuffer = 0;
    timeLeft = 12;
    isGameOver = false;
    clearAllTimers();
    window._activeGameCleanup = clearAllTimers;

    if (content) {
      content.innerHTML = `
        <style>
          .tug-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            max-width: 360px;
            margin: 0 auto;
            user-select: none;
          }
          .tug-arena {
            width: 330px;
            height: 120px;
            background: linear-gradient(180deg, #fffae6, #f7d794);
            border: 3px solid #e17055;
            border-radius: 12px;
            position: relative;
            overflow: hidden;
            box-shadow: inset 0 2px 6px rgba(0,0,0,0.15);
            margin-bottom: 8px;
          }
          .tug-table-surface {
            position: absolute;
            bottom: 0;
            width: 100%;
            height: 30px;
            background: #d35400;
            border-top: 3px solid #b33939;
          }
          .tug-char-left {
            position: absolute;
            left: 10px;
            bottom: 22px;
            font-size: 38px;
            z-index: 2;
          }
          .tug-char-right {
            position: absolute;
            right: 10px;
            bottom: 22px;
            font-size: 38px;
            z-index: 2;
          }
          .tug-rope-line {
            position: absolute;
            bottom: 38px;
            left: 45px;
            right: 45px;
            height: 6px;
            background: repeating-linear-gradient(45deg, #d35400, #d35400 10px, #e67e22 10px, #e67e22 20px);
            border-radius: 3px;
            z-index: 1;
          }
          .tug-cake-item {
            position: absolute;
            bottom: 26px;
            font-size: 32px;
            transform: translateX(-50%);
            transition: left 0.08s linear;
            z-index: 3;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
          }
          .tug-giant-btn {
            width: 330px;
            height: 140px;
            background: radial-gradient(circle, #ff6b81, #ee5253);
            border: 4px solid #b33939;
            border-radius: 16px;
            color: #ffffff;
            font-size: 26px;
            font-weight: 900;
            cursor: pointer;
            box-shadow: 0 6px 12px rgba(0,0,0,0.3), inset 0 3px 6px rgba(255,255,255,0.4);
            text-shadow: 0 2px 4px rgba(0,0,0,0.4);
            touch-action: manipulation;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 6px;
          }
          .tug-giant-btn:active {
            transform: scale(0.97);
            background: radial-gradient(circle, #ee5253, #c0392b);
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          }
        </style>

        <div class="tug-container">
          <div style="display:flex;justify-content:space-between;width:330px;font-size:12px;font-weight:bold;margin-bottom:6px;">
            <span style="color:#0078d7;">Pinchi 🐧: <b id="tugClicksP">0</b></span>
            <span id="tugCountdown" style="color:#e84118;font-size:15px;">⏳ 12.0s</span>
            <span style="color:#e84393;">Chimpi 🐷: <b id="tugClicksC">0</b></span>
          </div>

          <div class="tug-arena">
            <div class="tug-table-surface"></div>
            <div class="tug-char-left">🐧</div>
            <div class="tug-rope-line"></div>
            <div class="tug-cake-item" id="tugCake" style="left:50%;">🎂</div>
            <div class="tug-char-right">🐷</div>
          </div>

          <button class="tug-giant-btn" id="tugGiantBtn" onclick="window.onTugButtonClick()">
            <span>🍰 ¡¡TIRA DE LA TARTA!! 🍰</span>
            <span style="font-size:13px;opacity:0.9;">¡Machaca este botón sin parar!</span>
          </button>

          <div id="tugResultText" style="font-size:13px;font-weight:bold;color:#28a745;margin-top:8px;min-height:18px;text-align:center;">
          </div>

          <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
            <button class="msn-game-launch-btn" style="padding:5px 12px;font-size:12px;" onclick="window.restartTugOfWarGame()">
              🔄 Revancha
            </button>
            ${typeof hubBackBtnHtml === 'function' ? hubBackBtnHtml() : ''}
          </div>
        </div>
      `;

      startCountdown();
      setupBatchSender();

      // Modo solitario: IA que machaca a ritmo competitivo
      if (!isLiveGame) {
        startAI();
      }
    }

    if (modal) modal.style.display = 'flex';
  }

  function clearAllTimers() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    if (batchInterval) { clearInterval(batchInterval); batchInterval = null; }
    if (aiInterval) { clearInterval(aiInterval); aiInterval = null; }
  }

  function startCountdown() {
    const startMs = Date.now();
    const totalMs = 12000;

    timerInterval = setInterval(() => {
      const elapsed = Date.now() - startMs;
      const remain = Math.max(0, totalMs - elapsed);
      timeLeft = (remain / 1000).toFixed(1);

      const cd = document.getElementById('tugCountdown');
      if (cd) cd.textContent = `⏳ ${timeLeft}s`;

      if (remain <= 0) {
        clearInterval(timerInterval);
        resolveFinalWinner();
      }
    }, 100);
  }

  function setupBatchSender() {
    if (!isLiveGame) return;
    batchInterval = setInterval(() => {
      if (localClicksBuffer > 0) {
        const conn = getConnection();
        if (conn) {
          try {
            conn.send({
              type: 'TUG_PULSE',
              count: localClicksBuffer,
              role: isChimpiRole ? 'chimpi' : 'pinchi'
            });
          } catch (e) {}
        }
        localClicksBuffer = 0;
      }
    }, 100);
  }

  function startAI() {
    // La IA de Chimpi pulsa entre 5 y 8 veces por segundo con microvariaciones
    aiInterval = setInterval(() => {
      if (isGameOver) return;
      if (Math.random() < 0.85) {
        clicksChimpi++;
        updateVisuals();
      }
    }, 140);
  }

  window.onTugButtonClick = function() {
    if (isGameOver) return;

    if (navigator.vibrate) try { navigator.vibrate(15); } catch (e) {}

    if (isChimpiRole) {
      clicksChimpi++;
    } else {
      clicksPinchi++;
    }

    localClicksBuffer++;
    updateVisuals();

    // Sonido sutil de esfuerzo
    if (typeof playRetroTone === 'function') playRetroTone(260 + Math.random() * 40, 'sine', 0.04);
  };

  function updateVisuals() {
    const cP = document.getElementById('tugClicksP');
    const cC = document.getElementById('tugClicksC');
    if (cP) cP.textContent = clicksPinchi;
    if (cC) cC.textContent = clicksChimpi;

    // Fórmula: 50% - (clicksPinchi - clicksChimpi) * 1.5%
    // Si clicksPinchi > clicksChimpi, la tarta va a la izquierda (hacia 0%)
    let pos = 50 - (clicksPinchi - clicksChimpi) * 1.5;
    pos = Math.max(5, Math.min(95, pos));

    const cake = document.getElementById('tugCake');
    if (cake) cake.style.left = `${pos}%`;

    // KO Técnico si llega a los extremos
    if (pos <= 5) {
      resolveKO('pinchi');
    } else if (pos >= 95) {
      resolveKO('chimpi');
    }
  }

  function playChompSound() {
    // Síntesis de "chomp-chomp" masticando la tarta
    try {
      const ctx = window.retroAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      [0, 180, 360].forEach((delay, idx) => {
        setTimeout(() => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(200, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.12);
          gain.gain.setValueAtTime(0.25, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.12);
        }, delay);
      });
    } catch (e) {}
  }

  function resolveKO(winner) {
    if (isGameOver) return;
    isGameOver = true;
    clearAllTimers();

    const isPinchi = winner === 'pinchi';
    const name = isPinchi ? '¡Pinchi 🐧 se zampa la tarta!' : '¡Chimpi 🐷 se ha comido toda la tarta!';
    const res = document.getElementById('tugResultText');
    if (res) {
      res.innerHTML = `🏆 <b>¡KO TÉCNICO!</b> ${name} 🎂✨`;
    }

    playChompSound();
    checkCelebration(isPinchi);
  }

  function resolveFinalWinner() {
    if (isGameOver) return;
    isGameOver = true;
    clearAllTimers();

    const diff = clicksPinchi - clicksChimpi;
    let text = '';
    let isPinchi = false;

    if (diff > 0) {
      text = '🏆 ¡Pinchi 🐧 gana por decisión de los jueces golosos!';
      isPinchi = true;
    } else if (diff < 0) {
      text = '🏆 ¡Chimpi 🐷 gana el festín por velocidad!';
      isPinchi = false;
    } else {
      text = '🤝 ¡Empate exacto! La tarta se reparte al 50%.';
    }

    const res = document.getElementById('tugResultText');
    if (res) res.textContent = text;

    playChompSound();
    if (diff !== 0) checkCelebration(isPinchi);
  }

  function checkCelebration(isPinchiWinner) {
    const isMe = (isPinchiWinner && !isChimpiRole) || (!isPinchiWinner && isChimpiRole);
    if (isMe) {
      if (typeof dispararConfetiCanvas === 'function') dispararConfetiCanvas();
      if (typeof playRetroTone === 'function') playRetroTone(523.25, 'triangle', 0.4);
    }
  }

  window.restartTugOfWarGame = function() {
    openTugOfWarGame(!isLiveGame);
  };

  // Manejador WebRTC
  window._handleRemoteTugPulse = function(data) {
    if (!data || typeof data.count !== 'number' || isGameOver) return;
    if (data.role === 'chimpi') {
      clicksChimpi += data.count;
    } else {
      clicksPinchi += data.count;
    }
    updateVisuals();
  };

  window.openTugOfWarGame = openTugOfWarGame;
})();
