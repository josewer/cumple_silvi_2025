// ==========================================
// MSN GAMES - ROMPE-LADRILLOS PINGÜINO (ARKANOID)
// ==========================================

function openBrickGame() {
  closeGameModal();
  gameTitle.textContent = '🧱 MSN Games - Rompe-Ladrillos Pingüino';

  gameContent.innerHTML = `
    <div style="font-weight:bold;font-size:15px;color:#111;">¡Rebota la bola de nieve y rompe todos los bloques!</div>
    <div style="display:flex;gap:20px;font-size:15px;font-weight:bold;margin:2px 0;">
      <div style="color:#0078d7;">Bloques restantes: <span id="brkRemaining">18</span> 🧱</div>
    </div>
    <div style="position:relative;width:100%;max-width:340px;display:flex;justify-content:center;">
      <canvas id="brickCanvas" width="340" height="280" style="background:#1e272e;border:2px solid #0078d7;border-radius:10px;display:block;touch-action:none;"></canvas>
    </div>
    <div id="brkStatus" style="font-size:12px;color:#555;">Desliza tu dedo en la base para mover la pala de hielo 🐧</div>
    ${hubBackBtnHtml()}
  `;

  gameModal.style.display = 'flex';

  const canvas = document.getElementById('brickCanvas');
  const ctx = canvas.getContext('2d');
  const remainingElem = document.getElementById('brkRemaining');
  const statusElem = document.getElementById('brkStatus');

  let paddleW = 75;
  let paddleH = 10;
  let paddleX = (canvas.width - paddleW) / 2;

  let ballX = canvas.width / 2;
  let ballY = canvas.height - 40;
  let ballRadius = 6;
  let ballDX = 2.4;
  let ballDY = -2.4;

  const rows = 3;
  const cols = 6;
  const brickW = 48;
  const brickH = 18;
  const brickPadding = 6;
  const brickOffsetTop = 25;
  const brickOffsetLeft = 11;

  let bricks = [];
  let bricksCount = rows * cols;
  const brickColors = ['#e74c3c', '#f39c12', '#2ecc71'];

  for (let r = 0; r < rows; r++) {
    bricks[r] = [];
    for (let c = 0; c < cols; c++) {
      bricks[r][c] = { x: 0, y: 0, status: 1, color: brickColors[r] };
    }
  }

  function movePaddle(clientX) {
    const rect = canvas.getBoundingClientRect();
    paddleX = clientX - rect.left - paddleW / 2;
    if (paddleX < 0) paddleX = 0;
    if (paddleX > canvas.width - paddleW) paddleX = canvas.width - paddleW;
  }

  canvas.addEventListener('pointermove', (e) => { movePaddle(e.clientX); });
  canvas.addEventListener('pointerdown', (e) => { movePaddle(e.clientX); });

  let gameOver = false;
  let victory = false;

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar ladrillos
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const b = bricks[r][c];
        if (b.status === 1) {
          const bX = c * (brickW + brickPadding) + brickOffsetLeft;
          const bY = r * (brickH + brickPadding) + brickOffsetTop;
          b.x = bX;
          b.y = bY;

          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.roundRect(bX, bY, brickW, brickH, 4);
          ctx.fill();

          // Colisión con bola
          if (
            ballX > bX &&
            ballX < bX + brickW &&
            ballY > bY &&
            ballY < bY + brickH
          ) {
            ballDY = -ballDY;
            b.status = 0;
            bricksCount--;
            remainingElem.textContent = bricksCount;
            playRetroTone(450 + Math.random() * 150, 'square', 0.08);
            if (navigator.vibrate) try { navigator.vibrate(30); } catch (e) {}

            if (bricksCount === 0) {
              victory = true;
              statusElem.innerHTML = '<b style="color:#2ecc71;font-size:16px;">¡TODOS LOS BLOQUES DESTRUIDOS! 🎉🧱</b>';
              if (navigator.vibrate) try { navigator.vibrate([100, 50, 100, 50, 200]); } catch (e) {}
              if (typeof lanzarConfetiVariasVeces === 'function') lanzarConfetiVariasVeces();
            }
          }
        }
      }
    }

    // Dibujar pala de hielo
    ctx.fillStyle = "#3498db";
    ctx.beginPath();
    ctx.roundRect(paddleX, canvas.height - 20, paddleW, paddleH, 5);
    ctx.fill();

    // Dibujar bola de nieve
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fill();

    // Rebotes paredes
    if (ballX + ballDX > canvas.width - ballRadius || ballX + ballDX < ballRadius) {
      ballDX = -ballDX;
      playRetroTone(300, 'sine', 0.05);
    }
    if (ballY + ballDY < ballRadius) {
      ballDY = -ballDY;
      playRetroTone(300, 'sine', 0.05);
    } else if (ballY + ballDY > canvas.height - 20 - ballRadius) {
      if (ballX > paddleX && ballX < paddleX + paddleW) {
        ballDY = -ballDY;
        ballDX = (ballX - (paddleX + paddleW / 2)) * 0.12;
        playRetroTone(420, 'triangle', 0.08);
        if (navigator.vibrate) try { navigator.vibrate(20); } catch (e) {}
      } else if (ballY + ballDY > canvas.height - ballRadius) {
        gameOver = true;
        statusElem.innerHTML = '<span style="color:#e81123;">¡La bola se cayó! <button class="msn-game-launch-btn" style="padding:4px 10px;font-size:12px;" onclick="openBrickGame()">Reintentar 🔄</button></span>';
      }
    }

    ballX += ballDX;
    ballY += ballDY;

    if (!gameOver && !victory) {
      window._animFrame = requestAnimationFrame(loop);
    }
  }

  window._animFrame = requestAnimationFrame(loop);
}
window.openBrickGame = openBrickGame;
