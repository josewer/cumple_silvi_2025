// =============================================================================
// MSN GAMES - AIR HOCKEY POLAR (MESA DE HIELO MSN: ARQUITECTURA HOST / CLIENTE)
// =============================================================================

(function() {
  let animId = null;
  let broadcastInterval = null;
  let isLiveGame = false;
  let isChimpiRole = false;
  let scorePinchi = 0;
  let scoreChimpi = 0;
  let isGameOver = false;

  // Dimensiones del campo virtual: 300 x 420
  const W = 300;
  const H = 420;
  const PUCK_RADIUS = 11;
  const MALLET_RADIUS = 20;
  const GOAL_WIDTH = 100;

  // Estado del disco y mazos
  let puck = { x: W / 2, y: H / 2, vx: 0, vy: 0 };
  let malletPinchi = { x: W / 2, y: H - 45 }; // Abajo
  let malletChimpi = { x: W / 2, y: 45 };     // Arriba

  function getConnection() {
    return (window.liveChimpi && window.liveChimpi.conn && window.liveChimpi.conn.open)
      ? window.liveChimpi.conn
      : (window._liveConnection && window._liveConnection.open ? window._liveConnection : null);
  }

  function openAirHockeyGame(forceSolo) {
    if (typeof closeGameModal === 'function') closeGameModal(true);

    const modal = window.gameModal || document.getElementById('gameModal');
    const title = window.gameTitle || document.getElementById('gameTitle');
    const content = window.gameContent || document.getElementById('gameContent');

    if (title) title.innerHTML = '🏒 MSN Games - Air Hockey Polar: Mesa de Hielo';

    const conn = getConnection();
    isLiveGame = !forceSolo && !!conn;
    isChimpiRole = !!window._isChimpiMode;
    window._activeLiveGame = isLiveGame ? 'Air Hockey MSN' : null;

    scorePinchi = 0;
    scoreChimpi = 0;
    isGameOver = false;
    resetPuck(0);
    clearLoops();

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
    }

    if (modal) modal.style.display = 'flex';
  }

  function clearLoops() {
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    if (broadcastInterval) { clearInterval(broadcastInterval); broadcastInterval = null; }
  }

  function resetPuck(direction) {
    puck.x = W / 2;
    puck.y = H / 2;
    // Saque suave hacia quien recibió gol (o aleatorio al inicio)
    const angle = (Math.PI / 4) + (Math.random() * Math.PI / 2);
    const speed = 3;
    const sign = direction === 0 ? (Math.random() < 0.5 ? 1 : -1) : direction;
    puck.vx = (Math.random() - 0.5) * 3;
    puck.vy = sign * speed;
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
        malletChimpi.x = x;
        malletChimpi.y = Math.min(H / 2 - MALLET_RADIUS, Math.max(MALLET_RADIUS, y));

        if (isLiveGame) {
          const conn = getConnection();
          if (conn) try { conn.send({ type: 'HOCKEY_PADDLE', x: malletChimpi.x, y: malletChimpi.y }); } catch (e) {}
        }
      } else {
        // Pinchi controla la mitad inferior (y de H/2 a H)
        malletPinchi.x = x;
        malletPinchi.y = Math.max(H / 2 + MALLET_RADIUS, Math.min(H - MALLET_RADIUS, y));
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
              malletPinchiY: malletPinchi.y
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

      // 2. Renderizado gráfico
      render(ctx);

      if (!isGameOver) {
        animId = requestAnimationFrame(loop);
      }
    }

    animId = requestAnimationFrame(loop);
  }

  function updatePhysics() {
    // Si estamos en solitario, mover la IA de Chimpi con inercia natural
    if (!isLiveGame) {
      const targetX = puck.x;
      const targetY = puck.y < H / 2 ? Math.max(45, puck.y - 30) : 45;
      malletChimpi.x += (targetX - malletChimpi.x) * 0.08;
      malletChimpi.y += (targetY - malletChimpi.y) * 0.08;
      malletChimpi.x = Math.max(MALLET_RADIUS, Math.min(W - MALLET_RADIUS, malletChimpi.x));
      malletChimpi.y = Math.max(MALLET_RADIUS, Math.min(H / 2 - MALLET_RADIUS, malletChimpi.y));
    }

    // Movimiento del disco
    puck.x += puck.vx;
    puck.y += puck.vy;

    // Fricción del hielo
    puck.vx *= 0.992;
    puck.vy *= 0.992;

    // Rebotes contra paredes laterales
    if (puck.x - PUCK_RADIUS <= 0) {
      puck.x = PUCK_RADIUS;
      puck.vx = -puck.vx;
      playWallSound();
    } else if (puck.x + PUCK_RADIUS >= W) {
      puck.x = W - PUCK_RADIUS;
      puck.vx = -puck.vx;
      playWallSound();
    }

    // Comprobación de porterías (Arriba = Chimpi, Abajo = Pinchi)
    const inGoalX = puck.x >= (W - GOAL_WIDTH) / 2 && puck.x <= (W + GOAL_WIDTH) / 2;

    // Rebote superior o GOL de Pinchi
    if (puck.y - PUCK_RADIUS <= 0) {
      if (inGoalX) {
        // ¡GOL DE PINCHI!
        scorePinchi++;
        onGoalScored('pinchi');
        return;
      } else {
        puck.y = PUCK_RADIUS;
        puck.vy = -puck.vy;
        playWallSound();
      }
    }

    // Rebote inferior o GOL de Chimpi
    if (puck.y + PUCK_RADIUS >= H) {
      if (inGoalX) {
        // ¡GOL DE CHIMPI!
        scoreChimpi++;
        onGoalScored('chimpi');
        return;
      } else {
        puck.y = H - PUCK_RADIUS;
        puck.vy = -puck.vy;
        playWallSound();
      }
    }

    // Colisión elástica disco vs mazo Pinchi
    checkMalletCollision(malletPinchi);
    // Colisión elástica disco vs mazo Chimpi
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

      // Separar disco para evitar solapamiento
      puck.x = mallet.x + nx * minDist;
      puck.y = mallet.y + ny * minDist;

      // Impulso y velocidad
      const speed = Math.max(4.5, Math.hypot(puck.vx, puck.vy) * 1.08);
      puck.vx = nx * Math.min(speed, 9.5);
      puck.vy = ny * Math.min(speed, 9.5);

      playMalletSound();
      if (navigator.vibrate) try { navigator.vibrate(20); } catch (e) {}
    }
  }

  function playMalletSound() {
    if (typeof playRetroTone === 'function') playRetroTone(440, 'sine', 0.03);
  }

  function playWallSound() {
    if (typeof playRetroTone === 'function') playRetroTone(220, 'sine', 0.02);
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
    const scorerName = scorer === 'pinchi' ? '¡GOLAZO DE PINCHI! 🐧⚽' : '¡GOLAZO DE CHIMPI! 🐷⚽';
    if (status) status.textContent = scorerName;

    if (scorePinchi >= 5 || scoreChimpi >= 5) {
      isGameOver = true;
      const champ = scorePinchi >= 5 ? '¡PINCHI 🐧 SE CORONA CAMPEONA!' : '¡CHIMPI 🐷 CONQUISTA EL HIELO!';
      if (status) status.innerHTML = `🏆 <span style="color:#d35400;">${champ}</span>`;

      const isMe = (scorePinchi >= 5 && !isChimpiRole) || (scoreChimpi >= 5 && isChimpiRole);
      if (isMe && typeof dispararConfetiCanvas === 'function') dispararConfetiCanvas();
    } else {
      resetPuck(scorer === 'pinchi' ? -1 : 1);
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
    ctx.fillRect((W - GOAL_WIDTH) / 2, 0, GOAL_WIDTH, 6);
    ctx.fillStyle = '#70a1ff';
    ctx.fillRect((W - GOAL_WIDTH) / 2, H - 6, GOAL_WIDTH, 6);

    // Disco de hockey
    ctx.fillStyle = '#2f3542';
    ctx.beginPath();
    ctx.arc(puck.x, puck.y, PUCK_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1e272e';
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
  }

  window.restartAirHockeyGame = function() {
    openAirHockeyGame(!isLiveGame);
  };

  // Manejadores WebRTC
  window._handleRemoteHockeyPaddle = function(data) {
    if (!data || isGameOver) return;
    malletChimpi.x = data.x;
    malletChimpi.y = data.y;
  };

  window._handleRemoteHockeyState = function(data) {
    if (!data || isGameOver) return;
    puck.x = data.puckX;
    puck.y = data.puckY;
    scorePinchi = data.scoreHost;
    scoreChimpi = data.scoreGuest;
    if (data.malletPinchiX) malletPinchi.x = data.malletPinchiX;
    if (data.malletPinchiY) malletPinchi.y = data.malletPinchiY;

    const sP = document.getElementById('hkScoreP');
    const sC = document.getElementById('hkScoreC');
    if (sP) sP.textContent = scorePinchi;
    if (sC) sC.textContent = scoreChimpi;
  };

  window.openAirHockeyGame = openAirHockeyGame;
})();
