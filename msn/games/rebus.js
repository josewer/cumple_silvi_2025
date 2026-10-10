// =============================================================================
// MSN GAMES - JEROGLÍFICO MSN (DUELO DE EMOJIS RETRO / REBUS)
// =============================================================================

(function() {
  const RETRO_EMOTICONS = [
    { code: '(L)', icon: '❤️', label: 'Corazón' },
    { code: '(K)', icon: '💋', label: 'Beso' },
    { code: '(H)', icon: '😎', label: 'Chulo' },
    { code: '(P)', icon: '📷', label: 'Cámara' },
    { code: ':-O', icon: '😮', label: 'Sorpresa' },
    { code: '(S)', icon: '🌙', label: 'Luna' },
    { code: '(6)', icon: '😈', label: 'Diablillo' },
    { code: '(U)', icon: '💔', label: 'Roto' },
    { code: '(8)', icon: '🎵', label: 'Música' },
    { code: '(I)', icon: '💡', label: 'Idea' },
    { code: '(C)', icon: '☕', label: 'Café' },
    { code: '(D)', icon: '🍸', label: 'Copa' },
    { code: '🐧', icon: '🐧', label: 'Pinchi' },
    { code: '🐷', icon: '🐷', label: 'Chimpi' },
    { code: '❄️', icon: '❄️', label: 'Nieve' },
    { code: '🎂', icon: '🎂', label: 'Tarta' }
  ];

  const PUZZLES = [
    {
      id: 1,
      target: "Complicated - Avril Lavigne",
      hint: "Canción 2000s favorita en el chat",
      options: [
        "Complicated - Avril Lavigne",
        "Sk8er Boi - Avril Lavigne",
        "Aserejé - Las Ketchup",
        "Torn - Natalie Imbruglia"
      ],
      aiEmojis: ['(8)', '😮', '(U)', '🎸']
    },
    {
      id: 2,
      target: "Viaje en tren con nieve",
      hint: "Aventura romántica",
      options: [
        "Viaje en tren con nieve",
        "Paseo en bici por la playa",
        "Día de compras en el centro",
        "Vuelo en avión a París"
      ],
      aiEmojis: ['❄️', '🐧', '🚂', '❤️']
    },
    {
      id: 3,
      target: "Desayuno con café y besitos",
      hint: "Mañanas de fin de semana",
      options: [
        "Desayuno con café y besitos",
        "Cena de hamburguesa rápida",
        "Merienda de palomitas",
        "Brunch con amigos"
      ],
      aiEmojis: ['(C)', '🥐', '(K)', '(L)']
    },
    {
      id: 4,
      target: "Cerdito zampando tarta de cumple",
      hint: "Momento gastronómico dulce",
      options: [
        "Cerdito zampando tarta de cumple",
        "Pingüino pescando en el hielo",
        "Siesta larga en el sofá",
        "Fiesta de disfraces retro"
      ],
      aiEmojis: ['🐷', '🎂', '😋', '❤️']
    },
    {
      id: 5,
      target: "Zumbido a las 3 de la mañana",
      hint: "Clásico de MSN",
      options: [
        "Zumbido a las 3 de la mañana",
        "Llamada perdida misteriosa",
        "Mensaje de buenas noches",
        "Alarma de madrugón"
      ],
      aiEmojis: ['🔔', '🌙', '😮', '⚡']
    }
  ];

  let currentRound = 1;
  let totalRounds = 3;
  let score = 0;
  let isSender = true;
  let currentPuzzle = null;
  let selectedEmojis = [];
  let isLiveGame = false;
  let isChimpiRole = false;

  function getConnection() {
    return (window.liveChimpi && window.liveChimpi.conn && window.liveChimpi.conn.open)
      ? window.liveChimpi.conn
      : (window._liveConnection && window._liveConnection.open ? window._liveConnection : null);
  }

  function openRebusGame(forceSolo) {
    if (typeof closeGameModal === 'function') closeGameModal(true);

    const modal = window.gameModal || document.getElementById('gameModal');
    const title = window.gameTitle || document.getElementById('gameTitle');
    const content = window.gameContent || document.getElementById('gameContent');

    if (title) title.innerHTML = '😎 MSN Games - Jeroglífico MSN: Adivina con Emoticonos';

    const conn = getConnection();
    isLiveGame = !forceSolo && !!conn;
    isChimpiRole = !!window._isChimpiMode;
    window._activeLiveGame = isLiveGame ? 'Jeroglífico MSN' : null;

    currentRound = 1;
    score = 0;
    isSender = isLiveGame ? !isChimpiRole : true; // Pinchi envía primero
    loadNextPuzzle();

    if (modal) modal.style.display = 'flex';
  }

  function loadNextPuzzle() {
    const pIdx = (currentRound - 1) % PUZZLES.length;
    currentPuzzle = PUZZLES[pIdx];
    selectedEmojis = [];

    renderRebusUI();
  }

  function renderRebusUI() {
    const content = window.gameContent || document.getElementById('gameContent');
    if (!content) return;

    if (currentRound > totalRounds) {
      renderFinalResults();
      return;
    }

    if (isSender) {
      // Vista del EMISOR (Elige emojis para que el otro adivine)
      const emoticonsHtml = RETRO_EMOTICONS.map(e => `
        <button class="rebus-emoji-btn" onclick="window.onSelectRebusEmoji('${e.icon}')">
          <span style="font-size:22px;">${e.icon}</span>
          <span style="font-size:9px;color:#666;">${e.code}</span>
        </button>
      `).join('');

      content.innerHTML = `
        <style>
          .rebus-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            max-width: 340px;
            margin: 0 auto;
            user-select: none;
          }
          .rebus-task-card {
            width: 100%;
            background: #e7f5ff;
            border: 2px solid #0078d7;
            border-radius: 8px;
            padding: 10px;
            box-sizing: border-box;
            text-align: center;
            margin-bottom: 10px;
          }
          .rebus-sequence-box {
            width: 100%;
            min-height: 50px;
            background: #ffffff;
            border: 2px dashed #0078d7;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-size: 28px;
            margin-bottom: 10px;
            padding: 4px;
            box-sizing: border-box;
          }
          .rebus-keyboard {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 6px;
            width: 100%;
            margin-bottom: 10px;
          }
          .rebus-emoji-btn {
            background: #f1f2f6;
            border: 1px solid #718093;
            border-radius: 6px;
            padding: 6px 2px;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            touch-action: manipulation;
          }
          .rebus-emoji-btn:active {
            background: #dcdde1;
          }
        </style>

        <div class="rebus-container">
          <div style="display:flex;justify-content:space-between;width:100%;font-size:12px;font-weight:bold;margin-bottom:6px;">
            <span style="color:#0078d7;">Ronda ${currentRound} de ${totalRounds}</span>
            <span style="color:#28a745;">Puntos: ${score}</span>
          </div>

          <div class="rebus-task-card">
            <div style="font-size:11px;color:#004a9f;font-weight:bold;">¡Haz que tu pareja adivine esta frase!</div>
            <div style="font-size:14px;font-weight:bold;color:#111;margin:4px 0;">"${currentPuzzle.target}"</div>
            <div style="font-size:11px;color:#777;font-style:italic;">Pista: ${currentPuzzle.hint}</div>
          </div>

          <div style="font-size:11px;color:#555;margin-bottom:4px;font-weight:bold;">Elige de 2 a 5 emoticonos retro:</div>
          <div class="rebus-sequence-box" id="rebusSequence">
            ${selectedEmojis.length ? selectedEmojis.join(' ') : '<span style="font-size:12px;color:#aaa;">(Toca los emoticonos abajo)</span>'}
          </div>

          <div class="rebus-keyboard">
            ${emoticonsHtml}
          </div>

          <div style="display:flex;gap:8px;width:100%;justify-content:center;">
            <button class="msn-game-launch-btn" style="background:#e74c3c;padding:6px 12px;font-size:12px;" onclick="window.clearRebusSequence()">
              🗑️ Borrar
            </button>
            <button class="msn-game-launch-btn" style="background:#28a745;padding:6px 16px;font-size:12px;font-weight:bold;" onclick="window.sendRebusSequence()">
              🚀 Enviar al Rival
            </button>
          </div>

          <div style="margin-top:10px;">
            ${typeof hubBackBtnHtml === 'function' ? hubBackBtnHtml() : ''}
          </div>
        </div>
      `;
    } else {
      // Vista del RECEPTOR (Adivina a partir de los emojis recibidos)
      renderReceiverUI(currentPuzzle.aiEmojis);
    }
  }

  function renderReceiverUI(emojis) {
    const content = window.gameContent || document.getElementById('gameContent');
    if (!content) return;

    const optionsHtml = currentPuzzle.options.map(opt => `
      <button class="rebus-opt-btn" onclick="window.onRebusGuess('${opt}')">
        ${opt}
      </button>
    `).join('');

    content.innerHTML = `
      <style>
        .rebus-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 340px;
          margin: 0 auto;
          user-select: none;
        }
        .rebus-bouncing-box {
          width: 100%;
          height: 90px;
          background: linear-gradient(135deg, #f7f1e3, #dff9fb);
          border: 2px solid #0078d7;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-size: 38px;
          margin: 10px 0;
          box-shadow: inset 0 2px 6px rgba(0,0,0,0.1);
          animation: rebus-float 1.2s infinite alternate ease-in-out;
        }
        @keyframes rebus-float {
          0% { transform: translateY(0); }
          100% { transform: translateY(-6px); }
        }
        .rebus-options-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }
        .rebus-opt-btn {
          background: #ffffff;
          border: 2px solid #70a1ff;
          border-radius: 8px;
          padding: 10px;
          font-size: 13px;
          font-weight: bold;
          color: #2f3542;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s;
        }
        .rebus-opt-btn:hover {
          background: #e7f5ff;
          border-color: #0078d7;
        }
      </style>

      <div class="rebus-container">
        <div style="display:flex;justify-content:space-between;width:100%;font-size:12px;font-weight:bold;">
          <span style="color:#0078d7;">Ronda ${currentRound} de ${totalRounds}</span>
          <span style="color:#28a745;">Puntos: ${score}</span>
        </div>

        <div style="font-size:13px;font-weight:bold;color:#333;margin-top:8px;">
          ¿Qué significa este jeroglífico retro?
        </div>

        <div class="rebus-bouncing-box">
          ${emojis.join(' ')}
        </div>

        <div class="rebus-options-list">
          ${optionsHtml}
        </div>

        <div id="rebusFeedback" style="font-size:13px;font-weight:bold;margin-top:8px;min-height:18px;text-align:center;"></div>

        <div style="margin-top:10px;">
          ${typeof hubBackBtnHtml === 'function' ? hubBackBtnHtml() : ''}
        </div>
      </div>
    `;
  }

  window.onSelectRebusEmoji = function(emoji) {
    if (selectedEmojis.length >= 5) return;
    selectedEmojis.push(emoji);
    const box = document.getElementById('rebusSequence');
    if (box) box.textContent = selectedEmojis.join(' ');
    if (typeof playRetroTone === 'function') playRetroTone(520, 'sine', 0.05);
  };

  window.clearRebusSequence = function() {
    selectedEmojis = [];
    const box = document.getElementById('rebusSequence');
    if (box) box.innerHTML = '<span style="font-size:12px;color:#aaa;">(Toca los emoticonos abajo)</span>';
  };

  window.sendRebusSequence = function() {
    if (selectedEmojis.length < 2) {
      alert("Selecciona al menos 2 emoticonos para que tenga sentido.");
      return;
    }

    if (isLiveGame) {
      const conn = getConnection();
      if (conn) {
        try {
          conn.send({
            type: 'REBUS_SEND',
            emojis: selectedEmojis,
            secretId: currentPuzzle.id
          });
        } catch (e) {}
      }
      const content = window.gameContent || document.getElementById('gameContent');
      if (content) {
        content.innerHTML = `
          <div style="text-align:center;padding:24px;">
            <div style="font-size:36px;margin-bottom:8px;">📨</div>
            <div style="font-size:14px;font-weight:bold;color:#0078d7;">¡Jeroglífico enviado!</div>
            <div style="font-size:12px;color:#555;margin-top:4px;">Esperando a que tu pareja adivine... ⏳</div>
          </div>
        `;
      }
    } else {
      // En solitario, simular que pasamos a adivinar la IA
      isSender = false;
      renderRebusUI();
    }
  };

  window.onRebusGuess = function(guess) {
    const isCorrect = guess === currentPuzzle.target;
    const fb = document.getElementById('rebusFeedback');

    if (isCorrect) {
      score++;
      if (fb) {
        fb.style.color = '#28a745';
        fb.textContent = '🎉 ¡CORRECTO! ¡Has descifrado el jeroglífico! (+1)';
      }
      if (typeof playRetroTone === 'function') playRetroTone(659.25, 'triangle', 0.25);
      if (navigator.vibrate) try { navigator.vibrate([80, 50, 80]); } catch (e) {}
    } else {
      if (fb) {
        fb.style.color = '#e74c3c';
        fb.textContent = `❌ Era: "${currentPuzzle.target}". ¡Casi!`;
      }
      if (typeof playRetroTone === 'function') playRetroTone(240, 'sawtooth', 0.2);
    }

    setTimeout(() => {
      currentRound++;
      isSender = !isSender;
      loadNextPuzzle();
    }, 2200);
  };

  function renderFinalResults() {
    const content = window.gameContent || document.getElementById('gameContent');
    if (!content) return;

    content.innerHTML = `
      <div style="text-align:center;padding:16px 8px;">
        <div style="font-size:46px;margin-bottom:6px;">😎✨</div>
        <div style="font-size:16px;font-weight:bold;color:#0078d7;margin-bottom:6px;">
          ¡Duelo de Jeroglíficos Finalizado!
        </div>
        <div style="font-size:14px;color:#333;margin-bottom:12px;">
          Puntuación conseguida: <b>${score} de ${totalRounds} aciertos</b>
        </div>
        <div style="background:#e7f5ff;border:2px solid #70a1ff;border-radius:10px;padding:10px;margin:12px auto;max-width:280px;font-size:12px;color:#333;">
          ¡Domináis el lenguaje secreto de los emoticonos MSN como auténticos veteranos del Messenger! 🐧🐷💌
        </div>
        <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
          <button class="msn-game-launch-btn" style="padding:6px 14px;font-size:13px;" onclick="openRebusGame(!isLiveGame)">
            🔄 Volver a Jugar
          </button>
          ${typeof hubBackBtnHtml === 'function' ? hubBackBtnHtml() : ''}
        </div>
      </div>
    `;

    if (score >= 2) {
      if (typeof dispararConfetiCanvas === 'function') dispararConfetiCanvas();
    }
  }

  // Manejador WebRTC
  window._handleRemoteRebusSend = function(data) {
    if (!data || !data.emojis) return;
    const found = PUZZLES.find(p => p.id === data.secretId) || currentPuzzle;
    currentPuzzle = found;
    isSender = false;
    renderReceiverUI(data.emojis);
  };

  window.openRebusGame = openRebusGame;
})();
