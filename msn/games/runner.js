// ==========================================
// MSN GAMES - SALTO ANTÁRTICO (RUNNER)
// ==========================================

function openRunnerGame() {
  closeGameModal();
  gameTitle.textContent = '🛷 MSN Games - Salto Antártico';

  gameContent.innerHTML = `
    <div style="font-weight:bold;font-size:15px;color:#111;">¡Toca la pantalla para saltar y recoger 10 corazones!</div>
    <div style="display:flex;gap:20px;font-size:15px;font-weight:bold;margin:2px 0;">
      <div style="color:#0078d7;">Corazones: <span id="rnScore">0</span>/10 💖</div>
      <div style="color:#e81123;">Vidas: <span id="rnLives">❤️❤️❤️</span></div>
    </div>
    <div style="position:relative;width:100%;max-width:340px;display:flex;justify-content:center;">
      <canvas id="runnerCanvas" width="340" height="210" style="background:linear-gradient(180deg, #cde5f7, #ffffff);border:2px solid #0078d7;border-radius:10px;display:block;cursor:pointer;"></canvas>
    </div>
    <button id="runnerJumpBtn" class="msn-game-launch-btn" style="width:85%;padding:10px 0;font-size:16px;">
      🦘 ¡TOCAR AQUÍ O EN PANTALLA PARA SALTAR!
    </button>
    <div id="rnStatus" style="font-size:12px;color:#555;">Esquiva los bloques de hielo 🧊 y atrapa los corazones 💖</div>
    ${hubBackBtnHtml()}
  `;

  gameModal.style.display = 'flex';

  const canvas = document.getElementById('runnerCanvas');
  const ctx = canvas.getContext('2d');
  const scoreElem = document.getElementById('rnScore');
  const livesElem = document.getElementById('rnLives');
  const statusElem = document.getElementById('rnStatus');
  const jumpBtn = document.getElementById('runnerJumpBtn');

  let score = 0;
  let lives = 3;
  let gameOver = false;
  let victory = false;

  const groundY = 175;
  const penguin = {
    x: 45,
    y: groundY - 30,
    w: 28,
    h: 30,
    vy: 0,
    jumpPower: -8.8,
    gravity: 0.44,
    grounded: true
  };

  let items = [];
  let frameCount = 0;

  function jump() {
    if (gameOver || victory) return;
    if (penguin.grounded) {
      penguin.vy = penguin.jumpPower;
      penguin.grounded = false;
      playRetroTone(480, 'sine', 0.1);
      if (navigator.vibrate) try { navigator.vibrate(30); } catch (e) {}
    }
  }

  canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); jump(); });
  jumpBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); jump(); });

  function spawnItem() {
    const isHeart = Math.random() < 0.55;
    if (isHeart) {
      items.push({
        type: 'heart',
        x: canvas.width + 10,
        y: groundY - 45 - Math.random() * 45,
        w: 22,
        h: 22
      });
    } else {
      items.push({
        type: 'ice',
        x: canvas.width + 10,
        y: groundY - 26,
        w: 22,
        h: 26
      });
    }
  }

  function loop() {
    frameCount++;
    if (frameCount % 65 === 0 && !gameOver && !victory) {
      spawnItem();
    }

    penguin.y += penguin.vy;
    penguin.vy += penguin.gravity;
    if (penguin.y >= groundY - penguin.h) {
      penguin.y = groundY - penguin.h;
      penguin.vy = 0;
      penguin.grounded = true;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath();
    ctx.arc(80 + (frameCount * 0.4) % 360, 40, 20, 0, Math.PI * 2);
    ctx.arc(105 + (frameCount * 0.4) % 360, 40, 25, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#8dc6ec";
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, groundY, canvas.width, 4);

    ctx.font = "26px sans-serif";
    ctx.fillText("🐧", penguin.x - 4, penguin.y + 24);

    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.x -= 3.6;

      if (it.type === 'heart') {
        ctx.font = "20px sans-serif";
        ctx.fillText("💖", it.x, it.y + 18);

        if (
          penguin.x < it.x + it.w &&
          penguin.x + penguin.w > it.x &&
          penguin.y < it.y + it.h &&
          penguin.y + penguin.h > it.y
        ) {
          score++;
          scoreElem.textContent = score;
          playRetroTone(580, 'triangle', 0.1);
          if (navigator.vibrate) try { navigator.vibrate(40); } catch (e) {}
          items.splice(i, 1);

          if (score >= 10) {
            victory = true;
            statusElem.innerHTML = '<b style="color:#2e8b57;font-size:16px;">¡VICTORIA! 🎉 ¡Has atrapado los 10 corazones!</b>';
            if (navigator.vibrate) try { navigator.vibrate([100, 50, 100, 50, 200]); } catch (e) {}
            if (typeof lanzarConfetiVariasVeces === 'function') lanzarConfetiVariasVeces();
          }
          continue;
        }
      } else {
        ctx.font = "22px sans-serif";
        ctx.fillText("🧊", it.x, it.y + 22);

        if (
          penguin.x < it.x + it.w &&
          penguin.x + penguin.w > it.x &&
          penguin.y < it.y + it.h &&
          penguin.y + penguin.h > it.y
        ) {
          items.splice(i, 1);
          lives--;
          playRetroTone(220, 'sawtooth', 0.2);
          if (navigator.vibrate) try { navigator.vibrate([80, 40, 80]); } catch (e) {}
          livesElem.textContent = "❤️".repeat(Math.max(0, lives));

          if (lives <= 0) {
            gameOver = true;
            statusElem.innerHTML = '<span style="color:#e81123;">¡Oh no! Te has quedado sin vidas. <button class="msn-game-launch-btn" style="padding:4px 10px;font-size:12px;" onclick="openRunnerGame()">Reintentar 🔄</button></span>';
          }
          continue;
        }
      }

      if (it.x < -30) {
        items.splice(i, 1);
      }
    }

    if (!gameOver && !victory) {
      window._animFrame = requestAnimationFrame(loop);
    }
  }

  window._animFrame = requestAnimationFrame(loop);
}
window.openRunnerGame = openRunnerGame;
