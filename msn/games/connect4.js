// =============================================================================
// MSN GAMES - CONECTA 4: ANTÁRTIDA (PINCHI 🐧) VS PORQUERIZA (CHIMPI 🐷)
// =============================================================================

(function() {
  let boardState = []; // 6 filas x 7 columnas
  let currentTurn = 1; // 1: Pinchi 🐧, 2: Chimpi 🐷
  let isGameOver = false;
  let isLiveGame = false;
  let isChimpiRole = false;
  let isAnimating = false;

  function getConnection() {
    return (window.liveChimpi && window.liveChimpi.conn && window.liveChimpi.conn.open)
      ? window.liveChimpi.conn
      : (window._liveConnection && window._liveConnection.open ? window._liveConnection : null);
  }

  function getTurnText(turn) {
    const isPinchi = turn === 1;
    let base = isPinchi ? '¡Turno de Pinchi! 🐧' : '¡Turno de Chimpi! 🐷';
    if (isLiveGame) {
      const myPlayer = isChimpiRole ? 2 : 1;
      if (turn === myPlayer) {
        base += ' (¡Te toca!)';
      } else {
        base += ' (Esperando...)';
      }
    }
    return base;
  }

  function openConnect4Game(forceSolo) {
    if (typeof closeGameModal === 'function') closeGameModal(true);

    const modal = window.gameModal || document.getElementById('gameModal');
    const title = window.gameTitle || document.getElementById('gameTitle');
    const content = window.gameContent || document.getElementById('gameContent');

    if (title) title.innerHTML = '🔴🔵 MSN Games - Conecta 4: Antártida vs Porqueriza';

    const conn = getConnection();
    isLiveGame = !forceSolo && !!conn;
    isChimpiRole = !!window._isChimpiMode;
    window._activeLiveGame = isLiveGame ? 'Conecta 4' : null;

    initBoard();

    if (content) {
      content.innerHTML = `
        <style>
          .c4-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            user-select: none;
            width: 100%;
            max-width: 360px;
            margin: 0 auto;
          }
          .c4-header {
            font-size: 13px;
            font-weight: bold;
            color: #111;
            margin-bottom: 6px;
            text-align: center;
          }
          .c4-status-badge {
            font-size: 11px;
            padding: 3px 8px;
            border-radius: 10px;
            margin-bottom: 8px;
            font-weight: bold;
            display: inline-block;
          }
          .c4-board-frame {
            background: linear-gradient(180deg, #1055a6, #003377);
            border: 4px solid #002244;
            border-radius: 12px;
            padding: 8px 6px;
            box-shadow: 0 6px 14px rgba(0,0,0,0.35), inset 0 2px 4px rgba(255,255,255,0.4);
            position: relative;
            touch-action: manipulation;
          }
          .c4-rivets {
            position: absolute;
            width: 8px;
            height: 8px;
            background: radial-gradient(circle, #ddd 30%, #777 90%);
            border-radius: 50%;
            box-shadow: 0 1px 2px rgba(0,0,0,0.5);
          }
          .c4-grid {
            display: grid;
            grid-template-columns: repeat(7, 40px);
            grid-template-rows: repeat(6, 40px);
            gap: 6px;
            background: #002b66;
            padding: 6px;
            border-radius: 8px;
          }
          .c4-col-target {
            cursor: pointer;
            position: relative;
          }
          .c4-slot {
            width: 40px;
            height: 40px;
            background: #e9ecef;
            border-radius: 50%;
            box-shadow: inset 0 3px 5px rgba(0,0,0,0.45);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            position: relative;
            overflow: hidden;
          }
          .c4-piece-1 {
            background: radial-gradient(circle at 35% 35%, #70a1ff, #1e90ff);
            border: 2px solid #0984e3;
            border-radius: 50%;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          }
          .c4-piece-2 {
            background: radial-gradient(circle at 35% 35%, #ff9ff3, #f368e0);
            border: 2px solid #e056fd;
            border-radius: 50%;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          }
          .c4-dropping {
            animation: c4-drop-anim 0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          @keyframes c4-drop-anim {
            0% { transform: translateY(var(--drop-from, -240px)); opacity: 0.8; }
            80% { transform: translateY(4px); }
            100% { transform: translateY(0); opacity: 1; }
          }
          .c4-actions {
            margin-top: 10px;
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            justify-content: center;
          }
        </style>

        <div class="c4-container">
          <div class="c4-header">
            🔴🔵 <b>Conecta 4:</b> Pinchi 🐧 vs Chimpi 🐷
          </div>

          <div id="c4StatusBadge" class="c4-status-badge" style="background:#e7f5ff;color:#0078d7;">
            ${isLiveGame ? '🟢 Partida P2P en Vivo' : '👤 Modo Solitario (contra Chimpi IA)'}
          </div>

          <div id="c4TurnIndicator" style="font-size:13px;font-weight:bold;color:#0078d7;margin-bottom:8px;">
            ${getTurnText(1)}
          </div>

          <div class="c4-board-frame">
            <div class="c4-rivets" style="top:4px;left:4px;"></div>
            <div class="c4-rivets" style="top:4px;right:4px;"></div>
            <div class="c4-rivets" style="bottom:4px;left:4px;"></div>
            <div class="c4-rivets" style="bottom:4px;right:4px;"></div>

            <div class="c4-grid" id="c4Grid">
              ${renderGridHtml()}
            </div>
          </div>

          <div id="c4Banner" style="font-size:12px;color:#d35400;font-weight:bold;margin-top:8px;min-height:18px;"></div>

          <div class="c4-actions">
            <button class="msn-game-launch-btn" style="padding:6px 14px;font-size:12px;" onclick="window.restartConnect4Game()">
              🔄 Reiniciar Partida
            </button>
            ${typeof hubBackBtnHtml === 'function' ? hubBackBtnHtml() : ''}
          </div>
        </div>
      `;

      attachGridListeners();
    }

    if (modal) modal.style.display = 'flex';
  }

  function initBoard() {
    boardState = [];
    for (let r = 0; r < 6; r++) {
      boardState.push(new Array(7).fill(0));
    }
    currentTurn = 1; // 1 = Pinchi siempre empieza
    isGameOver = false;
    isAnimating = false;
  }

  function renderGridHtml() {
    let html = '';
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 7; c++) {
        const val = boardState[r][c];
        let pieceHtml = '';
        if (val === 1) pieceHtml = '<div class="c4-piece-1">🐧</div>';
        else if (val === 2) pieceHtml = '<div class="c4-piece-2">🐷</div>';
        html += `<div class="c4-slot" data-row="${r}" data-col="${c}">${pieceHtml}</div>`;
      }
    }
    return html;
  }

  function attachGridListeners() {
    const grid = document.getElementById('c4Grid');
    if (!grid) return;
    grid.onclick = (e) => {
      const slot = e.target.closest('.c4-slot');
      if (!slot || isGameOver || isAnimating) return;
      const col = parseInt(slot.getAttribute('data-col'), 10);
      handleColumnClick(col);
    };
  }

  function handleColumnClick(col) {
    if (isGameOver || isAnimating) return;

    // Validación de turno en modo P2P
    if (isLiveGame) {
      const myPlayer = isChimpiRole ? 2 : 1;
      if (currentTurn !== myPlayer) {
        showBanner('⏳ Espera el turno de tu rival...');
        return;
      }
    }

    const targetRow = getLowestEmptyRow(col);
    if (targetRow === -1) {
      showBanner('⚠️ Esa columna ya está llena');
      return;
    }

    const playerMoving = currentTurn;

    makeMove(col, playerMoving);

    // Enviar por WebRTC
    if (isLiveGame) {
      const conn = getConnection();
      if (conn) {
        try {
          conn.send({
            type: 'C4_DROP',
            col: col,
            player: playerMoving
          });
        } catch (e) {}
      }
    } else {
      // Turno de la IA en solitario si el siguiente es Chimpi
      if (!isGameOver && currentTurn === 2) {
        isAnimating = true;
        setTimeout(() => {
          makeAIMove();
        }, 600);
      }
    }
  }

  function getLowestEmptyRow(col) {
    for (let r = 5; r >= 0; r--) {
      if (boardState[r][col] === 0) return r;
    }
    return -1;
  }

  function playDropSound() {
    try {
      const ctx = window.retroAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  }

  function playWinSound() {
    const notes = [261.63, 329.63, 392.00, 523.25]; // Do - Mi - Sol - Do agudo
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (typeof playRetroTone === 'function') playRetroTone(freq, 'triangle', 0.22);
      }, idx * 120);
    });
    if (navigator.vibrate) try { navigator.vibrate([100, 50, 100, 50, 200]); } catch (e) {}
    if (typeof dispararConfetiCanvas === 'function') dispararConfetiCanvas();
  }

  function playLoseSound() {
    const notes = [440, 370, 310, 220];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (typeof playRetroTone === 'function') playRetroTone(freq, 'sawtooth', 0.18);
      }, idx * 110);
    });
    if (navigator.vibrate) try { navigator.vibrate(200); } catch (e) {}
  }

  function makeMove(col, player) {
    const r = getLowestEmptyRow(col);
    if (r === -1) return false;

    boardState[r][col] = player;
    playDropSound();

    isAnimating = true;
    const grid = document.getElementById('c4Grid');
    if (grid) {
      const slot = grid.querySelector(`.c4-slot[data-row="${r}"][data-col="${col}"]`);
      if (slot) {
        const piece = document.createElement('div');
        piece.className = `c4-piece-${player} c4-dropping`;
        piece.innerHTML = player === 1 ? '🐧' : '🐷';
        const dropPx = (r + 1) * 46;
        piece.style.setProperty('--drop-from', `-${dropPx}px`);
        slot.innerHTML = '';
        slot.appendChild(piece);
        setTimeout(() => {
          piece.classList.remove('c4-dropping');
        }, 340);
      } else {
        grid.innerHTML = renderGridHtml();
      }
    }

    setTimeout(() => {
      if (isLiveGame || currentTurn === 1 || isGameOver) {
        isAnimating = false;
      }
    }, 340);

    if (checkWin(r, col, player)) {
      isGameOver = true;
      isAnimating = false;
      const winnerName = player === 1 ? '¡Pinchi 🐧 ha ganado!' : '¡Chimpi 🐷 ha ganado!';
      updateTurnIndicator(`🏆 ${winnerName}`, '#28a745');

      const isMe = (isLiveGame && ((player === 1 && !isChimpiRole) || (player === 2 && isChimpiRole))) || (!isLiveGame && player === 1);
      if (isMe) playWinSound();
      else playLoseSound();
      return true;
    }

    if (checkDraw()) {
      isGameOver = true;
      isAnimating = false;
      updateTurnIndicator('🤝 ¡Empate en el tablero!', '#e67e22');
      if (typeof playRetroTone === 'function') playRetroTone(300, 'sine', 0.3);
      return true;
    }

    currentTurn = player === 1 ? 2 : 1;
    const nextName = getTurnText(currentTurn);
    const nextColor = currentTurn === 1 ? '#0078d7' : '#e84393';
    updateTurnIndicator(nextName, nextColor);
    return true;
  }

  function checkWin(row, col, p) {
    const directions = [
      [[0, 1], [0, -1]], // Horizontal
      [[1, 0], [-1, 0]], // Vertical
      [[1, 1], [-1, -1]], // Diagonal \
      [[1, -1], [-1, 1]]  // Diagonal /
    ];

    for (let i = 0; i < directions.length; i++) {
      let count = 1;
      for (let j = 0; j < 2; j++) {
        const [dr, dc] = directions[i][j];
        let r = row + dr;
        let c = col + dc;
        while (r >= 0 && r < 6 && c >= 0 && c < 7 && boardState[r][c] === p) {
          count++;
          r += dr;
          c += dc;
        }
      }
      if (count >= 4) return true;
    }
    return false;
  }

  function checkDraw() {
    for (let c = 0; c < 7; c++) {
      if (boardState[0][c] === 0) return false;
    }
    return true;
  }

  function updateTurnIndicator(text, color) {
    const ind = document.getElementById('c4TurnIndicator');
    if (ind) {
      ind.textContent = text;
      ind.style.color = color || '#0078d7';
    }
    showBanner('');
  }

  function showBanner(text) {
    const banner = document.getElementById('c4Banner');
    if (banner) banner.textContent = text;
  }

  // IA para juego en solitario
  function makeAIMove() {
    if (isGameOver) return;
    // 1. ¿Puede ganar la IA en esta jugada?
    for (let c = 0; c < 7; c++) {
      const r = getLowestEmptyRow(c);
      if (r !== -1) {
        boardState[r][c] = 2;
        const wins = checkWin(r, c, 2);
        boardState[r][c] = 0;
        if (wins) {
          makeMove(c, 2);
          return;
        }
      }
    }
    // 2. ¿Puede ganar Pinchi en la siguiente jugada? Bloquear
    for (let c = 0; c < 7; c++) {
      const r = getLowestEmptyRow(c);
      if (r !== -1) {
        boardState[r][c] = 1;
        const blocks = checkWin(r, c, 1);
        boardState[r][c] = 0;
        if (blocks) {
          makeMove(c, 2);
          return;
        }
      }
    }
    // 3. Jugar columna central o aleatoria preferente
    const prefCols = [3, 2, 4, 1, 5, 0, 6];
    for (let c of prefCols) {
      if (getLowestEmptyRow(c) !== -1) {
        makeMove(c, 2);
        return;
      }
    }
  }

  window.restartConnect4Game = function() {
    initBoard();
    const grid = document.getElementById('c4Grid');
    if (grid) grid.innerHTML = renderGridHtml();
    updateTurnIndicator(getTurnText(1), '#0078d7');
    if (isLiveGame) {
      const conn = getConnection();
      if (conn) try { conn.send({ type: 'C4_RESTART' }); } catch (e) {}
    }
  };

  // Manejador de eventos remotos WebRTC
  window._handleRemoteConnect4Drop = function(data) {
    if (!data || typeof data.col !== 'number') return;
    const remotePlayer = (typeof data.player === 'number') ? data.player : (isChimpiRole ? 1 : 2);
    makeMove(data.col, remotePlayer);
  };

  window._handleRemoteConnect4Restart = function() {
    initBoard();
    const grid = document.getElementById('c4Grid');
    if (grid) grid.innerHTML = renderGridHtml();
    updateTurnIndicator('¡Partida reiniciada! ' + getTurnText(1), '#0078d7');
  };

  window.openConnect4Game = openConnect4Game;
})();
