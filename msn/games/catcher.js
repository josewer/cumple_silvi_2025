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
      <canvas id="catcherCanvas" width="340" height="260" style="background:#3880ff;border:3px solid #0078d7;border-radius:12px;box-shadow:0 6px 18px rgba(0,0,0,0.22);display:block;touch-action:none;"></canvas>
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
    if (playerX < 24) playerX = 24;
    if (playerX > canvas.width - 24) playerX = canvas.width - 24;
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
      x: 24 + Math.random() * (canvas.width - 48),
      y: -20,
      vy: 2.2 + Math.random() * 2.0
    });
  }

  function loop() {
    frame++;
    if (frame % 38 === 0 && !gameOver && !victory) {
      spawnFallingItem();
    }

    // 1. Cielo con degradado vibrante 100% sólido
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height - 32);
    skyGrad.addColorStop(0, '#2e86de');
    skyGrad.addColorStop(0.5, '#54a0ff');
    skyGrad.addColorStop(1, '#dfe6e9');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height - 32);

    // 2. Nubes decorativas en movimiento
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    const cloud1X = ((frame * 0.4) % (canvas.width + 120)) - 60;
    ctx.beginPath();
    ctx.arc(cloud1X, 36, 16, 0, Math.PI * 2);
    ctx.arc(cloud1X + 16, 30, 22, 0, Math.PI * 2);
    ctx.arc(cloud1X + 34, 36, 16, 0, Math.PI * 2);
    ctx.fill();

    const cloud2X = ((frame * 0.22 + 180) % (canvas.width + 140)) - 70;
    ctx.beginPath();
    ctx.arc(cloud2X, 70, 13, 0, Math.PI * 2);
    ctx.arc(cloud2X + 14, 65, 17, 0, Math.PI * 2);
    ctx.arc(cloud2X + 28, 70, 13, 0, Math.PI * 2);
    ctx.fill();

    // 3. Suelo sólido festivo
    const groundGrad = ctx.createLinearGradient(0, canvas.height - 32, 0, canvas.height);
    groundGrad.addColorStop(0, '#10ac84');
    groundGrad.addColorStop(1, '#057a5b');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, canvas.height - 32, canvas.width, 32);

    // Nieve decorativa superior del suelo
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, canvas.height - 33, canvas.width, 3);

    // 4. Sombra suave bajo Pinchi
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(playerX, playerY + 12, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 5. Pinchi y cesta (100% opaco y sólido)
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = '#000000';
    ctx.font = '34px sans-serif';
    ctx.fillText('🐧', playerX - 18, playerY + 8);
    ctx.font = '22px sans-serif';
    ctx.fillText('🧺', playerX + 6, playerY + 8);

    // 6. Regalos cayendo (100% opaco y sólido)
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.y += it.vy;

      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#000000';
      ctx.font = '26px sans-serif';
      ctx.fillText(it.emoji, it.x - 13, it.y);

      if (Math.abs(it.x - playerX) < 30 && Math.abs(it.y - playerY) < 24) {
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
          else if (typeof dispararConfetiCanvas === 'function') dispararConfetiCanvas();
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
