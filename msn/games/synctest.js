// =============================================================================
// MSN GAMES - PAREJA SINCRONIZADA (EL DESAFÍO TELEPÁTICO)
// =============================================================================

(function() {
  const QUESTIONS = [
    { q: "¿Quién tarda más en vestirse?", a: "🐧 Pinchi", b: "🐷 Chimpi" },
    { q: "Plan perfecto de día de lluvia:", a: "🎬 Cine y Palomitas", b: "🛋️ Peli, Manta y Siesta" },
    { q: "Cena improvisada de viernes:", a: "🍕 Pizza artesana", b: "🍔 Hamburguesa grasienta" },
    { q: "¿Quién se pone de mal humor antes si tiene hambre?", a: "🐧 Pinchi", b: "🐷 Chimpi" },
    { q: "¿Playa o montaña para desconectar?", a: "🏖️ Calita tranquila", b: "🏔️ Cabaña en la montaña" },
    { q: "Postre obligatorio e indiscutible:", a: "🍫 Mucho Chocolate", b: "🍦 Helado cremoso" },
    { q: "¿Quién suele pedir perdón primero tras una tontería?", a: "🐧 Pinchi", b: "🐷 Chimpi" },
    { q: "Viaje soñado para perderse juntos:", a: "🗼 Gran ciudad cosmopolita", b: "🌴 Isla paradisíaca" },
    { q: "Fin de semana ideal:", a: "💃 Salir de terraceo y fiesta", b: "😴 Modo marmota total" },
    { q: "Banda sonora en el coche:", a: "🎸 Pop Rock de los 2000s", b: "🎧 Temazos variados" },
    { q: "¿Quién es más propenso a perder las llaves o el móvil?", a: "🐧 Pinchi", b: "🐷 Chimpi" },
    { q: "¿Desayuno de domingo perfecto?", a: "🥐 Café y cruasán dulce", b: "🥓 Desayuno salado con huevos" },
    { q: "Viendo una película de miedo:", a: "🫣 Taparse con la manta", b: "🍿 Comer palomitas sin inmutarse" },
    { q: "¿Quién cocina con más cariño los findes?", a: "🐧 Pinchi", b: "🐷 Chimpi" },
    { q: "¿Quién da los mejores abrazos achuchables?", a: "🐧 Pinchi", b: "🐷 Chimpi" }
  ];

  let currentIndex = 0;
  let score = 0;
  let localChoice = null;
  let remoteChoice = null;
  let isWaitingRemote = false;
  let isLiveGame = false;
  let isChimpiRole = false;

  function getConnection() {
    return (window.liveChimpi && window.liveChimpi.conn && window.liveChimpi.conn.open)
      ? window.liveChimpi.conn
      : (window._liveConnection && window._liveConnection.open ? window._liveConnection : null);
  }

  function openSyncTestGame(forceSolo) {
    if (typeof closeGameModal === 'function') closeGameModal(true);

    const modal = window.gameModal || document.getElementById('gameModal');
    const title = window.gameTitle || document.getElementById('gameTitle');
    const content = window.gameContent || document.getElementById('gameContent');

    if (title) title.innerHTML = '🔮 MSN Games - Desafío Telepático: Pareja Sincronizada';

    const conn = getConnection();
    isLiveGame = !forceSolo && !!conn;
    isChimpiRole = !!window._isChimpiMode;
    window._activeLiveGame = isLiveGame ? 'Desafío Telepático' : null;

    currentIndex = 0;
    score = 0;
    localChoice = null;
    remoteChoice = null;
    isWaitingRemote = false;

    renderQuestionUI();

    if (modal) modal.style.display = 'flex';
  }

  function renderQuestionUI() {
    const content = window.gameContent || document.getElementById('gameContent');
    if (!content) return;

    if (currentIndex >= QUESTIONS.length) {
      renderFinalResults();
      return;
    }

    const item = QUESTIONS[currentIndex];

    content.innerHTML = `
      <style>
        .sync-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 340px;
          margin: 0 auto;
          user-select: none;
        }
        .sync-card {
          width: 320px;
          min-height: 230px;
          background: #ffffff;
          border: 3px solid #70a1ff;
          border-radius: 12px;
          box-shadow: 0 6px 14px rgba(0,0,0,0.15);
          padding: 16px 14px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          perspective: 1000px;
          transition: transform 0.6s;
        }
        .sync-card.flipped {
          transform: rotateY(360deg);
        }
        .sync-question-num {
          font-size: 11px;
          font-weight: bold;
          color: #747d8c;
          text-transform: uppercase;
        }
        .sync-question-title {
          font-size: 15px;
          font-weight: bold;
          color: #2f3542;
          text-align: center;
          margin: 12px 0 16px;
        }
        .sync-options-row {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
        }
        .sync-btn-option {
          background: linear-gradient(180deg, #f1f2f6, #e4e7eb);
          border: 2px solid #0078d7;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 13px;
          font-weight: bold;
          color: #2f3542;
          cursor: pointer;
          transition: all 0.15s;
          text-align: center;
        }
        .sync-btn-option:hover {
          background: #e7f5ff;
        }
        .sync-btn-option.selected {
          background: #0078d7;
          color: #fff;
          border-color: #004a9f;
        }
        .sync-status-box {
          margin-top: 10px;
          font-size: 12px;
          font-weight: bold;
          min-height: 22px;
          text-align: center;
        }
      </style>

      <div class="sync-container">
        <div style="display:flex;justify-content:space-between;width:320px;font-size:12px;font-weight:bold;margin-bottom:6px;">
          <span style="color:#0078d7;">Afinidad: <b id="syncScoreBadge">${score} / ${QUESTIONS.length}</b> ✨</span>
          <span style="color:#747d8c;">Pregunta ${currentIndex + 1} de ${QUESTIONS.length}</span>
        </div>

        <div class="sync-card" id="syncCard">
          <div class="sync-question-num">🔮 Telepatía MSN #${currentIndex + 1}</div>
          <div class="sync-question-title">${item.q}</div>

          <div class="sync-options-row" id="syncOptionsRow">
            <button class="sync-btn-option" id="btnOptA" onclick="window.onSyncVote('A')">
              🅰️ ${item.a}
            </button>
            <button class="sync-btn-option" id="btnOptB" onclick="window.onSyncVote('B')">
              🅱️ ${item.b}
            </button>
          </div>
        </div>

        <div class="sync-status-box" id="syncStatusBox">
          Vota en secreto y descubre si pensáis igual 🤫
        </div>

        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
          <button class="msn-game-launch-btn" style="padding:5px 12px;font-size:12px;" onclick="window.restartSyncTestGame()">
            🔄 Reiniciar Test
          </button>
          ${typeof hubBackBtnHtml === 'function' ? hubBackBtnHtml() : ''}
        </div>
      </div>
    `;
  }

  window.onSyncVote = function(choice) {
    if (localChoice !== null) return;
    localChoice = choice;

    const btnA = document.getElementById('btnOptA');
    const btnB = document.getElementById('btnOptB');
    if (choice === 'A' && btnA) btnA.classList.add('selected');
    if (choice === 'B' && btnB) btnB.classList.add('selected');

    if (typeof playRetroTone === 'function') playRetroTone(440, 'triangle', 0.1);

    if (isLiveGame) {
      const conn = getConnection();
      if (conn) {
        try {
          conn.send({
            type: 'SYNC_VOTE',
            qIndex: currentIndex,
            choice: choice
          });
        } catch (e) {}
      }

      const statusBox = document.getElementById('syncStatusBox');
      if (remoteChoice === null) {
        isWaitingRemote = true;
        if (statusBox) {
          statusBox.innerHTML = `<span style="color:#0078d7;">✏️ Esperando a que tu pareja vote...</span>`;
        }
      } else {
        revealAnswers(localChoice, remoteChoice);
      }
    } else {
      // Modo solitario: IA responde (70% afinidad natural de pareja)
      const isMatch = Math.random() < 0.75;
      const aiChoice = isMatch ? choice : (choice === 'A' ? 'B' : 'A');
      revealAnswers(localChoice, aiChoice);
    }
  };

  function revealAnswers(choiceP, choiceC) {
    const card = document.getElementById('syncCard');
    if (card) card.classList.add('flipped');

    const isMatch = choiceP === choiceC;
    const statusBox = document.getElementById('syncStatusBox');
    const item = QUESTIONS[currentIndex];

    const textLocal = choiceP === 'A' ? item.a : item.b;
    const textRemote = choiceC === 'A' ? item.a : item.b;

    if (isMatch) {
      score++;
      if (statusBox) {
        statusBox.innerHTML = `
          <span style="color:#28a745;">
            💖 ¡¡COINCIDENCIA TELEPÁTICA!! Ambos eligieron: <b>${textLocal}</b> (+1)
          </span>
        `;
      }
      if (typeof playRetroTone === 'function') playRetroTone(587.33, 'triangle', 0.25);
      if (navigator.vibrate) try { navigator.vibrate([80, 50, 80]); } catch (e) {}
    } else {
      if (statusBox) {
        statusBox.innerHTML = `
          <span style="color:#e67e22;">
            🤷 ¡Discrepancia divertida! Tú: "${textLocal}" vs Pareja: "${textRemote}"
          </span>
        `;
      }
      if (typeof playRetroTone === 'function') playRetroTone(293.66, 'sine', 0.2);
    }

    const badge = document.getElementById('syncScoreBadge');
    if (badge) badge.textContent = `${score} / ${QUESTIONS.length}`;

    setTimeout(() => {
      currentIndex++;
      localChoice = null;
      remoteChoice = null;
      isWaitingRemote = false;
      renderQuestionUI();
    }, 2800);
  }

  function renderFinalResults() {
    const content = window.gameContent || document.getElementById('gameContent');
    if (!content) return;

    const isMaster = score >= 7;

    content.innerHTML = `
      <div style="text-align:center;padding:16px 8px;">
        <div style="font-size:48px;margin-bottom:8px;">${isMaster ? '🏆' : '💖'}</div>
        <div style="font-size:18px;font-weight:bold;color:#0078d7;margin-bottom:6px;">
          Resultado del Desafío Telepático
        </div>
        <div style="font-size:14px;color:#333;margin-bottom:12px;">
          Afinidad lograda: <b>${score} de ${QUESTIONS.length} aciertos</b>
        </div>

        ${isMaster ? `
          <div style="background:linear-gradient(135deg, #fff9e6, #ffeaa7);border:3px dashed #f39c12;border-radius:12px;padding:12px;margin:12px auto;max-width:290px;">
            <div style="font-size:18px;font-weight:bold;color:#d35400;">📜 DIPLOMA OFICIAL MSN</div>
            <div style="font-size:13px;font-weight:bold;color:#2f3542;margin:6px 0;">
              ✨ ALMAS GEMELAS MILLENNIAL ✨
            </div>
            <div style="font-size:11px;color:#555;">
              Certificado que Pinchi 🐧 y Chimpi 🐷 leen la mente del otro con precisión sobrenatural.
            </div>
          </div>
        ` : `
          <div style="background:#f1f2f6;border:2px solid #70a1ff;border-radius:10px;padding:10px;margin:12px auto;max-width:280px;font-size:12px;color:#444;">
            ¡Los polos opuestos se atraen! Lo que os hace únicos es lo que más os une. 🐧🐷💕
          </div>
        `}

        <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
          <button class="msn-game-launch-btn" style="padding:6px 14px;font-size:13px;" onclick="window.restartSyncTestGame()">
            🔄 Volver a Jugar
          </button>
          ${typeof hubBackBtnHtml === 'function' ? hubBackBtnHtml() : ''}
        </div>
      </div>
    `;

    if (isMaster) {
      if (typeof dispararConfetiCanvas === 'function') dispararConfetiCanvas();
    }
  }

  window.restartSyncTestGame = function() {
    openSyncTestGame(!isLiveGame);
  };

  // Manejador WebRTC
  window._handleRemoteSyncVote = function(data) {
    if (!data || data.qIndex !== currentIndex) return;
    remoteChoice = data.choice;
    if (localChoice !== null) {
      revealAnswers(localChoice, remoteChoice);
    }
  };

  window.openSyncTestGame = openSyncTestGame;
})();
