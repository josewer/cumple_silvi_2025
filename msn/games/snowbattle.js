// =============================================================================
// MSN GAMES - GUERRA DE NIEVE (DUELO TÁCTICO SIMULTÁNEO: TRIÁNGULO DE COMBATE)
// =============================================================================

(function() {
  let hpPinchi = 5;
  let hpChimpi = 5;
  let currentRound = 1;
  let roundTimeLeft = 5;
  let roundTimer = null;
  let animId = null;

  let localChoice = null;
  let remoteChoice = null;
  let isResolving = false;
  let isGameOver = false;
  let isLiveGame = false;
  let isChimpiRole = false;

  // Acciones posibles: 'FAST' (Tiro Rápido), 'BOMB' (Bomba Parabólica), 'SHIELD' (Escudo/Refugio)
  const ACTIONS = {
    FAST: { name: 'Tiro Rápido ⚡', damage: 1, icon: '⚡' },
    BOMB: { name: 'Bomba Parabólica 💣', damage: 2, icon: '💣' },
    SHIELD: { name: 'Escudo / Refugio 🛡️', damage: 0, icon: '🛡️' }
  };

  function getConnection() {
    return (window.liveChimpi && window.liveChimpi.conn && window.liveChimpi.conn.open)
      ? window.liveChimpi.conn
      : (window._liveConnection && window._liveConnection.open ? window._liveConnection : null);
  }

  function openSnowBattleGame(forceSolo) {
    if (typeof closeGameModal === 'function') closeGameModal(true);

    const modal = window.gameModal || document.getElementById('gameModal');
    const title = window.gameTitle || document.getElementById('gameTitle');
    const content = window.gameContent || document.getElementById('gameContent');

    if (title) title.innerHTML = '❄️ MSN Games - Guerra de Nieve: ¡Duelo Táctico Simultáneo!';

    const conn = getConnection();
    isLiveGame = !forceSolo && !!conn;
    isChimpiRole = !!window._isChimpiMode;
    window._activeLiveGame = isLiveGame ? 'Guerra de Nieve' : null;

    hpPinchi = 5;
    hpChimpi = 5;
    currentRound = 1;
    localChoice = null;
    remoteChoice = null;
    isResolving = false;
    isGameOver = false;

    clearTimers();

    if (content) {
      content.innerHTML = `
        <style>
          .snow-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            max-width: 360px;
            margin: 0 auto;
            user-select: none;
          }
          .snow-rules-bar {
            width: 340px;
            background: #e7f5ff;
            border: 1px solid #70a1ff;
            border-radius: 6px;
            padding: 4px 6px;
            font-size: 10px;
            color: #004a9f;
            text-align: center;
            margin-bottom: 6px;
            box-sizing: border-box;
          }
          .snow-hud {
            display: flex;
            justify-content: space-between;
            width: 340px;
            margin-bottom: 6px;
          }
          .snow-hud-card {
            background: #f1f2f6;
            border: 2px solid #0078d7;
            border-radius: 8px;
            padding: 6px 10px;
            width: 160px;
            box-sizing: border-box;
          }
          .snow-hearts {
            color: #e84118;
            font-size: 14px;
            letter-spacing: 2px;
            margin-top: 2px;
          }
          .snow-stage {
            width: 340px;
            height: 180px;
            background: linear-gradient(180deg, #74b9ff 0%, #dfe6e9 75%, #ffffff 100%);
            border: 3px solid #0984e3;
            border-radius: 12px;
            position: relative;
            overflow: hidden;
            box-shadow: inset 0 2px 6px rgba(0,0,0,0.25);
          }
          .snow-ground {
            position: absolute;
            bottom: 0;
            width: 100%;
            height: 35px;
            background: #ffffff;
            border-top: 3px solid #b2bec3;
          }
          .snow-char-left {
            position: absolute;
            left: 20px;
            bottom: 25px;
            font-size: 40px;
            text-align: center;
            transition: transform 0.25s;
            z-index: 3;
          }
          .snow-fort-left {
            position: absolute;
            left: 60px;
            bottom: 25px;
            width: 24px;
            height: 38px;
            background: #dfe6e9;
            border: 2px solid #b2bec3;
            border-radius: 6px;
            z-index: 2;
          }
          .snow-char-right {
            position: absolute;
            right: 20px;
            bottom: 25px;
            font-size: 40px;
            text-align: center;
            transition: transform 0.25s;
            z-index: 3;
          }
          .snow-fort-right {
            position: absolute;
            right: 60px;
            bottom: 25px;
            width: 24px;
            height: 38px;
            background: #a29bfe;
            border: 2px solid #6c5ce7;
            border-radius: 6px;
            z-index: 2;
          }
          .snow-shield-aura {
            position: absolute;
            width: 48px;
            height: 56px;
            border: 3px solid #00cec9;
            background: rgba(0, 206, 201, 0.35);
            border-radius: 10px;
            box-shadow: 0 0 12px #00cec9;
            display: none;
            z-index: 4;
          }
          .snow-ball-elem {
            position: absolute;
            width: 16px;
            height: 16px;
            background: radial-gradient(circle, #ffffff 40%, #b2bec3 90%);
            border-radius: 50%;
            box-shadow: 0 0 8px rgba(0,0,0,0.3);
            display: none;
            z-index: 10;
          }
          .snow-round-banner {
            width: 340px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 13px;
            font-weight: bold;
            margin: 8px 0 6px;
          }
          .snow-actions-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
            width: 340px;
          }
          .snow-action-btn {
            background: linear-gradient(180deg, #ffffff, #e6edf5);
            border: 2px solid #0078d7;
            border-radius: 8px;
            padding: 8px 4px;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 3px;
            transition: all 0.15s;
            touch-action: manipulation;
          }
          .snow-action-btn:hover {
            background: #d0ebff;
          }
          .snow-action-btn.selected {
            background: #0078d7;
            color: #ffffff;
            border-color: #004a9f;
            transform: scale(0.97);
          }
          .snow-action-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          .snow-action-title {
            font-size: 11px;
            font-weight: bold;
          }
          .snow-action-desc {
            font-size: 9px;
            opacity: 0.85;
            text-align: center;
          }
          .snow-status-msg {
            font-size: 12px;
            font-weight: bold;
            color: #d35400;
            margin-top: 6px;
            min-height: 28px;
            text-align: center;
            padding: 0 4px;
            box-sizing: border-box;
          }
        </style>

        <div class="snow-container">
          <div class="snow-rules-bar">
            ⚡ <b>Rápido</b> corta Bomba (1 dmg) • 💣 <b>Bomba</b> revienta Escudo (2 dmg) • 🛡️ <b>Escudo</b> bloquea Rápido (0 dmg)
          </div>

          <div class="snow-hud">
            <div class="snow-hud-card">
              <div style="font-weight:bold;color:#0078d7;font-size:12px;">Pinchi 🐧</div>
              <div class="snow-hearts" id="snowHpPinchi">❤️❤️❤️❤️❤️</div>
            </div>
            <div class="snow-hud-card" style="text-align:right;">
              <div style="font-weight:bold;color:#e84393;font-size:12px;">Chimpi 🐷</div>
              <div class="snow-hearts" id="snowHpChimpi">❤️❤️❤️❤️❤️</div>
            </div>
          </div>

          <div class="snow-stage" id="snowStage">
            <div class="snow-ground"></div>

            <!-- Personajes y fortines -->
            <div class="snow-char-left" id="snowCharP">🐧</div>
            <div class="snow-fort-left" title="Iglú de Pinchi"></div>
            <div class="snow-shield-aura" id="snowShieldP" style="left:15px;bottom:20px;"></div>

            <div class="snow-char-right" id="snowCharC">🐷</div>
            <div class="snow-fort-right" title="Muro de barro de Chimpi"></div>
            <div class="snow-shield-aura" id="snowShieldC" style="right:15px;bottom:20px;"></div>

            <!-- Bolas de nieve de ambos bandos -->
            <div class="snow-ball-elem" id="snowBallLeft"></div>
            <div class="snow-ball-elem" id="snowBallRight"></div>
          </div>

          <div class="snow-round-banner">
            <span style="color:#0078d7;" id="snowRoundLabel">Ronda 1</span>
            <span style="color:#e84118;" id="snowTimerLabel">⏳ Elige: 5.0s</span>
          </div>

          <div class="snow-actions-grid" id="snowActionsGrid">
            <button class="snow-action-btn" id="btnActFast" onclick="window.chooseSnowAction('FAST')">
              <span style="font-size:20px;">⚡</span>
              <span class="snow-action-title">Tiro Rápido</span>
              <span class="snow-action-desc">Cancela Bomba (1 dmg)</span>
            </button>
            <button class="snow-action-btn" id="btnActBomb" onclick="window.chooseSnowAction('BOMB')">
              <span style="font-size:20px;">💣</span>
              <span class="snow-action-title">Bomba Nieve</span>
              <span class="snow-action-desc">Revienta Escudo (2 dmg)</span>
            </button>
            <button class="snow-action-btn" id="btnActShield" onclick="window.chooseSnowAction('SHIELD')">
              <span style="font-size:20px;">🛡️</span>
              <span class="snow-action-title">Escudo / Refugio</span>
              <span class="snow-action-desc">Frena Tiro Rápido (0 dmg)</span>
            </button>
          </div>

          <div class="snow-status-msg" id="snowStatusMsg">
            ¡Ambos eligen a la vez en secreto! ¿Quién anticipará al rival? 🤫
          </div>

          <div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
            <button class="msn-game-launch-btn" style="padding:5px 12px;font-size:12px;" onclick="window.restartSnowBattleGame()">
              🔄 Reiniciar Batalla
            </button>
            ${typeof hubBackBtnHtml === 'function' ? hubBackBtnHtml() : ''}
          </div>
        </div>
      `;

      startRoundTimer();
    }

    if (modal) modal.style.display = 'flex';
  }

  function clearTimers() {
    if (roundTimer) { clearInterval(roundTimer); roundTimer = null; }
    if (animId) { cancelAnimationFrame(animId); animId = null; }
  }

  function startRoundTimer() {
    if (isGameOver) return;
    clearTimers();
    localChoice = null;
    remoteChoice = null;
    isResolving = false;
    roundTimeLeft = 5;

    enableActionButtons(true);
    hideAurasAndBalls();

    const tLabel = document.getElementById('snowTimerLabel');
    const rLabel = document.getElementById('snowRoundLabel');
    const sMsg = document.getElementById('snowStatusMsg');

    if (tLabel) tLabel.textContent = `⏳ Elige: 5.0s`;
    if (rLabel) rLabel.textContent = `Ronda ${currentRound}`;
    if (sMsg) sMsg.textContent = '¡Elige tu acción en secreto! 5 segundos en el reloj...';

    const startMs = Date.now();
    roundTimer = setInterval(() => {
      const elapsed = Date.now() - startMs;
      const remain = Math.max(0, 5000 - elapsed);
      roundTimeLeft = (remain / 1000).toFixed(1);

      if (tLabel) tLabel.textContent = `⏳ Elige: ${roundTimeLeft}s`;

      if (remain <= 0) {
        clearInterval(roundTimer);
        // Si no ha elegido, asignar una al azar
        if (!localChoice) {
          const acts = ['FAST', 'BOMB', 'SHIELD'];
          window.chooseSnowAction(acts[Math.floor(Math.random() * acts.length)]);
        }
        checkReadyToResolve();
      }
    }, 100);
  }

  function enableActionButtons(enable) {
    const btns = document.querySelectorAll('.snow-action-btn');
    btns.forEach(b => {
      b.disabled = !enable;
      if (enable) b.classList.remove('selected');
    });
  }

  function hideAurasAndBalls() {
    const sP = document.getElementById('snowShieldP');
    const sC = document.getElementById('snowShieldC');
    const bL = document.getElementById('snowBallLeft');
    const bR = document.getElementById('snowBallRight');
    if (sP) sP.style.display = 'none';
    if (sC) sC.style.display = 'none';
    if (bL) bL.style.display = 'none';
    if (bR) bR.style.display = 'none';
  }

  window.chooseSnowAction = function(action) {
    if (localChoice !== null || isResolving || isGameOver) return;

    localChoice = action;
    const btn = document.getElementById(action === 'FAST' ? 'btnActFast' : (action === 'BOMB' ? 'btnActBomb' : 'btnActShield'));
    if (btn) btn.classList.add('selected');
    enableActionButtons(false);

    if (typeof playRetroTone === 'function') playRetroTone(480, 'sine', 0.1);

    const sMsg = document.getElementById('snowStatusMsg');
    if (sMsg) {
      sMsg.innerHTML = `<span style="color:#0078d7;">✅ Has elegido <b>${ACTIONS[action].name}</b>. Esperando al rival...</span>`;
    }

    if (isLiveGame) {
      const conn = getConnection();
      if (conn) {
        try {
          conn.send({
            type: 'SNOW_ACTION',
            round: currentRound,
            action: action,
            role: isChimpiRole ? 'chimpi' : 'pinchi'
          });
        } catch (e) {}
      }
    } else {
      // Modo solitario: IA elige con psicología de predicción
      remoteChoice = getAIChoice();
    }

    checkReadyToResolve();
  };

  function getAIChoice() {
    // Si la IA tiene poca vida, suele protegerse o buscar tiro rápido
    if (hpChimpi <= 2) {
      const rand = Math.random();
      if (rand < 0.45) return 'SHIELD';
      if (rand < 0.8) return 'FAST';
      return 'BOMB';
    }
    // Distribución equilibrada
    const r = Math.random();
    if (r < 0.35) return 'FAST';
    if (r < 0.70) return 'BOMB';
    return 'SHIELD';
  }

  function checkReadyToResolve() {
    if (localChoice !== null && remoteChoice !== null && !isResolving) {
      clearInterval(roundTimer);
      resolveRound();
    }
  }

  function resolveRound() {
    isResolving = true;
    const actP = isChimpiRole ? remoteChoice : localChoice; // Acción de Pinchi 🐧
    const actC = isChimpiRole ? localChoice : remoteChoice; // Acción de Chimpi 🐷

    const sMsg = document.getElementById('snowStatusMsg');
    if (sMsg) {
      sMsg.innerHTML = `⚔️ <b>Pinchi:</b> ${ACTIONS[actP].name} vs <b>Chimpi:</b> ${ACTIONS[actC].name}`;
    }

    // Ejecutar animaciones simultáneas acordes al resultado
    executeCombatAnimations(actP, actC, () => {
      applyDamages(actP, actC);
      updateHeartsHUD();

      if (hpPinchi <= 0 || hpChimpi <= 0) {
        endGame();
      } else {
        currentRound++;
        setTimeout(startRoundTimer, 2800);
      }
    });
  }

  function executeCombatAnimations(actP, actC, onDone) {
    const ballL = document.getElementById('snowBallLeft');
    const ballR = document.getElementById('snowBallRight');
    const shieldP = document.getElementById('snowShieldP');
    const shieldC = document.getElementById('snowShieldC');
    const charP = document.getElementById('snowCharP');
    const charC = document.getElementById('snowCharC');

    if (actP === 'SHIELD' && shieldP) shieldP.style.display = 'block';
    if (actC === 'SHIELD' && shieldC) shieldC.style.display = 'block';

    playLaunchWhistle();

    // 1. FAST vs BOMB (El Tiro Rápido impacta de inmediato y cancela la Bomba)
    if (actP === 'FAST' && actC === 'BOMB') {
      // Pinchi lanza rápido a Chimpi
      animateStraight(ballL, 45, 290, 135, 300, () => {
        playImpactThud();
        shakeChar(charC);
        showRoundExplanation('⚡ ¡El Tiro Rápido de Pinchi impactó antes y canceló la Bomba de Chimpi! (-1 vida a Chimpi)');
        onDone();
      });
      return;
    }
    if (actC === 'FAST' && actP === 'BOMB') {
      // Chimpi lanza rápido a Pinchi
      animateStraight(ballR, 290, 45, 135, 300, () => {
        playImpactThud();
        shakeChar(charP);
        showRoundExplanation('⚡ ¡El Tiro Rápido de Chimpi impactó antes y canceló la Bomba de Pinchi! (-1 vida a Pinchi)');
        onDone();
      });
      return;
    }

    // 2. BOMB vs SHIELD (La Bomba vuela en arco por encima y revienta el Escudo)
    if (actP === 'BOMB' && actC === 'SHIELD') {
      animateParabolic(ballL, 45, 290, 135, 650, () => {
        playImpactThud();
        shakeChar(charC);
        if (shieldC) shieldC.style.display = 'none';
        showRoundExplanation('💣 ¡La Bomba de Pinchi cayó en parábola y reventó el Escudo de Chimpi! (-2 vidas a Chimpi)');
        onDone();
      });
      return;
    }
    if (actC === 'BOMB' && actP === 'SHIELD') {
      animateParabolic(ballR, 290, 45, 135, 650, () => {
        playImpactThud();
        shakeChar(charP);
        if (shieldP) shieldP.style.display = 'none';
        showRoundExplanation('💣 ¡La Bomba de Chimpi cayó en parábola y reventó el Escudo de Pinchi! (-2 vidas a Pinchi)');
        onDone();
      });
      return;
    }

    // 3. SHIELD vs FAST (El Escudo bloquea completamente el Tiro Rápido)
    if (actP === 'SHIELD' && actC === 'FAST') {
      animateStraight(ballR, 290, 65, 135, 320, () => {
        playShieldBlockSound();
        showRoundExplanation('🛡️ ¡El Escudo de Pinchi frenó en seco el Tiro Rápido de Chimpi! (0 daño)');
        onDone();
      });
      return;
    }
    if (actC === 'SHIELD' && actP === 'FAST') {
      animateStraight(ballL, 45, 270, 135, 320, () => {
        playShieldBlockSound();
        showRoundExplanation('🛡️ ¡El Escudo de Chimpi frenó en seco el Tiro Rápido de Pinchi! (0 daño)');
        onDone();
      });
      return;
    }

    // 4. MISMAS ACCIONES (EMPATES / CHOQUES)
    if (actP === 'FAST' && actC === 'FAST') {
      // Ambas bolas vuelan y colisionan en el medio
      animateClash(ballL, ballR, 45, 290, 135, 280, () => {
        playClashSound();
        showRoundExplanation('💥 ¡Choque de Tiros Rápidos en el aire! Ambas bolas se desintegran (0 daño).');
        onDone();
      });
      return;
    }

    if (actP === 'BOMB' && actC === 'BOMB') {
      // Ambas vuelan en parábola y caen
      animateDoubleParabolic(ballL, ballR, 600, () => {
        playImpactThud();
        shakeChar(charP);
        shakeChar(charC);
        showRoundExplanation('💣💣 ¡Ambas Bombas cruzaron el cielo e impactaron de lleno! (-2 vidas a ambos).');
        onDone();
      });
      return;
    }

    if (actP === 'SHIELD' && actC === 'SHIELD') {
      setTimeout(() => {
        if (typeof playRetroTone === 'function') playRetroTone(350, 'sine', 0.2);
        showRoundExplanation('🛡️🛡️ Ambos levantaron sus defensas al mismo tiempo. ¡Nadie recibe daño!');
        onDone();
      }, 700);
      return;
    }
  }

  function showRoundExplanation(text) {
    const sMsg = document.getElementById('snowStatusMsg');
    if (sMsg) sMsg.innerHTML = `<span style="color:#d35400;">${text}</span>`;
  }

  function applyDamages(actP, actC) {
    // 1. FAST vence a BOMB (1 daño)
    if (actP === 'FAST' && actC === 'BOMB') hpChimpi = Math.max(0, hpChimpi - 1);
    else if (actC === 'FAST' && actP === 'BOMB') hpPinchi = Math.max(0, hpPinchi - 1);

    // 2. BOMB vence a SHIELD (2 daños)
    else if (actP === 'BOMB' && actC === 'SHIELD') hpChimpi = Math.max(0, hpChimpi - 2);
    else if (actC === 'BOMB' && actP === 'SHIELD') hpPinchi = Math.max(0, hpPinchi - 2);

    // 3. SHIELD vence a FAST (0 daño)
    else if (actP === 'SHIELD' && actC === 'FAST') { /* 0 daño */ }
    else if (actC === 'SHIELD' && actP === 'FAST') { /* 0 daño */ }

    // 4. BOMB vs BOMB (2 daños a ambos)
    else if (actP === 'BOMB' && actC === 'BOMB') {
      hpPinchi = Math.max(0, hpPinchi - 2);
      hpChimpi = Math.max(0, hpChimpi - 2);
    }
  }

  function updateHeartsHUD() {
    const hP = document.getElementById('snowHpPinchi');
    const hC = document.getElementById('snowHpChimpi');
    if (hP) hP.textContent = '❤️'.repeat(hpPinchi) + '🤍'.repeat(Math.max(0, 5 - hpPinchi));
    if (hC) hC.textContent = '❤️'.repeat(hpChimpi) + '🤍'.repeat(Math.max(0, 5 - hpChimpi));
  }

  function shakeChar(charEl) {
    if (!charEl) return;
    charEl.style.transform = 'scale(0.85) rotate(-15deg)';
    if (navigator.vibrate) try { navigator.vibrate([100, 50, 100]); } catch (e) {}
    setTimeout(() => charEl.style.transform = 'none', 350);
  }

  function animateStraight(ball, x0, x1, y, duration, callback) {
    if (!ball) return callback();
    ball.style.display = 'block';
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      ball.style.left = `${x0 + (x1 - x0) * t}px`;
      ball.style.top = `${y}px`;
      if (t < 1) animId = requestAnimationFrame(step);
      else { ball.style.display = 'none'; callback(); }
    }
    animId = requestAnimationFrame(step);
  }

  function animateParabolic(ball, x0, x1, y, duration, callback) {
    if (!ball) return callback();
    ball.style.display = 'block';
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const curX = x0 + (x1 - x0) * t;
      const curY = y - 4 * 90 * t * (1 - t);
      ball.style.left = `${curX}px`;
      ball.style.top = `${curY}px`;
      if (t < 1) animId = requestAnimationFrame(step);
      else { ball.style.display = 'none'; callback(); }
    }
    animId = requestAnimationFrame(step);
  }

  function animateDoubleParabolic(bL, bR, duration, callback) {
    if (bL) bL.style.display = 'block';
    if (bR) bR.style.display = 'block';
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      if (bL) {
        bL.style.left = `${45 + (290 - 45) * t}px`;
        bL.style.top = `${135 - 4 * 90 * t * (1 - t)}px`;
      }
      if (bR) {
        bR.style.left = `${290 + (45 - 290) * t}px`;
        bR.style.top = `${135 - 4 * 90 * t * (1 - t)}px`;
      }
      if (t < 1) animId = requestAnimationFrame(step);
      else {
        if (bL) bL.style.display = 'none';
        if (bR) bR.style.display = 'none';
        callback();
      }
    }
    animId = requestAnimationFrame(step);
  }

  function animateClash(bL, bR, xL, xR, y, duration, callback) {
    if (bL) bL.style.display = 'block';
    if (bR) bR.style.display = 'block';
    const start = performance.now();
    const midX = (xL + xR) / 2;
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      if (bL) {
        bL.style.left = `${xL + (midX - xL) * t}px`;
        bL.style.top = `${y}px`;
      }
      if (bR) {
        bR.style.left = `${xR + (midX - xR) * t}px`;
        bR.style.top = `${y}px`;
      }
      if (t < 1) animId = requestAnimationFrame(step);
      else {
        if (bL) bL.style.display = 'none';
        if (bR) bR.style.display = 'none';
        callback();
      }
    }
    animId = requestAnimationFrame(step);
  }

  function playLaunchWhistle() {
    try {
      const ctx = window.retroAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(850, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {}
  }

  function playImpactThud() {
    try {
      const ctx = window.retroAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.22, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.22);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.28, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch (e) {}
  }

  function playShieldBlockSound() {
    if (typeof playRetroTone === 'function') playRetroTone(420, 'square', 0.15);
    if (navigator.vibrate) try { navigator.vibrate(50); } catch (e) {}
  }

  function playClashSound() {
    if (typeof playRetroTone === 'function') playRetroTone(600, 'triangle', 0.1);
  }

  function endGame() {
    isGameOver = true;
    clearTimers();

    const sMsg = document.getElementById('snowStatusMsg');
    const isPinchiAlive = hpPinchi > 0;
    const isChimpiAlive = hpChimpi > 0;

    let champText = '';
    if (isPinchiAlive && !isChimpiAlive) {
      champText = '🏆 ¡PINCHI 🐧 GANA LA GUERRA DE NIEVE!';
    } else if (!isPinchiAlive && isChimpiAlive) {
      champText = '🏆 ¡CHIMPI 🐷 CONQUISTA EL IGLÚ!';
    } else {
      champText = '🤝 ¡EMPATE ÉPICO! Ambos cayeron en la ventisca de nieve.';
    }

    if (sMsg) {
      sMsg.innerHTML = `<span style="color:#28a745;font-size:14px;">${champText}</span>`;
    }

    const isMeWinner = (isPinchiAlive && !isChimpiRole) || (isChimpiAlive && isChimpiRole);
    if (isMeWinner) {
      if (typeof dispararConfetiCanvas === 'function') dispararConfetiCanvas();
      if (typeof playRetroTone === 'function') playRetroTone(523.25, 'triangle', 0.4);
    }
  }

  window.restartSnowBattleGame = function() {
    openSnowBattleGame(!isLiveGame);
  };

  // Manejador remoto WebRTC
  window._handleRemoteSnowAction = function(data) {
    if (!data || isGameOver) return;
    remoteChoice = data.action;
    checkReadyToResolve();
  };

  window.openSnowBattleGame = openSnowBattleGame;
})();
