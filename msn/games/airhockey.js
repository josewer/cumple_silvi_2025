// =============================================================================
// MSN GAMES - AIR HOCKEY POLAR (MESA DE HIELO MSN: ARQUITECTURA HOST / CLIENTE)
// =============================================================================

(function() {
  let animId = null;
  let broadcastInterval = null;
  let countdownTimer = null;
  let isLiveGame = false;
  let isChimpiRole = false;
  let scorePinchi = 0;
  let scoreChimpi = 0;
  let isGameOver = false;
  let isGoalScoring = false;

  // Estado de la cuenta atrás (3, 2, 1, ¡YA!)
  let countdown = 3;
  let countdownText = '3';
  let stuckFrames = 0;

  // Dimensiones del campo virtual: 300 x 420
  const W = 300;
  const H = 420;
  const PUCK_RADIUS = 11;
  const MALLET_RADIUS = 20;
  const GOAL_WIDTH = 110;

  // Estado del disco y mazos (con tracking de velocidad para golpes dinámicos)
  let puck = { x: W / 2, y: H / 2, vx: 0, vy: 0 };
  let malletPinchi = { x: W / 2, y: H - 55, lastX: W / 2, lastY: H - 55, vx: 0, vy: 0 }; // Abajo
  let malletChimpi = { x: W / 2, y: 55, lastX: W / 2, lastY: 55, vx: 0, vy: 0 };         // Arriba

  function getConnection() {
    return (window.liveChimpi && window.liveChimpi.conn && window.liveChimpi.conn.open)
      ? window.liveChimpi.conn
      : (window._liveConnection && window._liveConnection.open ? window._liveConnection : null);
  }

  function isChimpi() {
    return !!(window._isChimpiMode || (new URLSearchParams(window.location.search).get('rol') === 'chimpi') || (new URLSearchParams(window.location.search).get('chimpi') === '1'));
  }

  function openAirHockeyGame(forceSolo) {
    if (typeof closeGameModal === 'function') closeGameModal(true);

    const modal = window.gameModal || document.getElementById('gameModal');
    const title = window.gameTitle || document.getElementById('gameTitle');
    const content = window.gameContent || document.getElementById('gameContent');

    if (title) title.innerHTML = '🏒 MSN Games - Air Hockey Polar: Mesa de Hielo';

    const conn = getConnection();
    isLiveGame = !forceSolo && !!conn;
    isChimpiRole = isChimpi();
    window._activeLiveGame = isLiveGame ? 'Air Hockey MSN' : null;

    clearLoops();
    isGameOver = false;
    isGoalScoring = false;
    window._activeGameCleanup = clearLoops;
    scorePinchi = 0;
    scoreChimpi = 0;

    if (content) {
      content.innerHTML = `
        <style>
          .hockey-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            max-width: 340px;
            margin: 0 auto;
            user-select: none;
          }
          .hockey-hud {
            display: flex;
            justify-content: space-between;
            width: 300px;
            margin-bottom: 6px;
            font-size: 13px;
            font-weight: bold;
          }
          .hockey-canvas-frame {
            width: 300px;
            height: 420px;
            border: 4px solid #004a9f;
            border-radius: 16px;
            background: #dff9fb;
            box-shadow: 0 6px 16px rgba(0,0,0,0.25), inset 0 0 10px rgba(0,120,215,0.2);
            position: relative;
            touch-action: none;
            overflow: hidden;
          }
          .hockey-canvas {
            display: block;
            width: 300px;
            height: 420px;
            cursor: pointer;
          }
        </style>

        <div class="hockey-container">
          <div class="hockey-hud">
            <span style="color:#0078d7;">Pinchi 🐧: <b id="hkScoreP">0</b></span>
            <span style="color:#666;font-size:11px;">Primero a 5 goles 🏆</span>
            <span style="color:#e84393;">Chimpi 🐷: <b id="hkScoreC">0</b></span>
          </div>

          <div class="hockey-canvas-frame">
            <canvas class="hockey-canvas" id="hockeyCanvas" width="300" height="420"></canvas>
          </div>

          <div id="hockeyStatus" style="font-size:12px;font-weight:bold;color:#28a745;margin-top:6px;min-height:16px;"></div>

          <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
            <button class="msn-game-launch-btn" style="padding:5px 12px;font-size:12px;" onclick="window.restartAirHockeyGame()">
              🔄 Reiniciar Partido
            </button>
            ${typeof hubBackBtnHtml === 'function' ? hubBackBtnHtml() : ''}
          </div>
        </div>
      `;

      setupCanvasEvents();
      startPhysicsLoop();
      startCountdown(0);
    }

    if (modal) modal.style.display = 'flex';
  }

  function clearLoops() {
    isGameOver = true;
    isGoalScoring = false;
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    if (broadcastInterval) { clearInterval(broadcastInterval); broadcastInterval = null; }
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
  }

  function playCountdownBeep(freq) {
    if (typeof playRetroTone === 'function') playRetroTone(freq, 'sine', 0.12);
  }

  function playStartTone() {
    if (typeof playRetroTone === 'function') {
      playRetroTone(880, 'triangle', 0.22);
      if (navigator.vibrate) try { navigator.vibrate(80); } catch (e) {}
    }
  }

  function startCountdown(serveDirection) {
    if (countdownTimer) clearInterval(countdownTimer);
    countdown = 3;
    countdownText = '3';
    isGoalScoring = false;

    // Colocar disco inmóvil en el centro y centrar mazos
    puck.x = W / 2;
    puck.y = H / 2;
    puck.vx = 0;
    puck.vy = 0;
    malletPinchi.x = W / 2;
    malletPinchi.y = H - 55;
    malletPinchi.vx = 0;
    malletPinchi.vy = 0;
    malletChimpi.x = W / 2;
    malletChimpi.y = 55;
    malletChimpi.vx = 0;
    malletChimpi.vy = 0;

    const status = document.getElementById('hockeyStatus');
    if (status && !isGameOver) status.textContent = '⏱️ ¡Preparados... 3!';

    playCountdownBeep(440);

    countdownTimer = setInterval(() => {
      countdown--;
      if (countdown === 2) {
        countdownText = '2';
        playCountdownBeep(520);
        if (status && !isGameOver) status.textContent = '⏱️ ¡Listos... 2!';
      } else if (countdown === 1) {
        countdownText = '1';
        playCountdownBeep(620);
        if (status && !isGameOver) status.textContent = '⏱️ ¡Atentos... 1!';
      } else if (countdown === 0) {
        countdownText = '¡YA! 🏒';
        playStartTone();
        if (status && !isGameOver) status.textContent = '🔥 ¡A jugar!';
        clearInterval(countdownTimer);
        countdownTimer = null;

        setTimeout(() => {
          countdownText = '';
          // Saque activo del disco hacia la dirección correspondiente
          if (!isLiveGame || !isChimpiRole) {
            launchPuck(serveDirection);
          }
        }, 550);
      }
    }, 1000);
  }

  function launchPuck(direction) {
    puck.x = W / 2;
    puck.y = H / 2;
    const sign = direction === 0 ? (Math.random() < 0.5 ? 1 : -1) : direction;
    const angleX = (Math.random() - 0.5) * 2.8;
    puck.vx = angleX;
    puck.vy = sign * 4.4;
  }

  function setupCanvasEvents() {
    const canvas = document.getElementById('hockeyCanvas');
    if (!canvas) return;

    function handlePointer(clientX, clientY) {
      if (isGameOver) return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.max(MALLET_RADIUS, Math.min(W - MALLET_RADIUS, clientX - rect.left));
      const y = Math.max(MALLET_RADIUS, Math.min(H - MALLET_RADIUS, clientY - rect.top));

      if (isChimpiRole) {
        // Chimpi controla la mitad superior (y de 0 a H/2)
        const prevX = malletChimpi.x;
        const prevY = malletChimpi.y;
        malletChimpi.x = x;
        malletChimpi.y = Math.min(H / 2 - MALLET_RADIUS, Math.max(MALLET_RADIUS, y));
        malletChimpi.vx = malletChimpi.x - prevX;
        malletChimpi.vy = malletChimpi.y - prevY;

        if (isLiveGame) {
          const conn = getConnection();
          if (conn) try { conn.send({ type: 'HOCKEY_PADDLE', x: malletChimpi.x, y: malletChimpi.y, vx: malletChimpi.vx, vy: malletChimpi.vy }); } catch (e) {}
        }
      } else {
        // Pinchi controla la mitad inferior (y de H/2 a H)
        const prevX = malletPinchi.x;
        const prevY = malletPinchi.y;
        malletPinchi.x = x;
        malletPinchi.y = Math.max(H / 2 + MALLET_RADIUS, Math.min(H - MALLET_RADIUS, y));
        malletPinchi.vx = malletPinchi.x - prevX;
        malletPinchi.vy = malletPinchi.y - prevY;
      }
    }

    canvas.onmousemove = (e) => handlePointer(e.clientX, e.clientY);
    canvas.ontouchmove = (e) => {
      e.preventDefault();
      if (e.touches[0]) handlePointer(e.touches[0].clientX, e.touches[0].clientY);
    };
  }

  function startPhysicsLoop() {
    const canvas = document.getElementById('hockeyCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Transmisión 30fps desde el Host (Pinchi) al Guest (Chimpi)
    if (isLiveGame && !isChimpiRole) {
      broadcastInterval = setInterval(() => {
        const conn = getConnection();
        if (conn && conn.open) {
          try {
            conn.send({
              type: 'HOCKEY_STATE',
              puckX: puck.x,
              puckY: puck.y,
              scoreHost: scorePinchi,
              scoreGuest: scoreChimpi,
              malletPinchiX: malletPinchi.x,
              malletPinchiY: malletPinchi.y,
              countdown: countdown,
              countdownText: countdownText
            });
          } catch (e) {}
        }
      }, 33);
    }

    function loop() {
      // 1. Simulación física (sólo la ejecuta Pinchi como Host, o en modo solitario)
      if (!isLiveGame || !isChimpiRole) {
        updatePhysics();
      }

      // Damping gradual de velocidad de los mazos cuando el dedo se detiene
      malletPinchi.vx *= 0.65;
      malletPinchi.vy *= 0.65;
      if (!isLiveGame) {
        malletChimpi.vx *= 0.65;
        malletChimpi.vy *= 0.65;
      }

      // 2. Renderizado gráfico
      render(ctx);

      if (!isGameOver) {
        animId = requestAnimationFrame(loop);
      }
    }

    animId = requestAnimationFrame(loop);
  }

  function updatePhysics() {
    // Si estamos en cuenta atrás o celebrando un gol, no actualizar físicas del disco
    if (countdown > 0 || isGoalScoring) return;

    // Si estamos en solitario, IA mejorada para Chimpi con inteligencia de esquinas
    if (!isLiveGame) {
      let targetX, targetY;
      if (puck.y < H / 2) {
        // ¿Está el disco en una esquina superior?
        const inTopLeft = puck.x < 65 && puck.y < 75;
        const inTopRight = puck.x > W - 65 && puck.y < 75;

        if (inTopLeft) {
          // Si está en la esquina izquierda, Chimpi se coloca a la derecha del disco para barrerlo hacia el centro
          targetX = puck.x + 32;
          targetY = Math.max(MALLET_RADIUS + 12, puck.y - 8);
        } else if (inTopRight) {
          // Si está en la esquina derecha, Chimpi se coloca a la izquierda para barrerlo hacia el centro
          targetX = puck.x - 32;
          targetY = Math.max(MALLET_RADIUS + 12, puck.y - 8);
        } else {
          // Disco en juego abierto: se lanza hacia el disco con ímpetu
          targetX = puck.x;
          targetY = Math.max(MALLET_RADIUS + 8, puck.y - 25);
        }
      } else {
        // Disco en campo de Pinchi: defender el centro de su portería
        targetX = W / 2 + (puck.x - W / 2) * 0.45;
        targetY = 55;
      }

      const prevX = malletChimpi.x;
      const prevY = malletChimpi.y;

      malletChimpi.x += (targetX - malletChimpi.x) * 0.12;
      malletChimpi.y += (targetY - malletChimpi.y) * 0.12;
      malletChimpi.x = Math.max(MALLET_RADIUS, Math.min(W - MALLET_RADIUS, malletChimpi.x));
      malletChimpi.y = Math.max(MALLET_RADIUS, Math.min(H / 2 - MALLET_RADIUS, malletChimpi.y));

      malletChimpi.vx = malletChimpi.x - prevX;
      malletChimpi.vy = malletChimpi.y - prevY;
    }

    // Movimiento del disco
    puck.x += puck.vx;
    puck.y += puck.vy;

    // Fricción realista de mesa de aire (deslizamiento continuo y suave)
    puck.vx *= 0.995;
    puck.vy *= 0.995;

    // 1. Biselado y rebotes diagonales en esquinas para evitar trampas en ángulo recto
    const CORNER_DIST = 32;
    if (puck.x < CORNER_DIST && puck.y < CORNER_DIST) {
      puck.vx = Math.abs(puck.vx) + 2.4;
      puck.vy = Math.abs(puck.vy) + 2.4;
      playWallSound();
    } else if (puck.x > W - CORNER_DIST && puck.y < CORNER_DIST) {
      puck.vx = -Math.abs(puck.vx) - 2.4;
      puck.vy = Math.abs(puck.vy) + 2.4;
      playWallSound();
    } else if (puck.x < CORNER_DIST && puck.y > H - CORNER_DIST) {
      puck.vx = Math.abs(puck.vx) + 2.4;
      puck.vy = -Math.abs(puck.vy) - 2.4;
      playWallSound();
    } else if (puck.x > W - CORNER_DIST && puck.y > H - CORNER_DIST) {
      puck.vx = -Math.abs(puck.vx) - 2.4;
      puck.vy = -Math.abs(puck.vy) - 2.4;
      playWallSound();
    }

    // 2. Desatascador polar automático (Watchdog anti-stuck si el disco se frena en un borde)
    const currentSpeed = Math.hypot(puck.vx, puck.vy);
    if (currentSpeed < 0.9 && (puck.x < 55 || puck.x > W - 55 || puck.y < 75 || puck.y > H - 75)) {
      stuckFrames++;
      if (stuckFrames > 70) { // Tras ~1.1 segundos casi detenido
        stuckFrames = 0;
        // Chimpi da un paso atrás inmediatamente hacia el centro para no tapar
        malletChimpi.x = W / 2;
        malletChimpi.y = 65;
        // Impulso polar hacia el centro de la pista
        const dirX = puck.x < W / 2 ? 1 : -1;
        const dirY = puck.y < H / 2 ? 1 : -1;
        puck.vx = dirX * (3.8 + Math.random());
        puck.vy = dirY * (3.8 + Math.random());
        playWallSound();
      }
    } else {
      stuckFrames = 0;
    }

    // Rebotes elásticos contra paredes laterales
    if (puck.x - PUCK_RADIUS <= 0) {
      puck.x = PUCK_RADIUS;
      puck.vx = Math.abs(puck.vx) * 0.96;
      playWallSound();
    } else if (puck.x + PUCK_RADIUS >= W) {
      puck.x = W - PUCK_RADIUS;
      puck.vx = -Math.abs(puck.vx) * 0.96;
      playWallSound();
    }

    // Comprobación de porterías (Arriba = Chimpi, Abajo = Pinchi)
    const inGoalX = puck.x >= (W - GOAL_WIDTH) / 2 && puck.x <= (W + GOAL_WIDTH) / 2;

    // Rebote superior o GOL de Pinchi
    if (puck.y - PUCK_RADIUS <= 0) {
      if (inGoalX) {
        if (!isGoalScoring) {
          isGoalScoring = true;
          puck.vx = 0;
          puck.vy = 0;
          puck.y = -2;
          scorePinchi++;
          onGoalScored('pinchi');
        }
        return;
      } else {
        puck.y = PUCK_RADIUS;
        puck.vy = Math.abs(puck.vy) * 0.96;
        playWallSound();
      }
    }

    // Rebote inferior o GOL de Chimpi
    if (puck.y + PUCK_RADIUS >= H) {
      if (inGoalX) {
        if (!isGoalScoring) {
          isGoalScoring = true;
          puck.vx = 0;
          puck.vy = 0;
          puck.y = H + 2;
          scoreChimpi++;
          onGoalScored('chimpi');
        }
        return;
      } else {
        puck.y = H - PUCK_RADIUS;
        puck.vy = -Math.abs(puck.vy) * 0.96;
        playWallSound();
      }
    }

    // Colisión elástica con transferencia de impulso del mazo
    checkMalletCollision(malletPinchi);
    checkMalletCollision(malletChimpi);
  }

  function checkMalletCollision(mallet) {
    const dx = puck.x - mallet.x;
    const dy = puck.y - mallet.y;
    const dist = Math.hypot(dx, dy);
    const minDist = PUCK_RADIUS + MALLET_RADIUS;

    if (dist < minDist && dist > 0) {
      // Normalizar vector de colisión
      const nx = dx / dist;
      const ny = dy / dist;

      // Despegar disco para evitar solapamientos
      puck.x = mallet.x + nx * (minDist + 1);
      puck.y = mallet.y + ny * (minDist + 1);

      // Transferencia real de fuerza del movimiento del mazo (Slap Shot)
      const malletSpeedX = mallet.vx || 0;
      const malletSpeedY = mallet.vy || 0;

      let impulseX = nx * 5.2 + malletSpeedX * 0.75;
      let impulseY = ny * 5.2 + malletSpeedY * 0.75;

      let speed = Math.hypot(impulseX, impulseY);
      speed = Math.max(4.6, Math.min(speed, 12.0));

      const angle = Math.atan2(impulseY, impulseX);
      puck.vx = Math.cos(angle) * speed;
      puck.vy = Math.sin(angle) * speed;

      playMalletSound();
      if (navigator.vibrate) try { navigator.vibrate(25); } catch (e) {}
    }
  }

  function playMalletSound() {
    if (typeof playRetroTone === 'function') playRetroTone(440, 'sine', 0.04);
  }

  function playWallSound() {
    if (typeof playRetroTone === 'function') playRetroTone(220, 'sine', 0.03);
  }

  function playGoalWhistle() {
    try {
      const ctx = window.retroAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1760, ctx.currentTime + 0.15);
      osc.frequency.linearRampToValueAtTime(1320, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  }

  function onGoalScored(scorer) {
    playGoalWhistle();
    if (navigator.vibrate) try { navigator.vibrate([100, 50, 100]); } catch (e) {}

    const sP = document.getElementById('hkScoreP');
    const sC = document.getElementById('hkScoreC');
    if (sP) sP.textContent = scorePinchi;
    if (sC) sC.textContent = scoreChimpi;

    const status = document.getElementById('hockeyStatus');
    const scorerName = scorer === 'pinchi' ? '⚽ ¡GOLAZO DE PINCHI! 🐧' : '⚽ ¡GOLAZO DE CHIMPI! 🐷';
    if (status) status.textContent = scorerName;

    if (scorePinchi >= 5 || scoreChimpi >= 5) {
      isGameOver = true;
      const champ = scorePinchi >= 5 ? '¡PINCHI 🐧 SE CORONA CAMPEONA!' : '¡CHIMPI 🐷 CONQUISTA EL HIELO!';
      if (status) status.innerHTML = `🏆 <span style="color:#d35400;">${champ}</span>`;

      const isMe = (scorePinchi >= 5 && !isChimpiRole) || (scoreChimpi >= 5 && isChimpiRole);
      if (isMe && typeof dispararConfetiCanvas === 'function') dispararConfetiCanvas();
    } else {
      // Pausa breve de celebración y cuenta atrás de 3 segundos para el siguiente saque
      setTimeout(() => {
        if (!isGameOver) {
          startCountdown(scorer === 'pinchi' ? -1 : 1);
        }
      }, 1000);
    }
  }

  function render(ctx) {
    // Fondo de hielo
    ctx.fillStyle = '#dff9fb';
    ctx.fillRect(0, 0, W, H);

    // Línea central y círculo
    ctx.strokeStyle = '#70a1ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 45, 0, Math.PI * 2);
    ctx.stroke();

    // Porterías (Arcos de gol)
    ctx.fillStyle = '#ff6b81';
    ctx.fillRect((W - GOAL_WIDTH) / 2, 0, GOAL_WIDTH, 7);
    ctx.fillStyle = '#70a1ff';
    ctx.fillRect((W - GOAL_WIDTH) / 2, H - 7, GOAL_WIDTH, 7);

    // Disco de hockey con sombra
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.arc(puck.x + 2, puck.y + 2, PUCK_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2f3542';
    ctx.beginPath();
    ctx.arc(puck.x, puck.y, PUCK_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1e272e';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Mazo Chimpi 🐷 (Arriba)
    ctx.fillStyle = '#ff9ff3';
    ctx.beginPath();
    ctx.arc(malletChimpi.x, malletChimpi.y, MALLET_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e056fd';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐷', malletChimpi.x, malletChimpi.y);

    // Mazo Pinchi 🐧 (Abajo)
    ctx.fillStyle = '#70a1ff';
    ctx.beginPath();
    ctx.arc(malletPinchi.x, malletPinchi.y, MALLET_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0984e3';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillText('🐧', malletPinchi.x, malletPinchi.y);

    // Overlay visual de cuenta atrás (3, 2, 1, ¡YA!)
    if (countdownText) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 25, 70, 0.38)';
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 120, 215, 0.7)';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 44, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = countdown === 0 ? '#e84393' : '#0078d7';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = countdown === 0 ? '#e84393' : '#0078d7';
      ctx.font = countdown === 0 ? 'bold 22px sans-serif' : 'bold 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(countdownText, W / 2, H / 2);
      ctx.restore();
    }
  }

  window.restartAirHockeyGame = function() {
    openAirHockeyGame(!isLiveGame);
  };

  // Manejadores WebRTC
  window._handleRemoteHockeyPaddle = function(data) {
    if (!data || isGameOver) return;
    malletChimpi.x = data.x;
    malletChimpi.y = data.y;
    if (typeof data.vx === 'number') malletChimpi.vx = data.vx;
    if (typeof data.vy === 'number') malletChimpi.vy = data.vy;
  };

  window._handleRemoteHockeyState = function(data) {
    if (!data || isGameOver) return;
    puck.x = data.puckX;
    puck.y = data.puckY;
    scorePinchi = data.scoreHost;
    scoreChimpi = data.scoreGuest;
    if (data.malletPinchiX) malletPinchi.x = data.malletPinchiX;
    if (data.malletPinchiY) malletPinchi.y = data.malletPinchiY;
    if (typeof data.countdown === 'number') {
      countdown = data.countdown;
      countdownText = data.countdownText || '';
    }

    const sP = document.getElementById('hkScoreP');
    const sC = document.getElementById('hkScoreC');
    if (sP) sP.textContent = scorePinchi;
    if (sC) sC.textContent = scoreChimpi;
  };

  window.openAirHockeyGame = openAirHockeyGame;
})();
