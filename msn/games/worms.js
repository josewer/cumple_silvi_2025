// =============================================================================
// MSN GAMES - WORMS MSN: PINCHI 🐧 VS CHIMPI 🐷 (DUELO DE ARTILLERÍA)
// =============================================================================

(function() {
  // Dimensiones del campo virtual (proporción óptima móvil/PC)
  const W = 360;
  const H = 240;
  const WATER_Y = 226;

  // Estado general de la partida
  let animId = null;
  let isLiveGame = false;
  let isChimpiRole = false;
  let isGameOver = false;
  let isResolving = false; // Proyectil en vuelo, explosión o físicas en curso

  // Canvas y contextos
  let mainCanvas = null;
  let ctx = null;
  let terrainCanvas = null;
  let terrainCtx = null;

  // Turnos y viento
  let currentTurn = 'PINCHI'; // 'PINCHI' o 'CHIMPI'
  let wind = 0; // -4 (hacia izquierda) a +4 (hacia derecha)
  let turnNumber = 1;
  let turnTimer = null;
  let turnTimeLeft = 30;

  // Jugadores
  let pinchi = {
    id: 'PINCHI',
    name: 'Pinchi',
    icon: '🐧',
    x: 50,
    y: 130,
    vx: 0,
    vy: 0,
    hp: 100,
    facing: 1, // 1 = derecha, -1 = izquierda
    angle: 45, // grados
    power: 55, // 10 a 100
    weapon: 'sardine', // 'sardine' o 'grenade'
    movesLeft: 30, // combustible de pasos por turno
    isDead: false
  };

  let chimpi = {
    id: 'CHIMPI',
    name: 'Chimpi',
    icon: '🐷',
    x: 310,
    y: 130,
    vx: 0,
    vy: 0,
    hp: 100,
    facing: -1, // hacia la izquierda
    angle: 135,
    power: 55,
    weapon: 'sardine',
    movesLeft: 30,
    isDead: false
  };

  // Proyectil activo
  let activeBullet = null;
  // Partículas y textos flotantes
  let particles = [];
  let floatingTexts = [];

  // Conexión WebRTC
  function getConnection() {
    return (window.liveChimpi && window.liveChimpi.conn && window.liveChimpi.conn.open)
      ? window.liveChimpi.conn
      : (window._liveConnection && window._liveConnection.open ? window._liveConnection : null);
  }

  function isChimpiUser() {
    return !!(window._isChimpiMode || 
      (new URLSearchParams(window.location.search).get('rol') === 'chimpi') || 
      (new URLSearchParams(window.location.search).get('chimpi') === '1'));
  }

  // Sonidos Retro
  function snd(freq, type, dur) {
    if (typeof playRetroTone === 'function') {
      playRetroTone(freq, type, dur);
    }
  }

  function soundFire() {
    snd(220, 'sawtooth', 0.12);
    setTimeout(() => snd(440, 'triangle', 0.1), 60);
  }

  function soundExplode() {
    snd(90, 'square', 0.28);
    setTimeout(() => snd(60, 'sawtooth', 0.25), 80);
    if (navigator.vibrate) try { navigator.vibrate([60, 40, 100]); } catch (e) {}
  }

  function soundBounce() {
    snd(520, 'sine', 0.08);
  }

  function soundWaterSplash() {
    snd(180, 'sine', 0.2);
    setTimeout(() => snd(240, 'triangle', 0.15), 100);
  }

  // ===========================================================================
  // GENERACIÓN DE TERRENO Y COLISIONES
  // ===========================================================================
  function initTerrain() {
    terrainCanvas = document.createElement('canvas');
    terrainCanvas.width = W;
    terrainCanvas.height = H;
    terrainCtx = terrainCanvas.getContext('2d', { willReadFrequently: true });

    terrainCtx.clearRect(0, 0, W, H);

    // Generar alturas suaves con colinas
    const heights = [];
    const hillSeed1 = Math.random() * 10;
    const hillSeed2 = Math.random() * 10;

    for (let x = 0; x < W; x++) {
      // Perfil de dos colinas a los lados y valle/loma en el centro
      const h1 = Math.sin((x * 0.016) + hillSeed1) * 35;
      const h2 = Math.cos((x * 0.035) + hillSeed2) * 18;
      // Curva base cóncava/ondulada con suelo firme en los extremos
      const edgeSupport = Math.sin((x / W) * Math.PI) * 20;
      const y = 145 + h1 + h2 - edgeSupport;
      heights.push(Math.min(WATER_Y - 14, Math.max(75, y)));
    }

    // Dibujar el cuerpo del terreno
    terrainCtx.beginPath();
    terrainCtx.moveTo(0, H);
    terrainCtx.lineTo(0, heights[0]);
    for (let x = 1; x < W; x++) {
      terrainCtx.lineTo(x, heights[x]);
    }
    terrainCtx.lineTo(W, H);
    terrainCtx.closePath();

    // Gradiente de tierra/nieve
    const grad = terrainCtx.createLinearGradient(0, 70, 0, H);
    grad.addColorStop(0, '#5c4033'); // Tierra superior
    grad.addColorStop(0.3, '#795548');
    grad.addColorStop(0.7, '#4e342e');
    grad.addColorStop(1, '#2d1f1b');
    terrainCtx.fillStyle = grad;
    terrainCtx.fill();

    // Capa de césped / nieve en la superficie superior (6px)
    terrainCtx.beginPath();
    terrainCtx.moveTo(0, heights[0]);
    for (let x = 1; x < W; x++) {
      terrainCtx.lineTo(x, heights[x]);
    }
    terrainCtx.strokeStyle = '#2ed573'; // Verde brillante césped
    terrainCtx.lineWidth = 5;
    terrainCtx.stroke();

    // Toque superior blanco de nieve/escarcha
    terrainCtx.beginPath();
    terrainCtx.moveTo(0, heights[0] - 1);
    for (let x = 1; x < W; x++) {
      terrainCtx.lineTo(x, heights[x] - 1);
    }
    terrainCtx.strokeStyle = '#ffffff';
    terrainCtx.lineWidth = 2;
    terrainCtx.stroke();
  }

  // Comprobar si un píxel es terreno sólido
  function isSolid(x, y) {
    if (x < 0 || x >= W) return false;
    if (y < 0) return false;
    if (y >= WATER_Y) return false;
    try {
      const p = terrainCtx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
      return p[3] > 40; // Alfa > 40
    } catch (e) {
      return false;
    }
  }

  // Hacer cráter en el terreno (destrucción estilo Worms con destination-out)
  function createCrater(cx, cy, radius) {
    terrainCtx.save();
    terrainCtx.globalCompositeOperation = 'destination-out';
    terrainCtx.beginPath();
    terrainCtx.arc(cx, cy, radius, 0, Math.PI * 2);
    terrainCtx.fill();
    terrainCtx.restore();

    // Partículas de tierra y humo
    for (let i = 0; i < 22; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 1.2 + Math.random() * 3.5;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 1.5,
        color: ['#ff4757', '#ffa502', '#2ed573', '#795548', '#ffffff', '#2f3542'][Math.floor(Math.random() * 6)],
        radius: 2 + Math.random() * 3,
        life: 1,
        decay: 0.025 + Math.random() * 0.03
      });
    }
  }

  // Buscar el suelo vertical más cercano para situar un personaje
  function findGroundY(x, startY) {
    let y = Math.max(0, Math.floor(startY));
    while (y < WATER_Y && !isSolid(x, y)) {
      y++;
    }
    return y;
  }

  // ===========================================================================
  // FÍSICAS DE PERSONAJES (GRAVEDAD, PASOS Y AGUA)
  // ===========================================================================
  function updateCharacterPhysics(p) {
    if (p.isDead) return;

    // Si está en el agua
    if (p.y >= WATER_Y - 2) {
      p.hp = 0;
      p.isDead = true;
      soundWaterSplash();
      addFloatingText(p.x, p.y - 10, '¡AL AGUA! 💦', '#00d2d3');
      for (let i = 0; i < 15; i++) {
        particles.push({
          x: p.x,
          y: WATER_Y,
          vx: (Math.random() - 0.5) * 3,
          vy: -1.5 - Math.random() * 2.5,
          color: '#00d2d3',
          radius: 2 + Math.random() * 2,
          life: 1,
          decay: 0.03
        });
      }
      return;
    }

    // Gravedad
    if (p.vy !== 0 || !isSolid(p.x, p.y + 1)) {
      p.vy += 0.25; // gravedad
      p.y += p.vy;
      p.x += p.vx;
      p.vx *= 0.92;

      // Si aterriza en terreno sólido
      if (isSolid(p.x, p.y)) {
        // Sacar del suelo
        while (isSolid(p.x, p.y) && p.y > 0) {
          p.y--;
        }
        p.vy = 0;
        p.vx = 0;
      }
    } else {
      p.vy = 0;
      p.vx = 0;
    }
  }

  // Movimiento horizontal (caminar paso a paso con trepada suave)
  function moveCharacter(p, dir) {
    if (p.isDead || isResolving || isGameOver) return;
    if (p.movesLeft <= 0) return;

    const targetX = p.x + (dir * 2);
    if (targetX < 12 || targetX > W - 12) return;

    p.facing = dir;
    p.movesLeft--;

    // Comprobar si puede avanzar o subir una pequeña pendiente (hasta 4px)
    let canStep = false;
    for (let dy = -4; dy <= 4; dy++) {
      const checkY = p.y + dy;
      if (isSolid(targetX, checkY + 1) && !isSolid(targetX, checkY)) {
        p.x = targetX;
        p.y = checkY;
        canStep = true;
        break;
      }
    }

    // Si hay un hueco hacia abajo
    if (!canStep && !isSolid(targetX, p.y)) {
      p.x = targetX;
    }

    snd(280, 'sine', 0.04);
    updateControlsUI();
  }

  // ===========================================================================
  // SISTEMA DE DISPARO Y BALÍSTICA
  // ===========================================================================
  function launchProjectile(shooter, angleDeg, powerPct, weaponType, isRemote) {
    if (isResolving || isGameOver) return;
    isResolving = true;

    // Si es partida en vivo y es tiro local, notificar al rival
    if (isLiveGame && !isRemote) {
      const conn = getConnection();
      if (conn) {
        try {
          conn.send({
            type: 'WORMS_SHOT',
            shooterId: shooter.id,
            angle: angleDeg,
            power: powerPct,
            weapon: weaponType,
            wind: wind,
            turn: turnNumber,
            startX: shooter.x,
            startY: shooter.y
          });
        } catch (e) {}
      }
    }

    soundFire();
    updateStatusMsg(`${shooter.icon} ${shooter.name} dispara ${weaponType === 'grenade' ? '💣 Granada' : '🐟 Sardina'}...`);

    const rad = (angleDeg * Math.PI) / 180;
    // Potencia ajustada a escala
    const speed = (powerPct / 100) * 8.2 + 1.8;
    const vx = Math.cos(rad) * speed;
    const vy = -Math.sin(rad) * speed;

    activeBullet = {
      shooter: shooter.id,
      weapon: weaponType,
      x: shooter.x + (Math.cos(rad) * 14),
      y: shooter.y - 12 - (Math.sin(rad) * 14),
      vx: vx,
      vy: vy,
      timer: weaponType === 'grenade' ? 140 : 250, // frames de vida
      bounces: 0,
      radius: weaponType === 'grenade' ? 5 : 4
    };
  }

  function updateBullet() {
    if (!activeBullet) return;

    const b = activeBullet;
    b.timer--;

    // Físicas: gravedad + viento suave
    b.vy += 0.18;
    b.vx += (wind * 0.012);

    // Humo / estela del proyectil
    if (Math.random() < 0.7) {
      particles.push({
        x: b.x,
        y: b.y,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        color: b.weapon === 'grenade' ? '#747d8c' : '#70a1ff',
        radius: 2 + Math.random() * 2,
        life: 0.8,
        decay: 0.04
      });
    }

    // Avanzar posición
    b.x += b.vx;
    b.y += b.vy;

    // Comprobar si cae al agua
    if (b.y >= WATER_Y) {
      soundWaterSplash();
      addFloatingText(b.x, WATER_Y - 10, '¡Chof! 💦', '#00d2d3');
      for (let i = 0; i < 10; i++) {
        particles.push({
          x: b.x,
          y: WATER_Y,
          vx: (Math.random() - 0.5) * 2,
          vy: -1 - Math.random() * 2,
          color: '#00d2d3',
          radius: 2,
          life: 0.7,
          decay: 0.04
        });
      }
      activeBullet = null;
      endTurnResolution();
      return;
    }

    // Comprobar colisión con el terreno o personajes
    const hitTerrain = isSolid(b.x, b.y);
    const hitPinchi = Math.hypot(b.x - pinchi.x, b.y - (pinchi.y - 8)) < 13;
    const hitChimpi = Math.hypot(b.x - chimpi.x, b.y - (chimpi.y - 8)) < 13;

    if (b.weapon === 'sardine') {
      // Sardina explota al primer contacto
      if (hitTerrain || hitPinchi || hitChimpi || b.timer <= 0) {
        detonateBullet(b.x, b.y, 20, 38);
        activeBullet = null;
        return;
      }
    } else if (b.weapon === 'grenade') {
      // Granada rebota hasta 3 veces o hasta que expire el temporizador
      if (hitTerrain) {
        soundBounce();
        b.bounces++;
        b.vx *= 0.55;
        b.vy = -b.vy * 0.5;
        b.y -= 2; // despegar del suelo
        if (b.bounces >= 3 || b.timer <= 0) {
          detonateBullet(b.x, b.y, 28, 55);
          activeBullet = null;
          return;
        }
      } else if (hitPinchi || hitChimpi) {
        // Impacto directo con personaje hace detonar la granada
        detonateBullet(b.x, b.y, 28, 55);
        activeBullet = null;
        return;
      } else if (b.timer <= 0) {
        detonateBullet(b.x, b.y, 28, 55);
        activeBullet = null;
        return;
      }
    }
  }

  // Detonación y daño de área
  function detonateBullet(cx, cy, craterRadius, maxDamage) {
    soundExplode();
    createCrater(cx, cy, craterRadius);

    // Calcular daño e impulso a los personajes
    [pinchi, chimpi].forEach(p => {
      if (p.isDead) return;
      const dist = Math.hypot(p.x - cx, (p.y - 8) - cy);
      const blastRadius = craterRadius + 14;

      if (dist < blastRadius) {
        const factor = (1 - (dist / blastRadius));
        const dmg = Math.max(10, Math.round(factor * maxDamage));
        p.hp = Math.max(0, p.hp - dmg);

        // Impulso / knockback
        const pushAngle = Math.atan2((p.y - 8) - cy, p.x - cx);
        p.vx += Math.cos(pushAngle) * (factor * 5);
        p.vy = -Math.abs(Math.sin(pushAngle) * (factor * 4.5)) - 1.5;

        addFloatingText(p.x, p.y - 22, `-${dmg} HP`, '#ff4757');

        if (p.hp <= 0) {
          p.isDead = true;
          addFloatingText(p.x, p.y - 34, '¡KO! 💥', '#ff6b81');
        }
      }
    });

    updateHpUI();

    // Esperar a que las físicas se asienten antes del siguiente turno
    setTimeout(() => {
      endTurnResolution();
    }, 1200);
  }

  function endTurnResolution() {
    isResolving = false;
    checkGameWinner();

    if (!isGameOver) {
      nextTurn();
    }
  }

  // ===========================================================================
  // FLUJO DE TURNOS Y CONDICIÓN DE VICTORIA
  // ===========================================================================
  function nextTurn() {
    currentTurn = (currentTurn === 'PINCHI') ? 'CHIMPI' : 'PINCHI';
    turnNumber++;

    // Nuevo viento aleatorio (-4 a +4)
    wind = Math.floor(Math.random() * 9) - 4;

    // Restaurar combustible de pasos para el personaje activo
    pinchi.movesLeft = 30;
    chimpi.movesLeft = 30;

    updateWindUI();
    updateControlsUI();

    const activeP = (currentTurn === 'PINCHI') ? pinchi : chimpi;
    updateStatusMsg(`🎯 Turno de ${activeP.icon} ${activeP.name} (Viento: ${formatWind(wind)})`);

    // Si es modo solitario y le toca a Chimpi, activar su IA
    if (!isLiveGame && currentTurn === 'CHIMPI' && !chimpi.isDead) {
      runChimpiAI();
    }
  }

  function checkGameWinner() {
    if (pinchi.isDead && chimpi.isDead) {
      triggerGameOver('DRAW', '¡Empate épico! Ambos cayeron en combate ❄️🐷');
    } else if (pinchi.isDead) {
      triggerGameOver('CHIMPI', '🐷 ¡Victoria para Chimpi el Cerdito! Oinss 🏆');
    } else if (chimpi.isDead) {
      triggerGameOver('PINCHI', '🐧 ¡Victoria aplastante para Pinchi! ¡Pío Pío! 🏆');
    }
  }

  function triggerGameOver(winner, msg) {
    isGameOver = true;
    updateStatusMsg(msg);
    snd(winner === 'PINCHI' ? 587.33 : 440, 'triangle', 0.4);

    const hudStatus = document.getElementById('wormsStatus');
    if (hudStatus) {
      hudStatus.innerHTML = `
        <div style="background:#fff3cd;border:1px solid #ffeeba;padding:8px;border-radius:6px;margin-top:6px;color:#856404;font-size:13px;text-align:center;">
          <b>${msg}</b>
          <div style="margin-top:6px;">
            <button class="msn-game-launch-btn" style="padding:4px 12px;font-size:12px;" onclick="window.restartWormsGame()">
              🔄 Jugar Otra Ronda
            </button>
          </div>
        </div>
      `;
    }
  }

  // ===========================================================================
  // IA DE CHIMPI EL CERDITO (MODO SOLITARIO)
  // ===========================================================================
  function runChimpiAI() {
    disablePlayerControls(true);

    const chimpiThoughts = [
      "Chimpi: Hummm... calculando con mi hocico balístico... 🐷",
      "Chimpi: ¡Oinss! A ver si te llega este regalo porcino...",
      "Chimpi: Ajustando ángulo contra el viento... ¡Allá va! 🐽",
      "Chimpi: ¡No te muevas, Pinchi, que afino la puntería!"
    ];
    updateStatusMsg(chimpiThoughts[Math.floor(Math.random() * chimpiThoughts.length)]);

    setTimeout(() => {
      if (isGameOver || chimpi.isDead) return;

      // 1. Ocasionalmente dar un par de pasos para posicionarse
      if (Math.random() < 0.6) {
        const stepDir = Math.random() < 0.5 ? -1 : 1;
        for (let i = 0; i < 4; i++) {
          moveCharacter(chimpi, stepDir);
        }
      }

      // 2. Elegir arma (70% Sardina, 30% Granada)
      const weapon = Math.random() < 0.35 ? 'grenade' : 'sardine';
      chimpi.weapon = weapon;

      // 3. Calcular vector hacia Pinchi
      const dx = pinchi.x - chimpi.x; // negativo (Pinchi está a la izquierda)
      const dy = (pinchi.y - 8) - (chimpi.y - 8);
      const dist = Math.abs(dx);

      // Ángulo estimado hacia la izquierda (entre 120° y 155°)
      let baseAngle = 135;
      if (dy < -20) baseAngle = 145; // Pinchi está más alto
      if (dy > 20) baseAngle = 125;  // Pinchi está más bajo

      // Compensar viento
      baseAngle += (wind * 1.8);

      // Dispersión aleatoria (para que la IA no sea un francotirador perfecto)
      const errorAngle = (Math.random() - 0.5) * 14;
      const finalAngle = Math.max(105, Math.min(165, baseAngle + errorAngle));

      // Potencia estimada según distancia (distancia típica ~200-280px)
      let basePower = Math.min(95, Math.max(35, (dist / 3.4) + 15));
      // Si el viento sopla a favor (negativo) o en contra (positivo)
      basePower -= (wind * 2.5);
      const errorPower = (Math.random() - 0.5) * 12;
      const finalPower = Math.max(25, Math.min(100, Math.round(basePower + errorPower)));

      chimpi.angle = Math.round(finalAngle);
      chimpi.power = Math.round(finalPower);

      // Disparar
      setTimeout(() => {
        if (!isGameOver && !chimpi.isDead) {
          launchProjectile(chimpi, chimpi.angle, chimpi.power, chimpi.weapon, false);
        }
      }, 700);
    }, 1100);
  }

  // ===========================================================================
  // BUCLE PRINCIPAL DE DIBUJO Y RENDER (CANVAS 2D)
  // ===========================================================================
  function startRenderLoop() {
    function loop() {
      // 1. Limpiar pantalla y pintar cielo ártico degradado
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, '#74b9ff');
      skyGrad.addColorStop(0.65, '#a29bfe');
      skyGrad.addColorStop(1, '#dfe6e9');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // Nubes decorativas en el fondo
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.arc(70, 35, 18, 0, Math.PI * 2);
      ctx.arc(95, 30, 24, 0, Math.PI * 2);
      ctx.arc(120, 35, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(260, 45, 16, 0, Math.PI * 2);
      ctx.arc(285, 40, 22, 0, Math.PI * 2);
      ctx.arc(310, 45, 14, 0, Math.PI * 2);
      ctx.fill();

      // Montañas de hielo lejanas
      ctx.fillStyle = 'rgba(180, 210, 240, 0.5)';
      ctx.beginPath();
      ctx.moveTo(30, 150);
      ctx.lineTo(85, 75);
      ctx.lineTo(140, 150);
      ctx.lineTo(210, 85);
      ctx.lineTo(290, 150);
      ctx.fill();

      // 2. Dibujar capa de terreno destructible
      if (terrainCanvas) {
        ctx.drawImage(terrainCanvas, 0, 0);
      }

      // 3. Agua animada en la parte inferior
      const time = Date.now() * 0.003;
      ctx.fillStyle = 'rgba(9, 132, 227, 0.82)';
      ctx.beginPath();
      ctx.moveTo(0, H);
      ctx.lineTo(0, WATER_Y);
      for (let x = 0; x <= W; x += 10) {
        const wy = WATER_Y + Math.sin(x * 0.05 + time) * 2;
        ctx.lineTo(x, wy);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();

      // 4. Actualizar físicas y dibujar personajes
      updateCharacterPhysics(pinchi);
      updateCharacterPhysics(chimpi);

      drawCharacter(pinchi);
      drawCharacter(chimpi);

      // 5. Actualizar y dibujar proyectil activo
      if (activeBullet) {
        updateBullet();
        if (activeBullet) {
          drawBullet(activeBullet);
        }
      }

      // 6. Actualizar y dibujar partículas
      drawParticles();

      // 7. Textos flotantes de daño
      drawFloatingTexts();

      animId = requestAnimationFrame(loop);
    }

    if (animId) cancelAnimationFrame(animId);
    animId = requestAnimationFrame(loop);
  }

  // Dibujar personaje (Pinchi 🐧 o Chimpi 🐷)
  function drawCharacter(p) {
    if (p.isDead) return;

    ctx.save();
    ctx.translate(p.x, p.y);

    // Indicador de turno activo (flechita parpadeante arriba)
    if (currentTurn === p.id && !isResolving && !isGameOver) {
      const bob = Math.sin(Date.now() * 0.008) * 3;
      ctx.fillStyle = '#fffa65';
      ctx.beginPath();
      ctx.moveTo(0, -32 + bob);
      ctx.lineTo(-5, -38 + bob);
      ctx.lineTo(5, -38 + bob);
      ctx.closePath();
      ctx.fill();
    }

    // Barra de vida
    const barW = 26;
    const barH = 4;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(-barW / 2, -26, barW, barH);
    ctx.fillStyle = p.hp > 50 ? '#2ed573' : (p.hp > 25 ? '#ffa502' : '#ff4757');
    ctx.fillRect(-barW / 2, -26, (p.hp / 100) * barW, barH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(-barW / 2, -26, barW, barH);

    // Etiqueta de HP y nombre
    ctx.font = 'bold 8px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`${p.hp}`, 0, -28);

    // Mirilla / línea guía si es su turno
    if (currentTurn === p.id && !isResolving && !isGameOver) {
      const rad = (p.angle * Math.PI) / 180;
      const aimDist = 20 + (p.power / 100) * 18;
      ctx.beginPath();
      ctx.setLineDash([2, 3]);
      ctx.moveTo(0, -10);
      ctx.lineTo(Math.cos(rad) * aimDist, -10 - (Math.sin(rad) * aimDist));
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.setLineDash([]);

      // Puntero en el extremo
      ctx.fillStyle = '#ff4757';
      ctx.beginPath();
      ctx.arc(Math.cos(rad) * aimDist, -10 - (Math.sin(rad) * aimDist), 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Emoji del personaje con orientación
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    if (p.facing === -1) {
      ctx.scale(-1, 1);
    }
    ctx.fillText(p.icon, 0, 0);

    ctx.restore();
  }

  // Dibujar proyectil en vuelo
  function drawBullet(b) {
    ctx.save();
    ctx.translate(b.x, b.y);

    if (b.weapon === 'grenade') {
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💣', 0, 0);
    } else {
      // Sardina rotada según su vector de velocidad
      const angle = Math.atan2(b.vy, b.vx);
      ctx.rotate(angle);
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐟', 0, 0);
    }

    ctx.restore();
  }

  // Partículas
  function drawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += 0.08; // gravedad ligera
      pt.life -= pt.decay;

      if (pt.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.life);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Textos flotantes
  function addFloatingText(x, y, text, color) {
    floatingTexts.push({
      x: x,
      y: y,
      text: text,
      color: color || '#ffffff',
      life: 1.0,
      decay: 0.02
    });
  }

  function drawFloatingTexts() {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y -= 0.6;
      ft.life -= ft.decay;

      if (ft.life <= 0) {
        floatingTexts.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.life);
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = ft.color;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.textAlign = 'center';
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  // ===========================================================================
  // INTERFAZ DE USUARIO Y CONTROLES
  // ===========================================================================
  function formatWind(w) {
    if (w === 0) return '0 (Calma)';
    if (w < 0) return `${Math.abs(w)} ◀ O`;
    return `${w} E ▶`;
  }

  function updateWindUI() {
    const el = document.getElementById('wormsWind');
    if (el) {
      el.innerHTML = `💨 Viento: <b>${formatWind(wind)}</b>`;
      el.style.color = wind === 0 ? '#636e72' : (wind > 0 ? '#0984e3' : '#d63031');
    }
  }

  function updateHpUI() {
    const hpP = document.getElementById('wormsHpP');
    const hpC = document.getElementById('wormsHpC');
    if (hpP) hpP.textContent = `${pinchi.hp}`;
    if (hpC) hpC.textContent = `${chimpi.hp}`;
  }

  function updateStatusMsg(msg) {
    const st = document.getElementById('wormsStatus');
    if (st) st.textContent = msg;
  }

  function getLocalPlayer() {
    return (isLiveGame && isChimpiRole) ? chimpi : pinchi;
  }

  function disablePlayerControls(disabled) {
    const btns = document.querySelectorAll('.worms-ctrl-btn, #wormsFireBtn, #wormsAngleSlider, #wormsPowerSlider');
    btns.forEach(b => {
      b.disabled = disabled;
      b.style.opacity = disabled ? '0.5' : '1';
    });
  }

  function updateControlsUI() {
    const local = getLocalPlayer();
    const isMyTurn = (currentTurn === local.id);

    const turnBadge = document.getElementById('wormsTurnBadge');
    if (turnBadge) {
      if (isMyTurn) {
        turnBadge.innerHTML = `🟢 <b>¡TU TURNO (${local.icon} ${local.name})!</b>`;
        turnBadge.style.color = '#2ed573';
      } else {
        const other = (local.id === 'PINCHI') ? chimpi : pinchi;
        turnBadge.innerHTML = `⏳ Esperando a <b>${other.icon} ${other.name}</b>...`;
        turnBadge.style.color = '#e17055';
      }
    }

    // Deshabilitar controles si no es mi turno o si estamos en resolución
    disablePlayerControls(!isMyTurn || isResolving || isGameOver);

    // Sincronizar sliders y valores
    const angSlider = document.getElementById('wormsAngleSlider');
    const angVal = document.getElementById('wormsAngleVal');
    if (angSlider && angVal) {
      angSlider.value = local.angle;
      angVal.textContent = `${local.angle}°`;
    }

    const powSlider = document.getElementById('wormsPowerSlider');
    const powVal = document.getElementById('wormsPowerVal');
    if (powSlider && powVal) {
      powSlider.value = local.power;
      powVal.textContent = `${local.power}%`;
    }

    // Botones de armas
    const btnSardine = document.getElementById('btnWepSardine');
    const btnGrenade = document.getElementById('btnWepGrenade');
    if (btnSardine && btnGrenade) {
      btnSardine.style.background = local.weapon === 'sardine' ? '#0984e3' : '#dfe6e9';
      btnSardine.style.color = local.weapon === 'sardine' ? '#ffffff' : '#2d3436';
      btnGrenade.style.background = local.weapon === 'grenade' ? '#0984e3' : '#dfe6e9';
      btnGrenade.style.color = local.weapon === 'grenade' ? '#ffffff' : '#2d3436';
    }

    // Pasos restantes
    const movesElem = document.getElementById('wormsMovesLeft');
    if (movesElem) {
      movesElem.textContent = `${local.movesLeft}`;
    }
  }

  // ===========================================================================
  // EVENTOS DE ENTRADA (MÓVIL, RATÓN Y TECLADO)
  // ===========================================================================
  function setupInputEvents() {
    // Teclado para PC
    window.onkeydown = function(e) {
      const local = getLocalPlayer();
      if (currentTurn !== local.id || isResolving || isGameOver) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        moveCharacter(local, -1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        moveCharacter(local, 1);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        local.angle = Math.min(180, local.angle + 2);
        updateControlsUI();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        local.angle = Math.max(0, local.angle - 2);
        updateControlsUI();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        window.fireWormsWeapon();
      } else if (e.key === '1') {
        window.selectWormsWeapon('sardine');
      } else if (e.key === '2') {
        window.selectWormsWeapon('grenade');
      }
    };
  }

  // ===========================================================================
  // APERTURA Y REINICIO DEL JUEGO
  // ===========================================================================
  function openWormsGame(forceSolo) {
    if (typeof closeGameModal === 'function') closeGameModal(true);

    const modal = window.gameModal || document.getElementById('gameModal');
    const title = window.gameTitle || document.getElementById('gameTitle');
    const content = window.gameContent || document.getElementById('gameContent');

    if (title) title.innerHTML = '💥 MSN Games - Worms: Pinchi 🐧 vs Chimpi 🐷';

    const conn = getConnection();
    isLiveGame = !forceSolo && !!conn;
    isChimpiRole = isChimpiUser();
    window._activeLiveGame = isLiveGame ? 'Worms MSN' : null;

    clearGame();
    window._activeGameCleanup = clearGame;

    if (content) {
      content.innerHTML = `
        <style>
          .worms-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            max-width: 360px;
            margin: 0 auto;
            user-select: none;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .worms-hud {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            margin-bottom: 4px;
            font-size: 12px;
            font-weight: bold;
          }
          .worms-canvas-frame {
            width: 100%;
            max-width: 360px;
            height: 240px;
            border: 3px solid #004a9f;
            border-radius: 8px;
            background: #74b9ff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            position: relative;
            touch-action: none;
            overflow: hidden;
          }
          .worms-canvas {
            display: block;
            width: 100%;
            height: 100%;
            cursor: crosshair;
          }
          .worms-ctrl-panel {
            width: 100%;
            background: #f1f2f6;
            border: 1px solid #ced6e0;
            border-radius: 8px;
            padding: 6px;
            margin-top: 6px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 5px;
          }
          .worms-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 6px;
          }
          .worms-ctrl-btn {
            background: #ffffff;
            border: 1px solid #a4b0be;
            border-radius: 5px;
            padding: 5px 10px;
            font-size: 13px;
            font-weight: bold;
            cursor: pointer;
            touch-action: manipulation;
          }
          .worms-ctrl-btn:active {
            background: #dfe4ea;
            transform: scale(0.97);
          }
          .worms-fire-btn {
            background: linear-gradient(180deg, #ff4757, #ee5253);
            color: #ffffff;
            border: none;
            border-radius: 6px;
            padding: 8px 14px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(238,82,83,0.4);
            flex: 1;
          }
          .worms-fire-btn:active {
            transform: scale(0.96);
          }
        </style>

        <div class="worms-container">
          <div class="worms-hud">
            <span style="color:#0078d7;">Pinchi 🐧: <b id="wormsHpP">100</b> HP</span>
            <span id="wormsWind" style="font-size:11px;color:#0984e3;">💨 Viento: <b>0</b></span>
            <span style="color:#e84393;">Chimpi 🐷: <b id="wormsHpC">100</b> HP</span>
          </div>

          <div class="worms-canvas-frame">
            <canvas class="worms-canvas" id="wormsCanvas" width="360" height="240"></canvas>
          </div>

          <div class="worms-ctrl-panel">
            <div class="worms-row">
              <span id="wormsTurnBadge" style="font-size:12px;font-weight:bold;"></span>
              <div style="display:flex;gap:4px;">
                <button class="worms-ctrl-btn" onclick="window.stepWormsMove(-1)">◀️ Mover</button>
                <button class="worms-ctrl-btn" onclick="window.stepWormsMove(1)">Mover ▶️</button>
                <span style="font-size:10px;color:#747d8c;align-self:center;">(<span id="wormsMovesLeft">30</span> pas)</span>
              </div>
            </div>

            <div class="worms-row">
              <div style="display:flex;gap:4px;">
                <button id="btnWepSardine" class="worms-ctrl-btn" onclick="window.selectWormsWeapon('sardine')">🐟 Sardina</button>
                <button id="btnWepGrenade" class="worms-ctrl-btn" onclick="window.selectWormsWeapon('grenade')">💣 Granada</button>
              </div>

              <div style="display:flex;align-items:center;gap:4px;flex:1;justify-content:flex-end;">
                <label style="font-size:11px;font-weight:bold;">Ángulo:</label>
                <input type="range" id="wormsAngleSlider" min="0" max="180" value="45" style="width:75px;" oninput="window.changeWormsAngle(this.value)">
                <span id="wormsAngleVal" style="font-size:11px;font-weight:bold;width:30px;">45°</span>
              </div>
            </div>

            <div class="worms-row">
              <div style="display:flex;align-items:center;gap:4px;flex:1;">
                <label style="font-size:11px;font-weight:bold;">Fuerza:</label>
                <input type="range" id="wormsPowerSlider" min="15" max="100" value="55" style="flex:1;" oninput="window.changeWormsPower(this.value)">
                <span id="wormsPowerVal" style="font-size:11px;font-weight:bold;width:32px;">55%</span>
              </div>

              <button id="wormsFireBtn" class="worms-fire-btn" onclick="window.fireWormsWeapon()">
                🔥 ¡DISPARAR!
              </button>
            </div>
          </div>

          <div id="wormsStatus" style="font-size:12px;font-weight:bold;color:#2f3542;margin-top:6px;min-height:16px;text-align:center;"></div>

          <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
            <button class="msn-game-launch-btn" style="padding:4px 12px;font-size:12px;" onclick="window.restartWormsGame()">
              🔄 Reiniciar Duelo
            </button>
            ${typeof hubBackBtnHtml === 'function' ? hubBackBtnHtml() : ''}
          </div>
        </div>
      `;

      mainCanvas = document.getElementById('wormsCanvas');
      ctx = mainCanvas.getContext('2d');

      resetGameState();
      setupInputEvents();
      startRenderLoop();
    }

    if (modal) modal.style.display = 'flex';
  }

  function resetGameState() {
    isGameOver = false;
    isResolving = false;
    currentTurn = 'PINCHI';
    turnNumber = 1;
    wind = Math.floor(Math.random() * 7) - 3;
    activeBullet = null;
    particles = [];
    floatingTexts = [];

    // Inicializar terreno
    initTerrain();

    // Posicionar a Pinchi en la izquierda
    pinchi.x = 45;
    pinchi.y = findGroundY(pinchi.x, 90);
    pinchi.hp = 100;
    pinchi.facing = 1;
    pinchi.angle = 45;
    pinchi.power = 55;
    pinchi.weapon = 'sardine';
    pinchi.movesLeft = 30;
    pinchi.isDead = false;

    // Posicionar a Chimpi en la derecha
    chimpi.x = 315;
    chimpi.y = findGroundY(chimpi.x, 90);
    chimpi.hp = 100;
    chimpi.facing = -1;
    chimpi.angle = 135;
    chimpi.power = 55;
    chimpi.weapon = 'sardine';
    chimpi.movesLeft = 30;
    chimpi.isDead = false;

    updateHpUI();
    updateWindUI();
    updateControlsUI();
    updateStatusMsg(`🎯 ¡Comienza el duelo! Turno de ${pinchi.icon} Pinchi.`);
  }

  function clearGame() {
    isGameOver = true;
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    if (turnTimer) { clearInterval(turnTimer); turnTimer = null; }
    window.onkeydown = null;
  }

  // ===========================================================================
  // MÉTODOS PÚBLICOS GLOBALES
  // ===========================================================================
  window.openWormsGame = openWormsGame;

  window.restartWormsGame = function() {
    if (isLiveGame) {
      const conn = getConnection();
      if (conn) {
        try { conn.send({ type: 'WORMS_RESTART' }); } catch (e) {}
      }
    }
    resetGameState();
  };

  window.stepWormsMove = function(dir) {
    const local = getLocalPlayer();
    if (currentTurn !== local.id || isResolving || isGameOver) return;
    moveCharacter(local, dir);

    if (isLiveGame) {
      const conn = getConnection();
      if (conn) {
        try {
          conn.send({
            type: 'WORMS_MOVE',
            shooterId: local.id,
            dir: dir,
            x: local.x,
            y: local.y
          });
        } catch (e) {}
      }
    }
  };

  window.selectWormsWeapon = function(weapon) {
    const local = getLocalPlayer();
    local.weapon = weapon;
    updateControlsUI();
  };

  window.changeWormsAngle = function(val) {
    const local = getLocalPlayer();
    local.angle = parseInt(val, 10);
    const valElem = document.getElementById('wormsAngleVal');
    if (valElem) valElem.textContent = `${local.angle}°`;
  };

  window.changeWormsPower = function(val) {
    const local = getLocalPlayer();
    local.power = parseInt(val, 10);
    const valElem = document.getElementById('wormsPowerVal');
    if (valElem) valElem.textContent = `${local.power}%`;
  };

  window.fireWormsWeapon = function() {
    const local = getLocalPlayer();
    if (currentTurn !== local.id || isResolving || isGameOver) return;
    launchProjectile(local, local.angle, local.power, local.weapon, false);
    updateControlsUI();
  };

  // Manejadores de sincronización remota WebRTC
  window._handleRemoteWormsMove = function(data) {
    const p = (data.shooterId === 'PINCHI') ? pinchi : chimpi;
    p.facing = data.dir;
    p.x = data.x;
    p.y = data.y;
  };

  window._handleRemoteWormsShot = function(data) {
    const shooter = (data.shooterId === 'PINCHI') ? pinchi : chimpi;
    shooter.x = data.startX;
    shooter.y = data.startY;
    wind = data.wind;
    updateWindUI();
    launchProjectile(shooter, data.angle, data.power, data.weapon, true);
  };

  window._handleRemoteWormsRestart = function() {
    resetGameState();
  };

})();
