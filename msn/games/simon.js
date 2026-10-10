// ==========================================
// MSN GAMES - SIMÓN DICE MSN (MODO INFINITO & AYUDA VISUAL)
// ==========================================

function openSimonGame() {
  if (typeof closeGameModal === 'function') closeGameModal(true);

  var modal = window.gameModal || document.getElementById('gameModal');
  var title = window.gameTitle || document.getElementById('gameTitle');
  var content = window.gameContent || document.getElementById('gameContent');

  if (title) title.textContent = '🎶 MSN Games - Simón Dice MSN';

  const frequencies = [261.63, 329.63, 392.0, 523.25]; // Do4, Mi4, Sol4, Do5
  let highScore = parseInt(localStorage.getItem('msn_simon_highscore') || '0', 10);
  if (isNaN(highScore)) highScore = 0;

  let sequence = [];
  let userStep = 0;
  let isPlayingSequence = false;
  let gameStarted = false;
  let currentRound = 1;
  let visualHelp = true; // Selector de ayuda visual (True: luz + sonido | False: solo sonido)
  let isNewRecord = false;

  if (content) {
    content.innerHTML = `
      <style>
        .simon-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 350px;
          margin: 0 auto;
          user-select: none;
          font-family: inherit;
        }
        .simon-header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: 270px;
          margin: 2px 0 6px 0;
          font-size: 12px;
          font-weight: bold;
        }
        .simon-toggle-btn {
          border: 1px solid #70a1ff;
          border-radius: 14px;
          padding: 3px 10px;
          font-size: 11px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 4px;
          background: #eef6ff;
          color: #0078d7;
        }
        .simon-toggle-btn.expert {
          background: #341f97;
          border-color: #5f27cd;
          color: #f1f2f6;
          box-shadow: 0 0 8px rgba(95, 39, 205, 0.4);
        }
        .simon-board {
          position: relative;
          width: 240px;
          height: 240px;
          margin: 8px auto;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          grid-template-rows: repeat(2, 1fr);
          gap: 12px;
          background: #1e272e;
          padding: 12px;
          border-radius: 50%;
          box-shadow: 0 8px 24px rgba(0,0,0,0.35), inset 0 0 10px rgba(0,0,0,0.8);
          box-sizing: border-box;
        }
        .simon-center-badge {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 72px;
          height: 72px;
          background: #2f3640;
          border: 3px solid #f5f6fa;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 11px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
          pointer-events: none;
          z-index: 10;
          transition: transform 0.15s ease;
        }
        .simon-btn {
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          transition: transform 0.1s ease, filter 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease;
          opacity: 0.72;
          border: 3px solid rgba(0,0,0,0.3);
          box-sizing: border-box;
        }
        .simon-btn:hover {
          opacity: 0.9;
        }
        .simon-btn.active-flash {
          opacity: 1 !important;
          transform: scale(0.94) !important;
          filter: brightness(2) saturate(1.8) !important;
          box-shadow: 0 0 25px white, 0 0 15px currentColor !important;
        }
        .simon-btn.hint-flash {
          animation: simonHintPulse 0.5s infinite alternate;
        }
        @keyframes simonHintPulse {
          0% { opacity: 0.6; transform: scale(1); }
          100% { opacity: 1; transform: scale(0.95); box-shadow: 0 0 20px #f1c40f; }
        }
        #sbtn0 {
          background: #2ecc71;
          border-radius: 90px 10px 10px 10px;
          color: #27ae60;
        }
        #sbtn1 {
          background: #e74c3c;
          border-radius: 10px 90px 10px 10px;
          color: #c0392b;
        }
        #sbtn2 {
          background: #f1c40f;
          border-radius: 10px 10px 10px 90px;
          color: #d4ac0d;
        }
        #sbtn3 {
          background: #3498db;
          border-radius: 10px 10px 90px 10px;
          color: #2980b9;
        }
        .simon-btn-sub {
          font-size: 10px;
          font-weight: bold;
          color: #fff;
          text-shadow: 0 1px 2px rgba(0,0,0,0.7);
          margin-top: 2px;
        }
      </style>

      <div class="simon-container">
        <div style="font-weight:bold;font-size:14px;color:#111;text-align:center;">
          ¡Simón Dice MSN: Desafío Infinito! 🎶
        </div>
        
        <div class="simon-header-bar">
          <span id="simonRoundDisplay" style="color:#0078d7;">
            Ronda: <b>1</b> (Infinito)
          </span>
          <span id="simonHighScoreDisplay" style="color:#e67e22;">
            🏆 Récord: <b>${highScore}</b>
          </span>
        </div>

        <div style="margin-bottom:6px;">
          <button id="simonToggleBtn" class="simon-toggle-btn" title="Alternar entre modo con luz o solo oído">
            💡 Ayuda Visual: <b>ACTIVADA</b>
          </button>
        </div>

        <div class="simon-board">
          <div class="simon-btn" id="sbtn0">
            <span>🔊</span>
            <span class="simon-btn-sub">DO</span>
          </div>
          <div class="simon-btn" id="sbtn1">
            <span>🎸</span>
            <span class="simon-btn-sub">MI</span>
          </div>
          <div class="simon-btn" id="sbtn2">
            <span>🐷</span>
            <span class="simon-btn-sub">SOL</span>
          </div>
          <div class="simon-btn" id="sbtn3">
            <span>🔔</span>
            <span class="simon-btn-sub">DO+</span>
          </div>
          <div class="simon-center-badge" id="simonCenterBadge">
            <span id="simonBadgeIcon" style="font-size:18px;">🐧</span>
            <span id="simonBadgeText" style="font-size:10px;">MSN</span>
          </div>
        </div>

        <div id="simonStatus" style="font-size:12px;color:#444;min-height:24px;text-align:center;font-weight:bold;margin:2px 0 8px 0;">
          Toca las teclas para probarlas o pulsa empezar 👇
        </div>

        <div id="simonControls" style="display:flex;gap:8px;justify-content:center;margin-bottom:6px;">
          <button id="simonStartBtn" class="msn-game-launch-btn" style="padding:6px 14px;font-size:13px;font-weight:bold;background:#28a745;">
            ▶️ ¡Empezar Desafío!
          </button>
        </div>

        ${typeof hubBackBtnHtml === 'function' ? hubBackBtnHtml() : ''}
      </div>
    `;
  }

  if (modal) modal.style.display = 'flex';

  const roundElem = document.getElementById('simonRoundDisplay');
  const highScoreElem = document.getElementById('simonHighScoreDisplay');
  const toggleBtn = document.getElementById('simonToggleBtn');
  const statusElem = document.getElementById('simonStatus');
  const centerBadge = document.getElementById('simonCenterBadge');
  const badgeIcon = document.getElementById('simonBadgeIcon');
  const badgeText = document.getElementById('simonBadgeText');
  const startBtn = document.getElementById('simonStartBtn');

  const buttons = [
    document.getElementById('sbtn0'),
    document.getElementById('sbtn1'),
    document.getElementById('sbtn2'),
    document.getElementById('sbtn3')
  ];

  // Alternar ayuda visual
  if (toggleBtn) {
    toggleBtn.onclick = () => {
      visualHelp = !visualHelp;
      if (visualHelp) {
        toggleBtn.className = 'simon-toggle-btn';
        toggleBtn.innerHTML = '💡 Ayuda Visual: <b>ACTIVADA</b>';
        if (!gameStarted) {
          statusElem.textContent = 'Modo Normal: Las teclas se iluminan y suenan 💡';
        }
      } else {
        toggleBtn.className = 'simon-toggle-btn expert';
        toggleBtn.innerHTML = '🕶️ Oído Puro: <b>EXPERTO</b>';
        if (!gameStarted) {
          statusElem.textContent = 'Modo Experto: Chimpi no iluminará las teclas, ¡solo oído! 👂';
        }
      }
    };
  }

  // Efecto visual y sonoro sincronizado de activación
  function activateButton(idx, duration = 320, showLight = true) {
    if (!buttons[idx]) return;

    if (typeof playRetroTone === 'function') {
      playRetroTone(frequencies[idx], 'triangle', 0.22);
    }

    if (showLight) {
      buttons[idx].classList.add('active-flash');
      setTimeout(() => {
        if (buttons[idx]) buttons[idx].classList.remove('active-flash');
      }, duration);
    } else {
      // En modo sin ayuda visual: animación sutil en la insignia central al ritmo
      if (centerBadge) {
        centerBadge.style.transform = 'translate(-50%, -50%) scale(1.15)';
        centerBadge.style.borderColor = '#f1c40f';
        setTimeout(() => {
          if (centerBadge) {
            centerBadge.style.transform = 'translate(-50%, -50%) scale(1)';
            centerBadge.style.borderColor = '#f5f6fa';
          }
        }, duration);
      }
    }
  }

  function playSequence() {
    isPlayingSequence = true;
    userStep = 0;
    if (badgeIcon) badgeIcon.textContent = '🐷';
    if (badgeText) badgeText.textContent = visualHelp ? 'TOCANDO' : 'ESCUCHA';
    statusElem.style.color = '#d35400';
    statusElem.textContent = visualHelp
      ? '👀 Chimpi está tocando... ¡Observa y escucha!'
      : '👂 Chimpi tocando... ¡Usa tu oído musical!';

    // Velocidad progresiva: se vuelve más ágil en rondas altas
    const noteInterval = Math.max(420, 620 - Math.min(sequence.length * 15, 200));

    sequence.forEach((val, i) => {
      setTimeout(() => {
        activateButton(val, Math.max(240, noteInterval - 120), visualHelp);
        statusElem.textContent = visualHelp
          ? `👀 Chimpi: nota ${i + 1} de ${sequence.length}... 🐷`
          : `👂 Chimpi: nota sonora ${i + 1} de ${sequence.length}... 🎵`;
      }, (i + 1) * noteInterval);
    });

    setTimeout(() => {
      isPlayingSequence = false;
      if (badgeIcon) badgeIcon.textContent = '🐧';
      if (badgeText) badgeText.textContent = 'TU TURNO';
      statusElem.style.color = '#27ae60';
      statusElem.textContent = `✨ ¡Tu turno, Pinchi! Repite la nota 1 de ${sequence.length} 🎯`;
    }, (sequence.length + 1) * noteInterval);
  }

  function startNextRound() {
    // Actualizar récord si se supera
    const completedScore = currentRound - 1;
    if (completedScore > highScore) {
      highScore = completedScore;
      localStorage.setItem('msn_simon_highscore', highScore.toString());
      if (highScoreElem) {
        highScoreElem.innerHTML = `🏆 Récord: <b>${highScore}</b>`;
      }
    }

    if (roundElem) {
      roundElem.innerHTML = `Ronda: <b>${currentRound}</b> 🎶`;
    }

    // Agregar nueva nota aleatoria (sin límite superior, modo infinito)
    sequence.push(Math.floor(Math.random() * 4));
    setTimeout(playSequence, 550);
  }

  function startGame() {
    gameStarted = true;
    currentRound = 1;
    sequence = [];
    userStep = 0;
    isNewRecord = false;
    if (startBtn) startBtn.style.display = 'none';
    if (toggleBtn) toggleBtn.disabled = true;
    startNextRound();
  }

  if (startBtn) {
    startBtn.onclick = () => {
      startGame();
    };
  }

  // Manejo de toques en los botones (tanto en modo prueba como durante la partida)
  buttons.forEach((btn, idx) => {
    if (!btn) return;

    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();

      // En modo libre antes de empezar: permite probar cada sonido y luz
      if (!gameStarted) {
        activateButton(idx, 220, true);
        if (navigator.vibrate) try { navigator.vibrate(25); } catch (e) {}
        statusElem.textContent = `Probaste: ${idx === 0 ? 'DO (Verde 🔊)' : idx === 1 ? 'MI (Rojo 🎸)' : idx === 2 ? 'SOL (Amarillo 🐷)' : 'DO+ (Azul 🔔)'}`;
        return;
      }

      // Si Chimpi está reproduciendo la secuencia, se bloquea el input
      if (isPlayingSequence) return;

      // El jugador SIEMPRE ve encenderse la tecla que él mismo toca
      activateButton(idx, 200, true);
      if (navigator.vibrate) try { navigator.vibrate(30); } catch (e) {}

      // Comprobación de acierto
      if (idx === sequence[userStep]) {
        userStep++;
        if (userStep === sequence.length) {
          // Ronda superada con éxito
          isPlayingSequence = true;
          statusElem.style.color = '#27ae60';
          statusElem.textContent = `🌟 ¡Ronda ${currentRound} superada! Preparando siguiente...`;
          currentRound++;
          setTimeout(startNextRound, 750);
        } else {
          // Siguiente nota dentro de la ronda
          statusElem.textContent = `✨ ¡Bien! Siguiente nota (${userStep + 1} de ${sequence.length}) 👍`;
        }
      } else {
        // Fallo del jugador: fin de la partida infinita
        isPlayingSequence = true;
        const finalScore = currentRound - 1;

        if (typeof playRetroTone === 'function') {
          playRetroTone(140, 'sawtooth', 0.45);
        }
        if (navigator.vibrate) try { navigator.vibrate([150, 60, 150]); } catch (e) {}

        const isRecordBroken = finalScore > 0 && finalScore >= highScore;
        if (finalScore > highScore) {
          highScore = finalScore;
          localStorage.setItem('msn_simon_highscore', highScore.toString());
          if (highScoreElem) highScoreElem.innerHTML = `🏆 Récord: <b>${highScore}</b>`;
        }

        // Iluminar la nota correcta que tocaba pulsar
        const correctIdx = sequence[userStep];
        if (buttons[correctIdx]) {
          buttons[correctIdx].classList.add('hint-flash');
          setTimeout(() => {
            if (buttons[correctIdx]) buttons[correctIdx].classList.remove('hint-flash');
          }, 1400);
        }

        if (badgeIcon) badgeIcon.textContent = isRecordBroken ? '🏆' : '❌';
        if (badgeText) badgeText.textContent = isRecordBroken ? '¡RÉCORD!' : 'FIN';

        if (isRecordBroken && finalScore >= 3) {
          statusElem.style.color = '#27ae60';
          statusElem.innerHTML = `🎉 <b>¡NUEVO RÉCORD HISTÓRICO! Superaste ${finalScore} rondas.</b> 👑`;
          if (typeof lanzarConfetiVariasVeces === 'function') lanzarConfetiVariasVeces();
        } else {
          statusElem.style.color = '#e81123';
          statusElem.innerHTML = `Fin de partida. Lograste <b>${finalScore}</b> ${finalScore === 1 ? 'ronda' : 'rondas'}. (Era la tecla que parpadea 💡)`;
        }

        const ctrl = document.getElementById('simonControls');
        if (ctrl) {
          ctrl.innerHTML = `
            <button class="msn-game-launch-btn" style="padding:6px 14px;font-size:13px;background:#e74c3c;" onclick="openSimonGame()">
              Jugar de Nuevo 🔄
            </button>
          `;
        }
      }
    });
  });
}

window.openSimonGame = openSimonGame;
