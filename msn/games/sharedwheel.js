// =============================================================================
// MSN GAMES - RULETA DE COMPROMISOS MSN (DUELO DE CASTIGOS Y VALES DE PAREJA)
// =============================================================================

(function() {
  const PRIZES = [
    { title: "Masaje de pies de 15 min", icon: "💆", color: "#ff9ff3" },
    { title: "Desayuno sorpresa en la cama", icon: "🥐", color: "#feca57" },
    { title: "Elegir qué serie o peli ver hoy", icon: "🍿", color: "#ff6b6b" },
    { title: "Invitar a una ronda de helados", icon: "🍦", color: "#48dbfb" },
    { title: "Vale por un abrazo infinito", icon: "💖", color: "#ff9ff3" },
    { title: "Hacer la cena completa hoy", icon: "👨‍🍳", color: "#1dd1a1" },
    { title: "Paseo romántico sin móvil", icon: "🌲", color: "#54a0ff" },
    { title: "Bailar un lento en el salón", icon: "💃", color: "#f368e0" }
  ];

  let currentAngle = 0;
  let isSpinning = false;
  let animId = null;
  let isLiveGame = false;
  let isChimpiRole = false;

  function getConnection() {
    return (window.liveChimpi && window.liveChimpi.conn && window.liveChimpi.conn.open)
      ? window.liveChimpi.conn
      : (window._liveConnection && window._liveConnection.open ? window._liveConnection : null);
  }

  function openSharedWheelGame(forceSolo) {
    if (typeof closeGameModal === 'function') closeGameModal(true);

    const modal = window.gameModal || document.getElementById('gameModal');
    const title = window.gameTitle || document.getElementById('gameTitle');
    const content = window.gameContent || document.getElementById('gameContent');

    if (title) title.innerHTML = '🎡 MSN Games - Ruleta de Pareja: Vales y Compromisos';

    const conn = getConnection();
    isLiveGame = !forceSolo && !!conn;
    isChimpiRole = !!window._isChimpiMode;
    window._activeLiveGame = isLiveGame ? 'Ruleta de Pareja' : null;

    isSpinning = false;
    if (animId) cancelAnimationFrame(animId);

    if (content) {
      content.innerHTML = `
        <style>
          .wheel-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            max-width: 340px;
            margin: 0 auto;
            user-select: none;
          }
          .wheel-canvas-box {
            position: relative;
            width: 290px;
            height: 290px;
            margin: 8px 0;
          }
          .wheel-pointer {
            position: absolute;
            top: -6px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 12px solid transparent;
            border-right: 12px solid transparent;
            border-top: 22px solid #e74c3c;
            filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4));
            z-index: 10;
          }
          .wheel-spin-btn {
            background: linear-gradient(180deg, #ff9f43, #ee5253);
            border: 2px solid #b33939;
            border-radius: 10px;
            color: #ffffff;
            font-size: 16px;
            font-weight: bold;
            padding: 10px 24px;
            cursor: pointer;
            box-shadow: 0 4px 8px rgba(0,0,0,0.25);
            margin-top: 6px;
            touch-action: manipulation;
          }
          .wheel-spin-btn:active {
            transform: scale(0.97);
          }
        </style>

        <div class="wheel-container">
          <div style="font-size:12px;font-weight:bold;color:#444;text-align:center;">
            ¡Gira la ruleta y sella un vale oficial en el chat de MSN! 🎡📜
          </div>

          <div class="wheel-canvas-box">
            <div class="wheel-pointer"></div>
            <canvas id="sharedWheelCanvas" width="290" height="290"></canvas>
          </div>

          <button class="wheel-spin-btn" id="wheelSpinBtn" onclick="window.spinSharedWheel()">
            🎯 ¡GIRAR RULETA!
          </button>

          <div id="wheelResultMsg" style="font-size:13px;font-weight:bold;color:#0078d7;margin-top:8px;min-height:20px;text-align:center;">
          </div>

          <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
            ${typeof hubBackBtnHtml === 'function' ? hubBackBtnHtml() : ''}
          </div>
        </div>
      `;

      drawWheel(currentAngle);
    }

    if (modal) modal.style.display = 'flex';
  }

  function drawWheel(angleDeg) {
    const canvas = document.getElementById('sharedWheelCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = cx - 10;
    const numSlices = PRIZES.length;
    const arc = (Math.PI * 2) / numSlices;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((angleDeg * Math.PI) / 180);

    for (let i = 0; i < numSlices; i++) {
      const start = i * arc;
      const end = start + arc;

      // Sector
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, start, end);
      ctx.fillStyle = PRIZES[i].color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Icono y texto
      ctx.save();
      ctx.rotate(start + arc / 2);
      ctx.fillStyle = '#2f3542';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(PRIZES[i].icon, radius - 15, 5);
      ctx.restore();
    }

    // Centro de la ruleta
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#0078d7';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  }

  function playRatchetTick() {
    if (typeof playRetroTone === 'function') playRetroTone(700, 'triangle', 0.02);
  }

  window.spinSharedWheel = function() {
    if (isSpinning) return;

    const btn = document.getElementById('wheelSpinBtn');
    if (btn) btn.disabled = true;

    // Calcular índice ganador y ángulo final
    const prizeIndex = Math.floor(Math.random() * PRIZES.length);
    const fullSpins = 5;
    const sliceDeg = 360 / PRIZES.length; // 45°
    // La aguja apunta arriba (270° o -90°). Para que la aguja caiga en prizeIndex:
    // Calculamos el offset aleatorio dentro del sector
    const offset = Math.floor(Math.random() * 25) + 10;
    // Ángulo que debe quedar arriba
    const targetDeg = (360 - (prizeIndex * sliceDeg)) + (fullSpins * 360) + offset;

    // Si estamos en P2P, enviar orden
    if (isLiveGame) {
      const conn = getConnection();
      if (conn) {
        try {
          conn.send({
            type: 'WHEEL_SPIN',
            targetAngle: targetDeg,
            prizeIndex: prizeIndex
          });
        } catch (e) {}
      }
    }

    startWheelAnimation(targetDeg, prizeIndex);
  };

  function startWheelAnimation(targetAngle, prizeIndex) {
    isSpinning = true;
    const startAngle = currentAngle % 360;
    const delta = targetAngle;
    const startTime = performance.now();
    const duration = 4000;
    let lastTickAngle = 0;

    function animate(now) {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      // Curva de desaceleración cúbica: 1 - (1 - t)^3
      const easeOut = 1 - Math.pow(1 - t, 3);
      currentAngle = startAngle + delta * easeOut;

      // Sonido de carraca en cada cambio de segmento
      if (Math.abs(currentAngle - lastTickAngle) >= 45) {
        playRatchetTick();
        lastTickAngle = currentAngle;
      }

      drawWheel(currentAngle);

      if (t < 1) {
        animId = requestAnimationFrame(animate);
      } else {
        isSpinning = false;
        const btn = document.getElementById('wheelSpinBtn');
        if (btn) btn.disabled = false;
        finishSpin(prizeIndex);
      }
    }

    animId = requestAnimationFrame(animate);
  }

  function finishSpin(prizeIndex) {
    const prize = PRIZES[prizeIndex];
    const res = document.getElementById('wheelResultMsg');
    if (res) {
      res.innerHTML = `🎉 ¡Ha salido: <b>${prize.icon} ${prize.title}</b>!`;
    }

    if (typeof playRetroTone === 'function') playRetroTone(523.25, 'triangle', 0.3);
    if (typeof dispararConfetiCanvas === 'function') dispararConfetiCanvas();

    // Estampar en el chat principal de MSN como un "Vale Oficial Firmado"
    stampVoucherInChat(prize);
  }

  function stampVoucherInChat(prize) {
    const chat = document.getElementById('chat');
    if (!chat) return;

    const sender = isChimpiRole ? 'Chimpi 🐷' : 'Pinchi 🐧';
    const receiver = isChimpiRole ? 'Pinchi 🐧' : 'Chimpi 🐷';

    const voucherHtml = `
      <div style="background:linear-gradient(135deg,#fff8e7,#ffeaa7);border:2px dashed #f39c12;border-radius:10px;padding:8px 12px;margin:4px 0;box-shadow:0 2px 6px rgba(0,0,0,0.12);">
        <div style="font-size:11px;font-weight:bold;color:#d35400;">📜 VALE OFICIAL FIRMADO DE LA RULETA MSN</div>
        <div style="font-size:14px;font-weight:bold;color:#2f3542;margin:4px 0;">
          ${prize.icon} ${prize.title}
        </div>
        <div style="font-size:10px;color:#555;">
          Otorgado por <b>${sender}</b> a <b>${receiver}</b> • Válido para canjear en cualquier momento.
        </div>
      </div>
    `;

    const container = document.createElement('div');
    container.className = 'message-container aviso';
    container.innerHTML = voucherHtml;
    chat.appendChild(container);
    chat.scrollTop = chat.scrollHeight;

    // Enviar también como mensaje en vivo si está conectado
    if (isLiveGame && typeof window.broadcastLiveMessage === 'function') {
      window.broadcastLiveMessage(`📜 [VALE OFICIAL RULETA] ¡Ha salido: ${prize.icon} ${prize.title}!`, isChimpiRole ? 'chimpy' : 'pinchi');
    }
  }

  // Manejador WebRTC
  window._handleRemoteWheelSpin = function(data) {
    if (!data || typeof data.targetAngle !== 'number') return;
    startWheelAnimation(data.targetAngle, data.prizeIndex);
  };

  window.openSharedWheelGame = openSharedWheelGame;
})();
