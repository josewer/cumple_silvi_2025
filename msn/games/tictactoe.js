// ==========================================
// MSN GAMES - TRES EN RAYA: PINCHI 🐧 VS CHIMPI 🐷
// ==========================================

function openTicTacToeGame() {
  closeGameModal();
  gameTitle.textContent = '❌⭕ MSN Games - Tres en Raya: Pinchi vs Chimpi';

  gameContent.innerHTML = `
    <div style="font-weight:bold;font-size:15px;color:#111;">Pinchi (🐧) vs Chimpi el Cerdito (🐷)</div>
    <div id="tttTurn" style="font-size:14px;color:#0078d7;font-weight:bold;">¡Tu turno, Pinchi!</div>
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
    <div id="tttComment" style="font-size:13px;color:#ff8c00;font-style:italic;min-height:24px;">Chimpi: ¡A ver si me ganas! Oink 😏🐷</div>
    <button class="msn-game-launch-btn" style="padding:6px 14px;font-size:13px;" onclick="openTicTacToeGame()">Reiniciar Partida 🔄</button>
    ${hubBackBtnHtml()}
  `;

  gameModal.style.display = 'flex';

  let board = Array(9).fill(null);
  let gameActive = true;
  const cells = gameContent.querySelectorAll('.ttt-cell');
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

  function handleCellClick(idx) {
    if (!gameActive || board[idx]) return;

    board[idx] = '🐧';
    cells[idx].textContent = '🐧';
    cells[idx].classList.add('pinchi-mark');
    playRetroTone(500, 'sine', 0.1);
    if (navigator.vibrate) try { navigator.vibrate(30); } catch (e) {}

    const winner = checkWinner();
    if (winner) {
      endGame(winner);
      return;
    }

    gameActive = false;
    turnElem.textContent = 'Chimpi está pensando... 💭';
    commentElem.textContent = `Chimpi: ${chimpiComments[Math.floor(Math.random() * chimpiComments.length)]}`;

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
        turnElem.textContent = '¡Tu turno, Pinchi! 🐧';
      }
    }, 550);
  }

  function endGame(winner) {
    gameActive = false;
    if (winner === '🐧') {
      turnElem.innerHTML = '<b style="color:#2e8b57;font-size:16px;">¡HAS GANADO PINCHI! 🎉🐧</b>';
      commentElem.textContent = 'Chimpi: ¡Eres una máquina! Has vencido al cerdito 🐷💖';
      if (navigator.vibrate) try { navigator.vibrate([100, 50, 100, 50, 200]); } catch (e) {}
      if (typeof lanzarConfetiVariasVeces === 'function') lanzarConfetiVariasVeces();
    } else if (winner === '🐷') {
      turnElem.innerHTML = '<b style="color:#e81123;">¡Punto para Chimpi el Cerdito! 🤭🐷</b>';
      commentElem.textContent = 'Chimpi: ¡Oink oink! Aunque sabes que te quiero con locura 😜💖';
    } else {
      turnElem.innerHTML = '<b style="color:#0078d7;">¡Empate épico! 🤝</b>';
      commentElem.textContent = 'Chimpi: ¡Un empate digno de MSN Messenger!';
    }
  }

  cells.forEach((cell, idx) => {
    cell.addEventListener('click', () => handleCellClick(idx));
  });
}
window.openTicTacToeGame = openTicTacToeGame;
