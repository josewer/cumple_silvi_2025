// ==========================================
// MSN GAMES - SIMÓN DICE MSN
// ==========================================

function openSimonGame() {
  closeGameModal();
  gameTitle.textContent = '🎶 MSN Games - Simón Dice MSN';

  gameContent.innerHTML = `
    <div style="font-weight:bold;font-size:15px;color:#111;">¡Repite la secuencia de luces y sonidos de Chimpi!</div>
    <div style="font-size:14px;color:#0078d7;font-weight:bold;margin:4px 0;">Ronda: <span id="simonRound">1</span>/5 🏆</div>
    <div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:12px;width:240px;height:240px;margin:10px auto;">
      <div class="simon-btn" id="sbtn0" style="background:#2ecc71;border-radius:14px 4px 4px 4px;border:3px solid #27ae60;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:32px;">🔊</div>
      <div class="simon-btn" id="sbtn1" style="background:#e74c3c;border-radius:4px 14px 4px 4px;border:3px solid #c0392b;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:32px;">🎸</div>
      <div class="simon-btn" id="sbtn2" style="background:#f1c40f;border-radius:4px 4px 4px 14px;border:3px solid #d4ac0d;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:32px;">🐷</div>
      <div class="simon-btn" id="sbtn3" style="background:#3498db;border-radius:4px 4px 14px 4px;border:3px solid #2980b9;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:32px;">🔔</div>
    </div>
    <div id="simonStatus" style="font-size:13px;color:#555;min-height:22px;">¡Observa la secuencia de Chimpi!</div>
    ${hubBackBtnHtml()}
  `;

  gameModal.style.display = 'flex';

  const roundElem = document.getElementById('simonRound');
  const statusElem = document.getElementById('simonStatus');
  const buttons = [
    document.getElementById('sbtn0'),
    document.getElementById('sbtn1'),
    document.getElementById('sbtn2'),
    document.getElementById('sbtn3')
  ];

  const frequencies = [261.6, 329.6, 392.0, 523.3]; // C, E, G, High C
  let sequence = [];
  let userStep = 0;
  let canInput = false;

  function flashButton(idx, duration = 350) {
    playRetroTone(frequencies[idx], 'triangle', 0.25);
    buttons[idx].style.filter = 'brightness(1.9) scale(0.96)';
    buttons[idx].style.boxShadow = '0 0 15px white';
    setTimeout(() => {
      buttons[idx].style.filter = '';
      buttons[idx].style.boxShadow = '';
    }, duration);
  }

  function playSequence() {
    canInput = false;
    userStep = 0;
    statusElem.textContent = 'Chimpi tocando... 💭🐷';

    sequence.forEach((val, i) => {
      setTimeout(() => {
        flashButton(val);
      }, (i + 1) * 650);
    });

    setTimeout(() => {
      canInput = true;
      statusElem.textContent = '¡Ahora te toca a ti, Pinchi! 🐧';
    }, (sequence.length + 1) * 650);
  }

  function nextRound() {
    if (sequence.length >= 5) {
      statusElem.innerHTML = '<b style="color:#2e8b57;font-size:16px;">¡VICTORIA! 🎉 ¡Oído musical perfecto! 🎶</b>';
      if (navigator.vibrate) try { navigator.vibrate([100, 50, 100, 50, 200]); } catch (e) {}
      if (typeof lanzarConfetiVariasVeces === 'function') lanzarConfetiVariasVeces();
      return;
    }

    sequence.push(Math.floor(Math.random() * 4));
    roundElem.textContent = sequence.length;
    setTimeout(playSequence, 500);
  }

  buttons.forEach((btn, idx) => {
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (!canInput) return;

      flashButton(idx, 200);
      if (navigator.vibrate) try { navigator.vibrate(25); } catch (e) {}

      if (idx === sequence[userStep]) {
        userStep++;
        if (userStep === sequence.length) {
          canInput = false;
          statusElem.textContent = '¡Muy bien! Siguiente ronda... ✨';
          setTimeout(nextRound, 800);
        }
      } else {
        canInput = false;
        playRetroTone(160, 'sawtooth', 0.4);
        statusElem.innerHTML = '<span style="color:#e81123;">¡Uy, te equivocaste! <button class="msn-game-launch-btn" style="padding:4px 10px;font-size:12px;" onclick="openSimonGame()">Reintentar 🔄</button></span>';
      }
    });
  });

  nextRound();
}
window.openSimonGame = openSimonGame;
