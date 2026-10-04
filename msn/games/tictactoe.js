// ==========================================
// MSN GAMES - TRES EN RAYA: PINCHI 🐧 VS CHIMPI 🐷
// ==========================================

function openTicTacToeGame() {
  closeGameModal();

  var modal = window.gameModal || document.getElementById('gameModal');
  var title = window.gameTitle || document.getElementById('gameTitle');
  var content = window.gameContent || document.getElementById('gameContent');

  if (title) title.textContent = '❌⭕ MSN Games - Tres en Raya: Pinchi vs Chimpi';

  const isLive = window._liveConnection && window._liveConnection.open;
  const isChimpi = window._isChimpiMode;

  let currentTurn = '🐧'; // Pinchi siempre empieza

  if (content) {
    content.innerHTML = `
      <div style="font-weight:bold;font-size:15px;color:#111;">
        Pinchi (🐧) vs Chimpi el Cerdito (🐷)
        ${isLive ? '<br><span style="color:#28a745;font-size:12px;">🟢 ¡PARTIDA EN DIRECTO REAL!</span>' : ''}
      </div>
      <div id="tttTurn" style="font-size:14px;color:#0078d7;font-weight:bold;">¡Turno de Pinchi! 🐧</div>
      <div class="ttt-board" id="tttBoard">
        <div class="ttt-cell" data-idx="0"></div>
        <div class="ttt-cell" data-idx="1"></div>
        <div class="ttt-cell" data-idx="2"></div>
        <div class="ttt-cell" data-idx="3"></div>
        <div class="ttt-cell" data-idx="4"></div>
        <div class="ttt-cell" data-idx="5"></div>
        <div class="ttt-cell" data-idx="6"></div>
        <div class="ttt-cell" data-idx="7"></div>
        <div class="ttt-cell" data-idx="8"></div>
      </div>
      <div id="tttComment" style="font-size:13px;color:#ff8c00;font-style:italic;min-height:24px;">
        ${isLive ? '¡Jugando en vivo el uno contra el otro!' : 'Chimpi: ¡A ver si me ganas! Oink 😏🐷'}
      </div>
      <button class="msn-game-launch-btn" style="padding:6px 14px;font-size:13px;" onclick="openTicTacToeGame()">Reiniciar Partida 🔄</button>
      ${hubBackBtnHtml()}
    `;
  }

  if (modal) modal.style.display = 'flex';

  let board = Array(9).fill(null);
  let gameActive = true;
  const cells = content ? content.querySelectorAll('.ttt-cell') : [];
  const turnElem = document.getElementById('tttTurn');
  const commentElem = document.getElementById('tttComment');

  const chimpiComments = [
    "Oye, ¡esa jugada no me la esperaba! 🐷",
    "No me bloquees que te veo venir... oink!",
    "¡Pensabas que el cerdito no se iba a dar cuenta! 🤭",
    "Hummm... déjame calcular mi jugada porcina maestra..."
  ];

  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  function checkWinner() {
    for (let combo of wins) {
      const [a, b, c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return board.includes(null) ? null : 'tie';
  }

  function handleCellClick(idx, isRemoteMove) {
    if (!gameActive || board[idx]) return;

    // En modo en directo, solo permite mover si es tu turno o viene del otro jugador
    if (isLive && !isRemoteMove) {
      const mySymbol = isChimpi ? '🐷' : '🐧';
      if (currentTurn !== mySymbol) return; // No es tu turno todavía
    }

    const symbol = currentTurn;
    board[idx] = symbol;
    cells[idx].textContent = symbol;
    cells[idx].classList.add(symbol === '🐧' ? 'pinchi-mark' : 'chimpi-mark');
    playRetroTone(symbol === '🐧' ? 500 : 350, symbol === '🐧' ? 'sine' : 'triangle', 0.1);
    if (navigator.vibrate) try { navigator.vibrate(30); } catch (e) {}

    // Si fue un movimiento local en vivo, enviarlo a la otra persona
    if (isLive && !isRemoteMove && typeof window.sendLiveTicTacToeMove === 'function') {
      window.sendLiveTicTacToeMove(idx);
    }

    const winner = checkWinner();
    if (winner) {
      endGame(winner);
      return;
    }

    // Cambiar turno
    currentTurn = (currentTurn === '🐧') ? '🐷' : '🐧';

    if (isLive) {
      // Modo multijugador real
      if (turnElem) {
        turnElem.textContent = currentTurn === '🐧' ? '¡Turno de Pinchi! 🐧' : '¡Turno de Chimpi! 🐷';
      }
    } else {
      // Modo individual contra la IA
      gameActive = false;
      if (turnElem) turnElem.textContent = 'Chimpi está pensando... 💭';
      if (commentElem) commentElem.textContent = `Chimpi: ${chimpiComments[Math.floor(Math.random() * chimpiComments.length)]}`;

      setTimeout(() => {
        const emptyIdxs = board.map((val, i) => val === null ? i : null).filter(v => v !== null);
        if (emptyIdxs.length === 0) return;

        let chosenMove = null;
        for (let i of emptyIdxs) {
          board[i] = '🐷';
          if (checkWinner() === '🐷') { chosenMove = i; board[i] = null; break; }
          board[i] = null;
        }
        if (chosenMove === null) {
          for (let i of emptyIdxs) {
            board[i] = '🐧';
            if (checkWinner() === '🐧') { chosenMove = i; board[i] = null; break; }
            board[i] = null;
          }
        }
        if (chosenMove === null) {
          chosenMove = emptyIdxs[Math.floor(Math.random() * emptyIdxs.length)];
        }

        board[chosenMove] = '🐷';
        cells[chosenMove].textContent = '🐷';
        cells[chosenMove].classList.add('chimpi-mark');
        playRetroTone(350, 'triangle', 0.1);

        const w = checkWinner();
        if (w) {
          endGame(w);
        } else {
          gameActive = true;
          currentTurn = '🐧';
          if (turnElem) turnElem.textContent = '¡Tu turno, Pinchi! 🐧';
        }
      }, 550);
    }
  }

  function endGame(winner) {
    gameActive = false;
    if (winner === '🐧') {
      if (turnElem) turnElem.innerHTML = '<b style="color:#2e8b57;font-size:16px;">¡HAS GANADO PINCHI! 🎉🐧</b>';
      if (commentElem) commentElem.textContent = 'Chimpi: ¡Eres una máquina! Has vencido al cerdito 🐷💖';
      if (navigator.vibrate) try { navigator.vibrate([100, 50, 100, 50, 200]); } catch (e) {}
      if (typeof lanzarConfetiVariasVeces === 'function') lanzarConfetiVariasVeces();
    } else if (winner === '🐷') {
      if (turnElem) turnElem.innerHTML = '<b style="color:#e81123;">¡Punto para Chimpi el Cerdito! 🤭🐷</b>';
      if (commentElem) commentElem.textContent = 'Chimpi: ¡Oink oink! Aunque sabes que te quiero con locura 😜💖';
    } else {
      if (turnElem) turnElem.innerHTML = '<b style="color:#0078d7;">¡Empate épico! 🤝</b>';
      if (commentElem) commentElem.textContent = 'Chimpi: ¡Un empate digno de MSN Messenger!';
    }
  }

  cells.forEach((cell, idx) => {
    cell.addEventListener('click', () => handleCellClick(idx, false));
  });

  // Handler para recibir movimientos remotos
  window._handleRemoteTicTacToe = function (cellIdx) {
    handleCellClick(cellIdx, true);
  };
}

window.openTicTacToeGame = openTicTacToeGame;
