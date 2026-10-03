// ==========================================
// MSN GAMES - AHORCADO ROMÁNTICO / SALVA LA TARTA
// ==========================================

function openHangmanGame() {
  closeGameModal();
  gameTitle.textContent = '🔤 MSN Games - Ahorcado de Pareja';

  const phrases = [
    'TE QUIERO UN MONTON',
    'PINCHI Y CHIMPI PARA SIEMPRE',
    'FELIZ CUMPLEANOS MI VIDA',
    'COMPANERA DE AVENTURAS FAVORITA'
  ];

  const targetPhrase = phrases[Math.floor(Math.random() * phrases.length)];
  let guessedLetters = new Set([' ']);
  let mistakes = 0;
  const maxMistakes = 6;

  gameContent.innerHTML = `
    <div style="font-weight:bold;font-size:15px;color:#111;">¡Adivina la frase antes de que Chimpi coma la tarta! 🎂🐷</div>
    <div id="hmPigStatus" style="font-size:24px;margin:8px 0;letter-spacing:6px;">
      🐷 ▫️ ▫️ ▫️ ▫️ ▫️ 🎂
    </div>
    <div id="hmWord" style="font-size:20px;font-weight:bold;letter-spacing:4px;color:#0078d7;margin:8px 0;word-break:break-word;"></div>
    <div id="hmKeyboard" style="display:grid;grid-template-columns:repeat(7, 1fr);gap:4px;max-width:320px;margin:8px auto;"></div>
    <div id="hmStatus" style="font-size:13px;color:#555;min-height:22px;">Toca las letras para resolver la frase</div>
    ${hubBackBtnHtml()}
  `;

  gameModal.style.display = 'flex';

  const wordElem = document.getElementById('hmWord');
  const kbElem = document.getElementById('hmKeyboard');
  const statusElem = document.getElementById('hmStatus');
  const pigStatusElem = document.getElementById('hmPigStatus');

  function updateDisplay() {
    let displayStr = '';
    let won = true;

    for (let char of targetPhrase) {
      if (char === ' ') {
        displayStr += '   ';
      } else if (guessedLetters.has(char)) {
        displayStr += char + ' ';
      } else {
        displayStr += '_ ';
        won = false;
      }
    }

    wordElem.textContent = displayStr;

    // Visualizar avance de Chimpi hacia la tarta
    let dots = '';
    for (let d = 0; d < mistakes; d++) dots += '▪️ ';
    dots += '🐷 ';
    for (let d = mistakes; d < maxMistakes; d++) dots += '▫️ ';
    dots += '🎂';
    pigStatusElem.textContent = dots;

    if (won) {
      statusElem.innerHTML = '<b style="color:#2e8b57;font-size:16px;">¡FRASE ACERTADA! 🎉💖 ¡Salvaste la tarta!</b>';
      if (navigator.vibrate) try { navigator.vibrate([100, 50, 100, 50, 200]); } catch (e) {}
      if (typeof lanzarConfetiVariasVeces === 'function') lanzarConfetiVariasVeces();
      kbElem.style.pointerEvents = 'none';
    } else if (mistakes >= maxMistakes) {
      wordElem.textContent = targetPhrase;
      statusElem.innerHTML = '<span style="color:#e81123;">¡Chimpi se comió la tarta! 🐷🎂 <button class="msn-game-launch-btn" style="padding:4px 10px;font-size:12px;" onclick="openHangmanGame()">Reintentar 🔄</button></span>';
      kbElem.style.pointerEvents = 'none';
    }
  }

  // Generar teclado
  const alphabet = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
  for (let letter of alphabet) {
    const btn = document.createElement('button');
    btn.textContent = letter;
    btn.style.padding = '6px 0';
    btn.style.fontSize = '14px';
    btn.style.fontWeight = 'bold';
    btn.style.borderRadius = '4px';
    btn.style.border = '1px solid #ccc';
    btn.style.background = '#ffffff';
    btn.style.cursor = 'pointer';

    btn.addEventListener('click', () => {
      btn.disabled = true;
      btn.style.opacity = '0.4';
      guessedLetters.add(letter);

      if (targetPhrase.includes(letter)) {
        playRetroTone(550, 'triangle', 0.1);
        btn.style.background = '#d4edda';
      } else {
        mistakes++;
        playRetroTone(200, 'sawtooth', 0.15);
        btn.style.background = '#f8d7da';
        if (navigator.vibrate) try { navigator.vibrate(40); } catch (e) {}
      }

      updateDisplay();
    });

    kbElem.appendChild(btn);
  }

  updateDisplay();
}
window.openHangmanGame = openHangmanGame;
