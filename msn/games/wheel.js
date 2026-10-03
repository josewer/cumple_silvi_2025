// ==========================================
// MSN GAMES - LA RULETA MILLENNIAL
// ==========================================

function openWheelGame() {
  closeGameModal();
  gameTitle.textContent = '🎡 MSN Games - La Ruleta Millennial';

  const prizes = [
    { label: '🍕 Cena romántica', desc: '¡Una cena donde tú elijas, paga Chimpi!' },
    { label: '🍿 Peli + Manta', desc: '¡Sesión de peli favorita con palomitas y mimos!' },
    { label: '💆‍♀️ Súper Masaje', desc: '¡Vale por un masaje relajante garantizado!' },
    { label: '✈️ Escapada juntos', desc: '¡Plan de finde especial para desconectar!' },
    { label: '👑 Tú Mandas 24h', desc: '¡Durante todo un día tienes el control absoluto!' },
    { label: '🎁 Regalo Especial', desc: '¡El regalo secreto de cumpleaños que te espera!' }
  ];

  const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#1a535c', '#ff9f1c', '#a06cd5'];

  gameContent.innerHTML = `
    <div style="font-weight:bold;font-size:15px;color:#111;">¡Gira la ruleta y descubre tu vale de regalo!</div>
    <div style="position:relative;width:280px;height:280px;margin:8px auto;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);font-size:26px;z-index:10;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🔻</div>
      <canvas id="wheelCanvas" width="280" height="280" style="border-radius:50%;box-shadow:0 6px 18px rgba(0,0,0,0.25);"></canvas>
      <div style="position:absolute;width:44px;height:44px;background:#ffffff;border:3px solid #333;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 2px 6px rgba(0,0,0,0.2);">
        🐷
      </div>
    </div>
    <button id="spinWheelBtn" class="msn-game-launch-btn" style="padding:10px 24px;font-size:16px;">
      🎡 ¡GIRAR RULETA!
    </button>
    <div id="wheelResult" style="font-size:14px;color:#333;min-height:36px;font-weight:bold;margin-top:4px;"></div>
    ${hubBackBtnHtml()}
  `;

  gameModal.style.display = 'flex';

  const canvas = document.getElementById('wheelCanvas');
  const ctx = canvas.getContext('2d');
  const spinBtn = document.getElementById('spinWheelBtn');
  const resultElem = document.getElementById('wheelResult');

  let currentAngle = 0;
  let isSpinning = false;
  const numSegments = prizes.length;
  const arcSize = (2 * Math.PI) / numSegments;

  function drawWheel(angle) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = cx - 4;

    for (let i = 0; i < numSegments; i++) {
      const segAngle = angle + i * arcSize;
      ctx.beginPath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, segAngle, segAngle + arcSize);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(segAngle + arcSize / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px sans-serif";
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 3;
      ctx.fillText(prizes[i].label, radius - 16, 5);
      ctx.restore();
    }
  }

  drawWheel(currentAngle);

  spinBtn.onclick = () => {
    if (isSpinning) return;
    isSpinning = true;
    spinBtn.disabled = true;
    resultElem.textContent = '¡La ruleta está girando...!';

    let speed = 0.35 + Math.random() * 0.25;
    const friction = 0.987;

    function anim() {
      currentAngle += speed;
      speed *= friction;
      drawWheel(currentAngle);

      playRetroTone(400 + Math.random() * 300, 'sine', 0.03);
      if (navigator.vibrate && Math.random() < 0.2) {
        try { navigator.vibrate(10); } catch (e) {}
      }

      if (speed > 0.002) {
        requestAnimationFrame(anim);
      } else {
        isSpinning = false;
        spinBtn.disabled = false;

        const normalizedAngle = (1.5 * Math.PI - (currentAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const winningIndex = Math.floor(normalizedAngle / arcSize);
        const prize = prizes[winningIndex];

        resultElem.innerHTML = `
          <div style="background:#e8f7ee;border:2px solid #2e8b57;border-radius:8px;padding:8px;animation:popIn 0.3s ease;">
            <div style="color:#2e8b57;font-size:16px;">🎉 ¡PREMIO: ${prize.label}! 🎉</div>
            <div style="font-size:13px;color:#333;margin-top:2px;">${prize.desc}</div>
          </div>
        `;
        if (navigator.vibrate) try { navigator.vibrate([100, 50, 100, 50, 200]); } catch (e) {}
        if (typeof lanzarConfetiVariasVeces === 'function') lanzarConfetiVariasVeces();
      }
    }
    requestAnimationFrame(anim);
  };
}
window.openWheelGame = openWheelGame;
