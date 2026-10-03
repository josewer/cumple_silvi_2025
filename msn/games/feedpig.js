// ==========================================
// MSN GAMES - ALIMENTA A CHIMPI EL CERDITO
// ==========================================

function openFeedPigGame() {
  closeGameModal();
  gameTitle.textContent = '🍖 MSN Games - Alimenta a Chimpi el Cerdito';

  gameContent.innerHTML = `
    <div style="font-weight:bold;font-size:15px;color:#111;">¡Toca la pantalla para lanzarle comida a Chimpi!</div>
    <div style="display:flex;gap:20px;font-size:15px;font-weight:bold;margin:2px 0;">
      <div style="color:#0078d7;">Alimentado: <span id="fdScore">0</span>/8 🍖</div>
      <div style="color:#e81123;">Tiempo: <span id="fdTimer">25</span>s</div>
    </div>
    <div style="position:relative;width:100%;max-width:340px;display:flex;justify-content:center;">
      <canvas id="feedCanvas" width="340" height="260" style="background:linear-gradient(180deg,#fff3e0,#ffe0b2);border:2px solid #e67e22;border-radius:10px;display:block;cursor:pointer;"></canvas>
    </div>
    <div id="fdStatus" style="font-size:12px;color:#555;">¡Apunta cuando Chimpi el cerdito pase por delante! 🐷</div>
    ${hubBackBtnHtml()}
  `;

  gameModal.style.display = 'flex';

  const canvas = document.getElementById('feedCanvas');
  const ctx = canvas.getContext('2d');
  const scoreElem = document.getElementById('fdScore');
  const timerElem = document.getElementById('fdTimer');
  const statusElem = document.getElementById('fdStatus');

  let score = 0;
  let timeLeft = 25;
  let gameOver = false;
  let victory = false;

  let pigX = 40;
  let pigSpeed = 3.2;
  const pigY = 50;

  let foodProjectiles = []; // { x, y, vy, emoji }

  function shoot() {
    if (gameOver || victory) return;
    const foods = ['🌰', '🍖', '🍎', '🍰'];
    foodProjectiles.push({
      x: canvas.width / 2,
      y: canvas.height - 40,
      vy: -6.5,
      emoji: foods[Math.floor(Math.random() * foods.length)]
    });
    playRetroTone(440, 'triangle', 0.08);
    if (navigator.vibrate) try { navigator.vibrate(30); } catch (e) {}
  }

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    shoot();
  });

  window._gameInterval = setInterval(() => {
    if (gameOver || victory) return;
    timeLeft--;
    timerElem.textContent = timeLeft;
    if (timeLeft <= 0) {
      gameOver = true;
      statusElem.innerHTML = '<span style="color:#e81123;">¡Se acabó el tiempo! <button class="msn-game-launch-btn" style="padding:4px 10px;font-size:12px;" onclick="openFeedPigGame()">Reintentar 🔄</button></span>';
    }
  }, 1000);

  function loop() {
    pigX += pigSpeed;
    if (pigX > canvas.width - 50 || pigX < 20) {
      pigSpeed = -pigSpeed;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Chimpi cerdito
    ctx.font = "38px sans-serif";
    ctx.fillText("🐷", pigX, pigY);

    // Pinchi lanzando abajo
    ctx.font = "32px sans-serif";
    ctx.fillText("🐧", canvas.width / 2 - 16, canvas.height - 12);

    // Proyectiles
    for (let i = foodProjectiles.length - 1; i >= 0; i--) {
      const f = foodProjectiles[i];
      f.y += f.vy;

      ctx.font = "24px sans-serif";
      ctx.fillText(f.emoji, f.x - 12, f.y);

      // Colisión con Chimpi
      if (Math.abs(f.x - (pigX + 18)) < 30 && Math.abs(f.y - (pigY - 10)) < 26) {
        score++;
        scoreElem.textContent = score;
        foodProjectiles.splice(i, 1);
        playRetroTone(620, 'sine', 0.15);
        if (navigator.vibrate) try { navigator.vibrate(50); } catch (e) {}
        statusElem.textContent = '¡Oink! ¡Qué rico! 🐷💖';

        if (score >= 8) {
          victory = true;
          statusElem.innerHTML = '<b style="color:#2e8b57;font-size:16px;">¡CHIMPI ESTÁ LLENO Y FELIZ! 🎉🐷💖</b>';
          if (navigator.vibrate) try { navigator.vibrate([100, 50, 100, 50, 200]); } catch (e) {}
          if (typeof lanzarConfetiVariasVeces === 'function') lanzarConfetiVariasVeces();
        }
        continue;
      }

      if (f.y < -20) {
        foodProjectiles.splice(i, 1);
      }
    }

    if (!gameOver && !victory) {
      window._animFrame = requestAnimationFrame(loop);
    }
  }

  window._animFrame = requestAnimationFrame(loop);
}
window.openFeedPigGame = openFeedPigGame;
