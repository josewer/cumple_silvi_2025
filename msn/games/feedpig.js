// =============================================================================
// MSN GAMES - ALIMENTA A CHIMPI EL CERDITO (ALTA DEFINICIÓN & MÁXIMO CONTRASTE)
// =============================================================================

function openFeedPigGame() {
  closeGameModal();

  var modal = window.gameModal || document.getElementById('gameModal');
  var title = window.gameTitle || document.getElementById('gameTitle');
  var content = window.gameContent || document.getElementById('gameContent');

  if (title) title.textContent = '🍖 MSN Games - Alimenta a Chimpi el Cerdito';

  const TARGET_GOAL = 8;
  const INITIAL_AMMO = 14; // Comida limitada
  const INITIAL_TIME = 30;

  if (content) {
    content.innerHTML = `
      <div style="font-weight:bold;font-size:15px;color:#111;">¡Apunta y lánzale comida a Chimpi con cuidado!</div>
      <div style="display:flex;gap:10px;font-size:13px;font-weight:bold;margin:4px 0;flex-wrap:wrap;justify-content:center;">
        <div style="color:#0078d7;background:#eef6ff;padding:4px 10px;border-radius:6px;border:1.5px solid #0078d7;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          Lleno: <span id="fdScore">0</span>/${TARGET_GOAL} 🍖
        </div>
        <div style="color:#d35400;background:#fff5eb;padding:4px 10px;border-radius:6px;border:1.5px solid #e67e22;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          Raciones: <span id="fdAmmo">${INITIAL_AMMO}</span> 🌰
        </div>
        <div style="color:#c0392b;background:#fdeeed;padding:4px 10px;border-radius:6px;border:1.5px solid #c0392b;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          Tiempo: <span id="fdTimer">${INITIAL_TIME}</span>s
        </div>
      </div>
      <div style="position:relative;width:100%;max-width:340px;display:flex;justify-content:center;margin:6px auto;">
        <canvas id="feedCanvas" width="340" height="280" style="background:#ffffff;border:3px solid #0078d7;border-radius:12px;display:block;cursor:pointer;touch-action:none;box-shadow:0 6px 18px rgba(0,120,215,0.25);"></canvas>
      </div>
      <div id="fdStatus" style="font-size:13px;color:#222;min-height:22px;font-weight:bold;">
        ¡Toca la pantalla para disparar cuando Chimpi pase por el centro! 🐷
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

  // Configuración de resolución nítida para pantallas Retina/Móviles
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const logicalWidth = 340;
  const logicalHeight = 280;
  canvas.width = logicalWidth * dpr;
  canvas.height = logicalHeight * dpr;
  canvas.style.width = logicalWidth + 'px';
  canvas.style.height = logicalHeight + 'px';
  ctx.scale(dpr, dpr);

  let score = 0;
  let ammo = INITIAL_AMMO;
  let timeLeft = INITIAL_TIME;
  let gameOver = false;
  let victory = false;

  let pigX = 50;
  let pigSpeed = 3.2;
  const pigY = 56;
  let pigEmoji = "🐷";
  let pigReactionTimer = 0;

  let foodProjectiles = []; // { x, y, vy, emoji }
  let floatingParticles = []; // { x, y, vy, text, life }

  const chimpiPhrases = [
    "¡Oinss Oinss! ¡Qué rico! 🐷💖",
    "¡Ñaaam! ¡Menudo manjar!",
    "¡Esa bellota estaba crujiente! 🌰",
    "¡Oinss Oinss! ¡Gracias Pinchi! 🍎",
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
      x: logicalWidth / 2,
      y: logicalHeight - 48,
      vy: -7.2,
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
    if (pigX > logicalWidth - 55) {
      pigX = logicalWidth - 55;
      pigSpeed = -Math.abs(pigSpeed);
    } else if (pigX < 25) {
      pigX = 25;
      pigSpeed = Math.abs(pigSpeed);
    }

    if (pigReactionTimer > 0) {
      pigReactionTimer--;
      if (pigReactionTimer === 0) pigEmoji = "🐷";
    }

    // 1. FONDO TOTALMENTE OPACO Y SÓLIDO (CERO TRANSPARENCIAS)
    // Cielo arriba
    ctx.fillStyle = "#edf6ff";
    ctx.fillRect(0, 0, logicalWidth, logicalHeight - 70);

    // Césped / Base sólida abajo donde está Pinchi
    ctx.fillStyle = "#e2f7ea";
    ctx.fillRect(0, logicalHeight - 70, logicalWidth, 70);

    // Línea divisoria nítida del suelo
    ctx.beginPath();
    ctx.strokeStyle = "#5fcf91";
    ctx.lineWidth = 3;
    ctx.moveTo(0, logicalHeight - 70);
    ctx.lineTo(logicalWidth, logicalHeight - 70);
    ctx.stroke();

    // Carril decorativo superior por donde pasa Chimpi
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#cfe3f2";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(14, 16, logicalWidth - 28, 80, 16);
    ctx.fill();
    ctx.stroke();

    // Pistas de puntería en el centro (flecha sutil hacia arriba)
    ctx.save();
    ctx.strokeStyle = "rgba(0, 120, 215, 0.25)";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(logicalWidth / 2, logicalHeight - 70);
    ctx.lineTo(logicalWidth / 2, 96);
    ctx.stroke();
    ctx.restore();

    // 2. CHIMPI EL CERDITO (CÁPSULA BLANCA BRILLANTE 100% NÍTIDA)
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.22)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(pigX + 18, pigY, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = "#ff69b4"; // Borde rosa vibrante Chimpi
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.font = 'bold 38px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(pigEmoji, pigX + 18, pigY + 2);
    ctx.restore();

    // 3. PINCHI LA PINGÜINA (CÁPSULA BLANCA CON BORDE AZUL MSN)
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.22)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(logicalWidth / 2, logicalHeight - 34, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = "#0078d7"; // Borde azul MSN Pinchi
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.font = 'bold 36px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🐧", logicalWidth / 2, logicalHeight - 32);
    ctx.restore();

    // 4. PARTÍCULAS FLOTANTES DE CORAZONES
    for (let p = floatingParticles.length - 1; p >= 0; p--) {
      const part = floatingParticles[p];
      part.y += part.vy;
      part.life--;
      ctx.save();
      ctx.font = '22px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(part.text, part.x, part.y);
      ctx.restore();
      if (part.life <= 0) {
        floatingParticles.splice(p, 1);
      }
    }

    // 5. PROYECTILES DE COMIDA (CÁPSULAS BLANCAS CON BORDE DORADO NÍTIDO)
    for (let i = foodProjectiles.length - 1; i >= 0; i--) {
      const f = foodProjectiles[i];
      f.y += f.vy;

      // Dibujar fondo blanco sólido para que la comida sea súper brillante y opaca
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
      ctx.shadowBlur = 6;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(f.x, f.y, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#f39c12"; // Borde dorado
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.font = '26px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(f.emoji, f.x, f.y + 1);
      ctx.restore();

      // Colisión precisa con Chimpi
      const dist = Math.hypot(f.x - (pigX + 18), f.y - pigY);
      if (dist < 38) {
        score++;
        if (scoreElem) scoreElem.textContent = score;
        foodProjectiles.splice(i, 1);

        pigEmoji = "😋";
        pigReactionTimer = 25;
        pigSpeed = (pigSpeed > 0 ? 1 : -1) * (3.0 + Math.random() * 1.5);

        floatingParticles.push({
          x: pigX + 18,
          y: pigY - 20,
          vy: -1.4,
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

      // Si la comida sale por arriba (fallo)
      if (f.y < -30) {
        foodProjectiles.splice(i, 1);
      }
    }

    // Fin de partida si se acaba la comida
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
