// ==========================================
// MSN GAMES - TEST DE PAREJA CÓMICO
// ==========================================

function openCoupleQuizGame() {
  closeGameModal();

  var modal = window.gameModal || document.getElementById('gameModal');
  var title = window.gameTitle || document.getElementById('gameTitle');
  var content = window.gameContent || document.getElementById('gameContent');

  if (title) title.textContent = '💑 MSN Games - Test de Pareja Cómico';

  const questions = [
    {
      q: '1. ¿Quién se pone más de mal humor cuando tiene hambre? 🍔',
      options: ['Pinchi la pingüina', 'Chimpi el cerdito', '¡Los dos por igual!'],
      correctMsg: '¡Exacto! El hambre no perdona a nadie en esta casa 🤭'
    },
    {
      q: '2. ¿Quién tarda más tiempo en decidir qué cenar? 🍕',
      options: ['Pinchi', 'Chimpi', 'Acabamos pidiendo lo de siempre'],
      correctMsg: '¡Totalmente cierto! Media hora mirando cartas para acabar pidiendo lo mismo 🤣'
    },
    {
      q: '3. ¿Quién es el más cariñoso y pegajoso de los dos? 💖',
      options: ['Chimpi el cerdito', 'Pinchi la pingüina', 'Empate técnico de amor'],
      correctMsg: '¡Empate total! No podéis estar separados ni 5 minutos 🥰'
    },
    {
      q: '4. ¿Cuál es el superpoder secreto de Pinchi? ✨',
      options: ['Su sonrisa preciosa', 'Aguantar a Chimpi cada día', 'Ser la más lista', '¡Todas las anteriores!'],
      correctMsg: '¡Sin duda! ¡Todas las anteriores juntas! 👑💖'
    },
    {
      q: '5. ¿Cuánto te quiere Chimpi? 🐷❤️',
      options: ['Mucho', 'Muchísimo', '¡Hasta el infinito y más allá!'],
      correctMsg: '¡Hasta el infinito y más allá, mi vida! ¡Feliz cumpleaños! 🎉✨'
    }
  ];

  let currentQ = 0;

  function renderQuestion() {
    if (!content) return;
    const item = questions[currentQ];

    content.innerHTML = `
      <div style="font-size:13px;color:#0078d7;font-weight:bold;">Pregunta ${currentQ + 1} de ${questions.length}</div>
      <div style="font-weight:bold;font-size:16px;color:#111;margin:8px 0;line-height:1.3;">${item.q}</div>
      <div style="display:flex;flex-direction:column;gap:8px;width:100%;max-width:320px;margin:10px auto;" id="quizOptionsContainer">
        ${item.options.map((opt, i) => `
          <button class="msn-quiz-option-btn" data-idx="${i}">${opt}</button>
        `).join('')}
      </div>
      <div id="quizFeedback" style="font-size:13px;color:#2e8b57;font-weight:bold;min-height:28px;"></div>
      ${hubBackBtnHtml()}
    `;

    const buttons = content.querySelectorAll('.msn-quiz-option-btn');
    buttons.forEach((btn, idx) => {
      btn.addEventListener('click', () => selectQuizAnswer(idx));
    });
  }

  function selectQuizAnswer(optionIndex) {
    const item = questions[currentQ];
    const fb = document.getElementById('quizFeedback');
    if (fb) fb.textContent = item.correctMsg;

    playRetroTone(580, 'sine', 0.12);
    if (navigator.vibrate) try { navigator.vibrate(40); } catch (e) {}

    const buttons = content.querySelectorAll('.msn-quiz-option-btn');
    buttons.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === optionIndex) {
        btn.style.background = '#d4edda';
        btn.style.borderColor = '#28a745';
        btn.style.color = '#155724';
      }
    });

    setTimeout(() => {
      currentQ++;
      if (currentQ < questions.length) {
        renderQuestion();
      } else {
        content.innerHTML = `
          <div style="font-size:42px;margin:8px 0;">🏆💖🐷🐧</div>
          <div style="font-weight:bold;font-size:18px;color:#2e8b57;">¡TEST SUPERADO CON 1000% DE AMOR!</div>
          <div style="font-size:14px;color:#333;margin:10px 0;line-height:1.4;">
            ¡Veredicto oficial: Sois la mejor pareja del mundo!<br>
            <b>¡Chimpi te desea el cumpleaños más feliz de tu vida!</b> 🎂✨
          </div>
          ${hubBackBtnHtml()}
        `;
        if (navigator.vibrate) try { navigator.vibrate([100, 50, 100, 50, 200]); } catch (e) {}
        if (typeof lanzarConfetiVariasVeces === 'function') lanzarConfetiVariasVeces();
      }
    }, 1300);
  }

  window.selectQuizAnswer = selectQuizAnswer;

  if (modal) modal.style.display = 'flex';
  renderQuestion();
}

window.openCoupleQuizGame = openCoupleQuizGame;
