// =============================================================================
// MSN GAMES - DUELO DE REFLEJOS ("¿QUIÉN DA EL ZUMBIDO PRIMERO?")
// =============================================================================

(function() {
  let currentRound = 1;
  let scorePinchi = 0;
  let scoreChimpi = 0;
  let isRoundActive = false;
  let isArmed = false;
  let roundTimeout = null;
  let aiTimeout = null;
  let isLiveGame = false;
  let isChimpiRole = false;
  let isGameOver = false;

  function getConnection() {
    return (window.liveChimpi && window.liveChimpi.conn && window.liveChimpi.conn.open)
      ? window.liveChimpi.conn
      : (window._liveConnection && window._liveConnection.open ? window._liveConnection : null);
  }

  function openBuzzDuelGame(forceSolo) {
    if (typeof closeGameModal === 'function') closeGameModal(true);

    const modal = window.gameModal || document.getElementById('gameModal');
    const title = window.gameTitle || document.getElementById('gameTitle');
    const content = window.gameContent || document.getElementById('gameContent');

    if (title) title.innerHTML = '⚡ MSN Games - Duelo de Reflejos: ¡El Zumbador Más Rápido!';

    const conn = getConnection();
    isLiveGame = !forceSolo && !!conn;
    isChimpiRole = !!window._isChimpiMode;
    window._activeLiveGame = isLiveGame ? 'Duelo de Zumbidos' : null;

    currentRound = 1;
    scorePinchi = 0;
    scoreChimpi = 0;
    isGameOver = false;
    isArmed = false;
    isRoundActive = false;
    clearAllTimers();

    if (content) {
      content.innerHTML = `
        <style>
          .buzzduel-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            max-width: 340px;
            margin: 0 auto;
            user-select: none;
          }
          .buzzduel-score-board {
            display: flex;
            justify-content: space-around;
            width: 100%;
            background: #f1f2f6;
            border: 2px solid #0078d7;
            border-radius: 8px;
            padding: 8px 6px;
            margin-bottom: 12px;
            box-sizing: border-box;
          }
          .buzzduel-score-box {
            text-align: center;
          }
          .buzzduel-score-pts {
            font-size: 24px;
            font-weight: bold;
          }
          .buzzduel-arena {
            width: 100%;
            height: 200px;
            background: #2f3542;
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
            transition: background 0.15s;
            box-shadow: inset 0 4px 10px rgba(0,0,0,0.5);
          }
          .buzzduel-arena.armed {
            background: #ffeaa7;
            animation: buzz-flash 0.2s infinite alternate;
          }
          .buzzduel-arena.foul {
            background: #ff7675;
          }
          @keyframes buzz-flash {
            0% { background: #ffeaa7; }
            100% { background: #fdcb6e; }
          }
          .buzzduel-icon {
            font-size: 72px;
            filter: grayscale(100%) opacity(40%);
            transition: transform 0.1s, filter 0.15s;
          }
          .buzzduel-icon.active {
            filter: grayscale(0%) opacity(100%);
            transform: scale(1.15);
          }
          .buzzduel-btn {
            margin-top: 14px;
            width: 100%;
            padding: 14px;
            background: linear-gradient(180deg, #ff4757, #ed1c24);
            border: 2px solid #b33939;
            border-radius: 10px;
            color: #fff;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            text-shadow: 0 1px 2px rgba(0,0,0,0.4);
            touch-action: manipulation;
          }
          .buzzduel-btn:active {
            transform: translateY(2px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          }
        </style>

        <div class="buzzduel-container">
          <div style="font-size:12px;font-weight:bold;color:#444;margin-bottom:6px;">
            Al mejor de 5 rondas • ⚡ ¡Cuidado con pulsar antes de tiempo!
          </div>

          <div class="buzzduel-score-board">
            <div class="buzzduel-score-box">
              <div style="font-size:13px;font-weight:bold;color:#0078d7;">Pinchi 🐧</div>
              <div class="buzzduel-score-pts" id="scoreP" style="color:#0078d7;">0</div>
            </div>
            <div style="align-self:center;font-size:18px;font-weight:bold;color:#888;">vs</div>
            <div class="buzzduel-score-box">
              <div style="font-size:13px;font-weight:bold;color:#e84393;">Chimpi 🐷</div>
              <div class="buzzduel-score-pts" id="scoreC" style="color:#e84393;">0</div>
            </div>
          </div>

          <div class="buzzduel-arena" id="buzzArena">
            <div class="buzzduel-icon" id="buzzIcon">🔔</div>
            <div id="buzzPrompt" style="color:#dfe4ea;font-size:13px;font-weight:bold;margin-top:6px;">
              Preparados...
            </div>
          </div>

          <button class="buzzduel-btn" id="buzzActionBtn">
            💥 ¡ZUMBAR AHORA! 🔊
          </button>

          <div id="buzzStatusMsg" style="font-size:12px;color:#d35400;font-weight:bold;margin-top:8px;min-height:18px;text-align:center;">
          </div>

          <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
            <button class="msn-game-launch-btn" style="padding:6px 12px;font-size:12px;" onclick="window.restartBuzzDuelGame()">
              🔄 Reiniciar Duelo
            </button>
            ${typeof hubBackBtnHtml === 'function' ? hubBackBtnHtml() : ''}
          </div>
        </div>
      `;

      attachButtonListener();
      startNewRound();
    }

    if (modal) modal.style.display = 'flex';
  }

  function clearAllTimers() {
    if (roundTimeout) { clearTimeout(roundTimeout); roundTimeout = null; }
    if (aiTimeout) { clearTimeout(aiTimeout); aiTimeout = null; }
  }

  function attachButtonListener() {
    const btn = document.getElementById('buzzActionBtn');
    if (!btn) return;
    btn.onclick = () => {
      handleBuzzPress(isChimpiRole ? 'chimpi' : 'pinchi');
    };
  }

  function startNewRound() {
    if (isGameOver) return;
    clearAllTimers();
    isArmed = false;
    isRoundActive = true;

    const arena = document.getElementById('buzzArena');
    const icon = document.getElementById('buzzIcon');
    const prompt = document.getElementById('buzzPrompt');
    const statusMsg = document.getElementById('buzzStatusMsg');

    if (arena) arena.className = 'buzzduel-arena';
    if (icon) icon.className = 'buzzduel-icon';
    if (prompt) {
      prompt.textContent = `Ronda ${currentRound}: ¡Esperando la señal!...`;
      prompt.style.color = '#dfe4ea';
    }
    if (statusMsg) statusMsg.textContent = '';

    // En modo P2P, el host (Pinchi) genera el delay y lo transmite al guest
    if (isLiveGame) {
      if (!isChimpiRole) {
        // Host (Pinchi)
        const delay = Math.floor(Math.random() * 3500) + 2500;
        const conn = getConnection();
        if (conn) {
          try {
            conn.send({
              type: 'BUZZ_PREPARE',
              round: currentRound,
              delay: delay
            });
          } catch (e) {}
        }
        armTimer(delay);
      }
    } else {
      // Modo Solitario
      const delay = Math.floor(Math.random() * 3500) + 2500;
      armTimer(delay);
    }
  }

  function armTimer(delay) {
    roundTimeout = setTimeout(() => {
      triggerBuzzAlert();
    }, delay);
  }

  function triggerBuzzAlert() {
    if (!isRoundActive || isGameOver) return;
    isArmed = true;

    const arena = document.getElementById('buzzArena');
    const icon = document.getElementById('buzzIcon');
    const prompt = document.getElementById('buzzPrompt');

    if (arena) arena.className = 'buzzduel-arena armed';
    if (icon) icon.className = 'buzzduel-icon active';
    if (prompt) {
      prompt.textContent = '⚡⚡ ¡¡ZUMBA YA!! ⚡⚡';
      prompt.style.color = '#111';
    }

    playBuzzerSound();

    // En modo solitario, simular reflejo de Chimpi IA (380ms - 620ms)
    if (!isLiveGame) {
      const aiReactionTime = Math.floor(Math.random() * 240) + 380;
      aiTimeout = setTimeout(() => {
        if (isArmed && isRoundActive) {
          handleBuzzPress('chimpi');
        }
      }, aiReactionTime);
    }
  }

  function playBuzzerSound() {
    const sound = document.getElementById('soundZumbido');
    if (sound) {
      try {
        sound.currentTime = 0;
        sound.play().catch(() => playFMBuzzTone());
        return;
      } catch (e) {}
    }
    playFMBuzzTone();
  }

  function playFMBuzzTone() {
    try {
      const ctx = window.retroAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(70, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  }

  function shakeModal() {
    const modal = window.gameModal || document.getElementById('gameModal');
    if (modal) {
      modal.classList.add('msn-shake');
      setTimeout(() => modal.classList.remove('msn-shake'), 500);
    }
  }

  function handleBuzzPress(player) {
    if (!isRoundActive || isGameOver) return;

    clearAllTimers();
    isRoundActive = false;

    // Falsa salida
    if (!isArmed) {
      handleFoul(player);
      return;
    }

    // Acierto a tiempo
    resolveRoundWinner(player);

    if (isLiveGame) {
      const conn = getConnection();
      if (conn) {
        try {
          conn.send({
            type: 'BUZZ_HIT',
            round: currentRound,
            player: player,
            timeStamp: performance.now()
          });
        } catch (e) {}
      }
    }
  }

  function handleFoul(foulPlayer) {
    const arena = document.getElementById('buzzArena');
    const prompt = document.getElementById('buzzPrompt');
    const statusMsg = document.getElementById('buzzStatusMsg');

    if (arena) arena.className = 'buzzduel-arena foul';
    if (prompt) prompt.textContent = '❌ ¡FALSA SALIDA!';
    shakeModal();

    const winner = foulPlayer === 'pinchi' ? 'chimpi' : 'pinchi';
    const foulName = foulPlayer === 'pinchi' ? 'Pinchi 🐧' : 'Chimpi 🐷';
    const winName = winner === 'pinchi' ? 'Pinchi 🐧' : 'Chimpi 🐷';

    if (statusMsg) {
      statusMsg.textContent = `⚠️ ¡${foulName} pulsó antes de tiempo! Punto para ${winName}.`;
    }

    awardPoint(winner);

    if (isLiveGame) {
      const conn = getConnection();
      if (conn) {
        try {
          conn.send({
            type: 'BUZZ_FOUL',
            foulPlayer: foulPlayer,
            winner: winner
          });
        } catch (e) {}
      }
    }
  }

  function resolveRoundWinner(winner) {
    shakeModal();
    if (navigator.vibrate) try { navigator.vibrate([150, 50, 150]); } catch (e) {}

    const winName = winner === 'pinchi' ? 'Pinchi 🐧' : 'Chimpi 🐷';
    const statusMsg = document.getElementById('buzzStatusMsg');
    if (statusMsg) {
      statusMsg.textContent = `⚡ ¡${winName} ha zumbado más rápido y gana la ronda!`;
    }

    awardPoint(winner);
  }

  function awardPoint(winner) {
    if (winner === 'pinchi') scorePinchi++;
    else scoreChimpi++;

    const sP = document.getElementById('scoreP');
    const sC = document.getElementById('scoreC');
    if (sP) sP.textContent = scorePinchi;
    if (sC) sC.textContent = scoreChimpi;

    if (scorePinchi >= 3 || scoreChimpi >= 3) {
      endGame(scorePinchi >= 3 ? 'Pinchi 🐧' : 'Chimpi 🐷');
    } else {
      currentRound++;
      setTimeout(startNewRound, 2000);
    }
  }

  function endGame(champName) {
    isGameOver = true;
    const prompt = document.getElementById('buzzPrompt');
    if (prompt) prompt.textContent = `🏆 ¡${champName} GANA EL DUELO!`;

    const isLocalWinner = (champName.includes('Pinchi') && !isChimpiRole) || (champName.includes('Chimpi') && isChimpiRole);
    if (isLocalWinner) {
      if (typeof dispararConfetiCanvas === 'function') dispararConfetiCanvas();
      if (typeof playRetroTone === 'function') playRetroTone(523.25, 'triangle', 0.4);
    }

    const statusMsg = document.getElementById('buzzStatusMsg');
    if (statusMsg) {
      statusMsg.innerHTML = `<span style="color:#28a745;font-size:14px;">🎉 ¡Fin del duelo! Resultado final: ${scorePinchi} - ${scoreChimpi}</span>`;
    }
  }

  window.restartBuzzDuelGame = function() {
    openBuzzDuelGame(!isLiveGame);
  };

  // Manejadores WebRTC
  window._handleRemoteBuzzPrepare = function(data) {
    if (!data || typeof data.delay !== 'number') return;
    currentRound = data.round || currentRound;
    isArmed = false;
    isRoundActive = true;
    const arena = document.getElementById('buzzArena');
    const prompt = document.getElementById('buzzPrompt');
    if (arena) arena.className = 'buzzduel-arena';
    if (prompt) prompt.textContent = `Ronda ${currentRound}: ¡Esperando la señal!...`;
    armTimer(data.delay);
  };

  window._handleRemoteBuzzHit = function(data) {
    if (!isRoundActive || isGameOver) return;
    resolveRoundWinner(data.player);
  };

  window._handleRemoteBuzzFoul = function(data) {
    if (!isRoundActive || isGameOver) return;
    handleFoul(data.foulPlayer);
  };

  window.openBuzzDuelGame = openBuzzDuelGame;
})();
