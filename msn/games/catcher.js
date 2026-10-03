// ==========================================
// MSN GAMES - LLUVIA DE REGALOS (CATCHER)
// ==========================================

function openCatcherGame() {
  closeGameModal();
  gameTitle.textContent = '🎁 MSN Games - Lluvia de Regalos';

  gameContent.innerHTML = `
    <div style="font-weight:bold;font-size:15px;color:#111;">¡Desliza a Pinchi para atrapar los regalos!</div>
    <div style="display:flex;gap:20px;font-size:15px;font-weight:bold;margin:2px 0;">
      <div style="color:#0078d7;">Regalos: <span id="ctScore">0</span>/10 🎁</div>
      <div style="color:#e81123;">Tiempo: <span id="ctTimer">30</span>s</div>
    </div>
    <div style="position:relative;width:100%;max-width:340px;display:flex;justify-content:center;">
      <canvas id="catcherCanvas" width="340" height="260" style="background:linear-gradient(180deg, #dcf0ff, #fff5ea);border:2px solid #2e8b57;border-radius:10px;display:block;touch-action:none;"></canvas>
    </div>
    <div id="ctStatus" style="font-size:12px;color:#555;">Desliza tu dedo hacia la izquierda y derecha para moverte</div>
    ${hubBackBtnHtml()}
  `;

  gameModal.style.display = 'flex';

  const canvas = document.getElementById('catcherCanvas');
  const ctx = canvas.getContext('2d');
  const scoreElem = document.getElementById('ctScore');
  const timerElem = document.getElementById('ctTimer');
  const statusElem = document.getElementById('ctStatus');

  let score = 0;
  let timeLeft = 30;
  let gameOver = false;
  let victory = false;

  let playerX = canvas.width / 2;
  const playerY = canvas.height - 35;

  let items = [];
  let frame = 0;

  function movePlayer(clientX) {
    const rect = canvas.getBoundingClientRect();
    playerX = clientX - rect.left;
    if (playerX < 20) playerX = 20;
    if (playerX > canvas.width - 20) playerX = canvas.width - 20;
  }

  canvas.addEventListener('pointermove', (e) => { movePlayer(e.clientX); });
  canvas.addEventListener('pointerdown', (e) => { movePlayer(e.clientX); });

  window._gameInterval = setInterval(() => {
    if (gameOver || victory) return;
    timeLeft--;
    timerElem.textContent = timeLeft;
    if (timeLeft <= 0) {
      gameOver = true;
      statusElem.innerHTML = '<span style="color:#e81123;">¡Se acabó el tiempo! <button class="msn-game-launch-btn" style="padding:4px 10px;font-size:12px;" onclick="openCatcherGame()">Reintentar 🔄</button></span>';
    }
  }, 1000);

  function spawnFallingItem() {
    const types = ['🎁', '🎂', '💖', '🎵'];
    const emoji = types[Math.floor(Math.random() * types.length)];
    items.push({
      emoji: emoji,
      x: 20 + Math.random() * (canvas.width - 40),
      y: -20,
      vy: 2.2 + Math.random() * 2.0
    });
  }

  function loop() {
    frame++;
    if (frame % 38 === 0 && !gameOver && !victory) {
      spawnFallingItem();
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(60, 179, 113, 0.15)";
    ctx.fillRect(0, canvas.height - 10, canvas.width, 10);

    ctx.font = "32px sans-serif";
    ctx.fillText("🐧", playerX - 18, playerY + 8);
    ctx.font = "20px sans-serif";
    ctx.fillText("🧺", playerX - 4, playerY + 12);

    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.y += it.vy;

      ctx.font = "24px sans-serif";
      ctx.fillText(it.emoji, it.x - 12, it.y);

      if (Math.abs(it.x - playerX) < 28 && Math.abs(it.y - playerY) < 22) {
        score++;
        scoreElem.textContent = score;
        playRetroTone(550, 'triangle', 0.09);
        if (navigator.vibrate) try { navigator.vibrate(35); } catch (e) {}
        items.splice(i, 1);

        if (score >= 10) {
          victory = true;
          statusElem.innerHTML = '<b style="color:#2e8b57;font-size:16px;">¡RETO SUPERADO! 🎉 ¡Has atrapado todos los regalos!</b>';
          if (navigator.vibrate) try { navigator.vibrate([100, 50, 100, 50, 200]); } catch (e) {}
          if (typeof lanzarConfetiVariasVeces === 'function') lanzarConfetiVariasVeces();
        }
        continue;
      }

      if (it.y > canvas.height + 20) {
        items.splice(i, 1);
      }
    }

    if (!gameOver && !victory) {
      window._animFrame = requestAnimationFrame(loop);
    }
  }

  window._animFrame = requestAnimationFrame(loop);
}
window.openCatcherGame = openCatcherGame;
