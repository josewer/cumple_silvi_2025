// =============================================================================
// MSN GAMES - ALIMENTA A CHIMPI EL CERDITO (¡COMIDA LIMITADA & PUNTERÍA!)
// =============================================================================

function openFeedPigGame() {
  closeGameModal();

  var modal = window.gameModal || document.getElementById('gameModal');
  var title = window.gameTitle || document.getElementById('gameTitle');
  var content = window.gameContent || document.getElementById('gameContent');

  if (title) title.textContent = '🍖 MSN Games - Alimenta a Chimpi el Cerdito';

  const TARGET_GOAL = 8;
  const INITIAL_AMMO = 14; // Comida limitada: 14 raciones para conseguir 8 aciertos
  const INITIAL_TIME = 30;

  if (content) {
    content.innerHTML = `
      <div style="font-weight:bold;font-size:15px;color:#111;">¡Apunta y lánzale comida a Chimpi con cuidado!</div>
      <div style="display:flex;gap:10px;font-size:13px;font-weight:bold;margin:4px 0;flex-wrap:wrap;justify-content:center;">
        <div style="color:#0078d7;background:#eef6ff;padding:3px 8px;border-radius:6px;border:1px solid #bcdcff;">
          Lleno: <span id="fdScore">0</span>/${TARGET_GOAL} 🍖
        </div>
        <div style="color:#d35400;background:#fff5eb;padding:3px 8px;border-radius:6px;border:1px solid #f9cb9c;">
          Raciones: <span id="fdAmmo">${INITIAL_AMMO}</span> 🌰
        </div>
        <div style="color:#c0392b;background:#fdeeed;padding:3px 8px;border-radius:6px;border:1px solid #f5b7b1;">
          Tiempo: <span id="fdTimer">${INITIAL_TIME}</span>s
        </div>
      </div>
      <div style="position:relative;width:100%;max-width:340px;display:flex;justify-content:center;margin:4px auto;">
        <canvas id="feedCanvas" width="340" height="260" style="background:linear-gradient(180deg,#fff8e7,#ffe0b2);border:2px solid #e67e22;border-radius:10px;display:block;cursor:pointer;touch-action:none;"></canvas>
      </div>
      <div id="fdStatus" style="font-size:13px;color:#555;min-height:22px;font-weight:bold;">
        ¡Cuidado, la comida se gasta! Espera a que Chimpi pase por el centro 🐷
      </div>
      <div style="margin-top:6px;">
        ${hubBackBtnHtml()}
      </div>
    `;
  }

  if (modal) modal.style.display = 'flex';

  const canvas = document.getElementById('feedCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const scoreElem = document.getElementById('fdScore');
  const ammoElem = document.getElementById('fdAmmo');
  const timerElem = document.getElementById('fdTimer');
  const statusElem = document.getElementById('fdStatus');

  let score = 0;
  let ammo = INITIAL_AMMO;
  let timeLeft = INITIAL_TIME;
  let gameOver = false;
  let victory = false;

  let pigX = 40;
  let pigSpeed = 3.2;
  const pigY = 50;
  let pigEmoji = "🐷";
  let pigReactionTimer = 0;

  let foodProjectiles = []; // { x, y, vy, emoji }
  let floatingParticles = []; // { x, y, vy, text, life }

  const chimpiPhrases = [
    "¡Oink! ¡Qué rico! 🐷💖",
    "¡Ñaaam! ¡Menudo manjar!",
    "¡Esa bellota estaba crujiente! 🌰",
    "¡Oink oink! ¡Gracias Pinchi! 🍎",
    "¡Qué rica tarta! 🍰✨"
  ];

  function shoot() {
    if (gameOver || victory) return;

    if (ammo <= 0) {
      playRetroTone(220, 'sawtooth', 0.08);
      if (statusElem) {
        statusElem.innerHTML = '<span style="color:#d35400;">¡Te has quedado sin comida en la cesta! 😱</span>';
      }
      return;
    }

    ammo--;
    if (ammoElem) ammoElem.textContent = ammo;

    const foods = ['🌰', '🍖', '🍎', '🍰', '🥐'];
    foodProjectiles.push({
      x: canvas.width / 2,
      y: canvas.height - 40,
      vy: -6.8,
      emoji: foods[Math.floor(Math.random() * foods.length)]
    });

    playRetroTone(480, 'triangle', 0.08);
    if (navigator.vibrate) try { navigator.vibrate(25); } catch (e) {}

    if (ammo === 0 && score < TARGET_GOAL) {
      if (statusElem) {
        statusElem.innerHTML = '<span style="color:#c0392b;">¡Última ración lanzada! ¡A ver si acierta! 🎯</span>';
      }
    }
  }

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    shoot();
  });

  window._gameInterval = setInterval(() => {
    if (gameOver || victory) return;
    timeLeft--;
    if (timerElem) timerElem.textContent = timeLeft;

    if (timeLeft <= 0) {
      gameOver = true;
      playRetroTone(180, 'sawtooth', 0.3);
      if (statusElem) {
        statusElem.innerHTML = `
          <span style="color:#c0392b;">¡Se agotó el tiempo! Chimpi tiene hambre... 🐷⏰
          <button class="msn-game-launch-btn" style="padding:3px 10px;font-size:12px;margin-left:6px;" onclick="openFeedPigGame()">Reintentar 🔄</button></span>
        `;
      }
    }
  }, 1000);

  function loop() {
    pigX += pigSpeed;
    if (pigX > canvas.width - 50) {
      pigX = canvas.width - 50;
      pigSpeed = -Math.abs(pigSpeed);
    } else if (pigX < 20) {
      pigX = 20;
      pigSpeed = Math.abs(pigSpeed);
    }

    if (pigReactionTimer > 0) {
      pigReactionTimer--;
      if (pigReactionTimer === 0) pigEmoji = "🐷";
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fondo decorativo sutil
    ctx.fillStyle = "rgba(230, 126, 34, 0.08)";
    ctx.fillRect(10, 10, canvas.width - 20, 70);

    // Chimpi cerdito arriba
    ctx.font = "38px sans-serif";
    ctx.fillText(pigEmoji, pigX, pigY);

    // Pinchi lanzando abajo
    ctx.font = "34px sans-serif";
    ctx.fillText("🐧", canvas.width / 2 - 17, canvas.height - 14);

    // Partículas flotantes de corazones / estrellas
    for (let p = floatingParticles.length - 1; p >= 0; p--) {
      const part = floatingParticles[p];
      part.y += part.vy;
      part.life--;
      ctx.font = "18px sans-serif";
      ctx.fillText(part.text, part.x, part.y);
      if (part.life <= 0) {
        floatingParticles.splice(p, 1);
      }
    }

    // Proyectiles de comida
    for (let i = foodProjectiles.length - 1; i >= 0; i--) {
      const f = foodProjectiles[i];
      f.y += f.vy;

      ctx.font = "24px sans-serif";
      ctx.fillText(f.emoji, f.x - 12, f.y);

      // Colisión con Chimpi
      if (Math.abs(f.x - (pigX + 18)) < 30 && Math.abs(f.y - (pigY - 10)) < 26) {
        score++;
        if (scoreElem) scoreElem.textContent = score;
        foodProjectiles.splice(i, 1);

        pigEmoji = "😋";
        pigReactionTimer = 25;
        // Pequeño cambio cómico de velocidad
        pigSpeed = (pigSpeed > 0 ? 1 : -1) * (3.0 + Math.random() * 1.5);

        // Añadir partícula de amor
        floatingParticles.push({
          x: pigX + 15,
          y: pigY - 15,
          vy: -1.2,
          text: "💖",
          life: 30
        });

        playRetroTone(620, 'sine', 0.15);
        if (navigator.vibrate) try { navigator.vibrate(50); } catch (e) {}

        const phrase = chimpiPhrases[Math.floor(Math.random() * chimpiPhrases.length)];
        if (statusElem) statusElem.textContent = phrase;

        if (score >= TARGET_GOAL) {
          victory = true;
          pigEmoji = "🥰";
          if (statusElem) {
            statusElem.innerHTML = '<b style="color:#27ae60;font-size:15px;">¡CHIMPI ESTÁ LLENO Y FELIZ! 🎉🐷💖</b>';
          }
          if (navigator.vibrate) try { navigator.vibrate([100, 50, 100, 50, 200]); } catch (e) {}
          if (typeof lanzarConfetiVariasVeces === 'function') lanzarConfetiVariasVeces();
        }
        continue;
      }

      // Si el proyectil sale por la parte superior (fallo de puntería)
      if (f.y < -20) {
        foodProjectiles.splice(i, 1);
      }
    }

    // Comprobar si se ha quedado sin munición y sin proyectiles en el aire antes de alcanzar la meta
    if (!victory && !gameOver && ammo === 0 && foodProjectiles.length === 0 && score < TARGET_GOAL) {
      gameOver = true;
      pigEmoji = "🥺";
      playRetroTone(160, 'sawtooth', 0.35);
      if (statusElem) {
        statusElem.innerHTML = `
          <span style="color:#c0392b;font-weight:bold;">
            ¡Te has quedado sin comida y Chimpi aún tiene hambre! 🐷😭
            <button class="msn-game-launch-btn" style="padding:3px 10px;font-size:12px;margin-left:6px;" onclick="openFeedPigGame()">Reintentar 🔄</button>
          </span>
        `;
      }
      if (navigator.vibrate) try { navigator.vibrate([150, 100, 150]); } catch (e) {}
    }

    if (!gameOver && !victory) {
      window._animFrame = requestAnimationFrame(loop);
    }
  }

  window._animFrame = requestAnimationFrame(loop);
}

window.openFeedPigGame = openFeedPigGame;
