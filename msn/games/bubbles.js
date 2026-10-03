// ==========================================
// MSN GAMES - BURBUJAS DEL AMOR
// ==========================================

function openBubblePopGame() {
  closeGameModal();
  gameTitle.textContent = '🫧 MSN Games - Burbujas del Amor';

  gameContent.innerHTML = `
    <div style="font-weight:bold;font-size:15px;color:#111;">¡Explota las burbujas antes de que se escapen!</div>
    <div style="font-size:15px;color:#0078d7;font-weight:bold;margin:2px 0;">Burbujas explotadas: <span id="bpScore">0</span>/20 🫧</div>
    <div style="position:relative;width:100%;max-width:340px;display:flex;justify-content:center;">
      <canvas id="bubbleCanvas" width="340" height="280" style="background:linear-gradient(180deg,#e0f7fa,#e8f5e9);border:2px solid #26a69a;border-radius:10px;display:block;cursor:pointer;"></canvas>
    </div>
    <div id="bpStatus" style="font-size:12px;color:#555;">¡Toca con tu dedo cada burbuja para hacer POP! ✨</div>
    ${hubBackBtnHtml()}
  `;

  gameModal.style.display = 'flex';

  const canvas = document.getElementById('bubbleCanvas');
  const ctx = canvas.getContext('2d');
  const scoreElem = document.getElementById('bpScore');
  const statusElem = document.getElementById('bpStatus');

  let score = 0;
  const targetScore = 20;
  let bubbles = [];
  let victory = false;

  function spawnBubble() {
    const emojis = ['🐷', '🐧', '💖', '🎂', '✨'];
    bubbles.push({
      x: 30 + Math.random() * (canvas.width - 60),
      y: canvas.height + 25,
      r: 22 + Math.random() * 8,
      vy: 1.6 + Math.random() * 1.6,
      emoji: emojis[Math.floor(Math.random() * emojis.length)]
    });
  }

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (victory) return;

    const rect = canvas.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      const dist = Math.hypot(touchX - b.x, touchY - b.y);
      if (dist < b.r + 10) {
        bubbles.splice(i, 1);
        score++;
        scoreElem.textContent = score;
        playRetroTone(650 + Math.random() * 250, 'sine', 0.08);
        if (navigator.vibrate) try { navigator.vibrate(25); } catch (e) {}

        if (score >= targetScore) {
          victory = true;
          statusElem.innerHTML = '<b style="color:#2e8b57;font-size:16px;">¡20 BURBUJAS EXPLOTADAS! 🎉🫧</b>';
          if (navigator.vibrate) try { navigator.vibrate([100, 50, 100, 50, 200]); } catch (e) {}
          if (typeof lanzarConfetiVariasVeces === 'function') lanzarConfetiVariasVeces();
        }
        break;
      }
    }
  });

  window._spawnTimer = setInterval(() => {
    if (!victory) spawnBubble();
  }, 480);

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      b.y -= b.vy;

      // Dibujar burbuja
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.fill();
      ctx.strokeStyle = "rgba(38, 166, 154, 0.7)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Emoji dentro
      ctx.font = `${b.r * 1.1}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(b.emoji, b.x, b.y);

      if (b.y < -30) {
        bubbles.splice(i, 1);
      }
    }

    if (!victory) {
      window._animFrame = requestAnimationFrame(loop);
    }
  }

  window._animFrame = requestAnimationFrame(loop);
}
window.openBubblePopGame = openBubblePopGame;
