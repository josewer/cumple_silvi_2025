// ==========================================
// MSN GAMES - GUERRA DE PINGÜINOS
// ==========================================

function openPenguinGame() {
  closeGameModal();
  gameTitle.textContent = '🐧 MSN Games - Guerra de Pingüinos';

  let score = 0;
  const targetScore = 8;
  let timeLeft = 25;

  gameContent.innerHTML = `
    <div style="font-weight:bold;font-size:15px;color:#111;">¡Toca a los pingüinos antes de que se escondan!</div>
    <div style="display:flex;gap:20px;font-size:16px;font-weight:bold;margin:4px 0;">
      <div style="color:#0078d7;">Puntos: <span id="pgScore">0</span>/${targetScore}</div>
      <div style="color:#e81123;">Tiempo: <span id="pgTimer">${timeLeft}</span>s</div>
    </div>
    <div class="penguin-grid" id="penguinGrid">
      <div class="penguin-hole" data-idx="0"><div class="target">🐧</div></div>
      <div class="penguin-hole" data-idx="1"><div class="target">🐧</div></div>
      <div class="penguin-hole" data-idx="2"><div class="target">🐧</div></div>
      <div class="penguin-hole" data-idx="3"><div class="target">🐧</div></div>
      <div class="penguin-hole" data-idx="4"><div class="target">🐧</div></div>
      <div class="penguin-hole" data-idx="5"><div class="target">🐧</div></div>
    </div>
    <div id="pgStatus" style="font-size:13px;color:#555;">¡Toca rápido para acertarles con una bola de nieve! ❄️</div>
    ${hubBackBtnHtml()}
  `;

  gameModal.style.display = 'flex';

  const holes = gameContent.querySelectorAll('.penguin-hole');
  const scoreElem = document.getElementById('pgScore');
  const timerElem = document.getElementById('pgTimer');
  const statusElem = document.getElementById('pgStatus');

  function popPenguin() {
    holes.forEach(h => h.classList.remove('active', 'hit'));
    const nextHole = Math.floor(Math.random() * holes.length);
    holes[nextHole].classList.add('active');
  }

  holes.forEach((hole) => {
    const hitHandler = (e) => {
      e.preventDefault();
      if (hole.classList.contains('active') && !hole.classList.contains('hit')) {
        hole.classList.add('hit');
        score++;
        scoreElem.textContent = score;
        playRetroTone(520, 'triangle', 0.1);
        if (navigator.vibrate) try { navigator.vibrate(50); } catch (err) {}
        statusElem.textContent = '¡Pum! Bola de nieve directa ❄️🎯';

        if (score >= targetScore) {
          clearInterval(window._gameInterval);
          clearInterval(window._spawnTimer);
          statusElem.innerHTML = '<b style="color:#2e8b57;font-size:16px;">¡VICTORIA! 🎉 ¡Has ganado la Guerra de Pingüinos!</b>';
          if (navigator.vibrate) try { navigator.vibrate([100, 50, 100, 50, 200]); } catch (err) {}
          if (typeof lanzarConfetiVariasVeces === 'function') lanzarConfetiVariasVeces();

          setTimeout(() => {
            closeGameModal();
            if (typeof pruebaActual !== 'undefined' && pruebaActual === 3) {
              lastMessagePinchi = "gane";
              if (typeof prueba_3 === 'function') prueba_3();
            }
          }, 1400);
        }
      }
    };
    hole.addEventListener('pointerdown', hitHandler);
  });

  popPenguin();
  window._spawnTimer = setInterval(popPenguin, 1000);

  window._gameInterval = setInterval(() => {
    timeLeft--;
    if (timerElem) timerElem.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(window._gameInterval);
      clearInterval(window._spawnTimer);
      holes.forEach(h => h.classList.remove('active'));
      statusElem.innerHTML = '<span style="color:#e81123;">¡Se acabó el tiempo! <button class="msn-game-launch-btn" style="padding:4px 10px;font-size:12px;" onclick="openPenguinGame()">Reintentar 🔄</button></span>';
    }
  }, 1000);
}
window.openPenguinGame = openPenguinGame;
