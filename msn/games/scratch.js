// ==========================================
// MSN GAMES - RASCA Y GANA
// ==========================================

function openScratchGame() {
  closeGameModal();
  gameTitle.textContent = '✨ MSN Games - Rasca y Gana de Cumpleaños';

  gameContent.innerHTML = `
    <div style="font-weight:bold;font-size:15px;color:#111;">¡Pasa tu dedo por la pantalla para rascar tu tarjeta!</div>
    <div style="position:relative;width:290px;height:290px;margin:8px auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.25);">
      <div id="scratchSecret" style="position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(135deg,#ffe6f0,#e8f4fc);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;text-align:center;">
        <img src="./resources/chimpi_1.png" style="width:75px;height:75px;border-radius:50%;border:3px solid #ff69b4;object-fit:cover;box-shadow:0 2px 6px rgba(0,0,0,0.2);" />
        <div style="font-weight:bold;color:#ff1493;font-size:17px;margin-top:8px;">¡Feliz Cumpleaños Pinchi! 💖🎂</div>
        <div style="font-size:13px;color:#333;margin-top:6px;line-height:1.35;">
          Gracias por cada momento, cada risa y cada aventura juntos.<br><b>¡Eres lo más bonito de mi vida!</b> 🐧🐷✨
        </div>
      </div>
      <canvas id="scratchCanvas" width="290" height="290" style="position:absolute;top:0;left:0;width:100%;height:100%;cursor:pointer;touch-action:none;"></canvas>
    </div>
    <div id="scStatus" style="font-size:13px;color:#555;">Rascado: <span id="scPercent">0</span>%</div>
    ${hubBackBtnHtml()}
  `;

  gameModal.style.display = 'flex';

  const canvas = document.getElementById('scratchCanvas');
  const ctx = canvas.getContext('2d');
  const percentElem = document.getElementById('scPercent');
  const statusElem = document.getElementById('scStatus');

  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, '#c0d6ea');
  grad.addColorStop(0.5, '#e4effa');
  grad.addColorStop(1, '#a6cbe7');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#004a9f';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('❄️ RASCA AQUÍ CON TU DEDO ❄️', canvas.width / 2, 130);
  ctx.font = '14px sans-serif';
  ctx.fillText('🎁 ¡Hay una sorpresa dentro! 🎁', canvas.width / 2, 160);

  let isDrawing = false;
  let scratchedPixels = 0;
  let cleared = false;

  function scratch(x, y) {
    if (cleared) return;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.fill();

    playRetroTone(300 + Math.random() * 200, 'triangle', 0.04);
    if (navigator.vibrate && Math.random() < 0.25) {
      try { navigator.vibrate(15); } catch (e) {}
    }

    scratchedPixels += 80;
    const totalPixelsEstimate = 290 * 290 * 0.45;
    const pct = Math.min(100, Math.floor((scratchedPixels / totalPixelsEstimate) * 100));
    percentElem.textContent = pct;

    if (pct >= 55 && !cleared) {
      cleared = true;
      canvas.style.transition = 'opacity 0.6s ease-out';
      canvas.style.opacity = '0';
      setTimeout(() => { canvas.style.display = 'none'; }, 600);
      statusElem.innerHTML = '<b style="color:#ff1493;font-size:16px;">¡SORPRESA DESVELADA! 🎉💖</b>';
      if (navigator.vibrate) try { navigator.vibrate([100, 50, 100, 50, 250]); } catch (e) {}
      if (typeof lanzarConfetiVariasVeces === 'function') lanzarConfetiVariasVeces();
    }
  }

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left,
      y: (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top
    };
  }

  canvas.addEventListener('pointerdown', (e) => {
    isDrawing = true;
    const pos = getPos(e);
    scratch(pos.x, pos.y);
  });
  window.addEventListener('pointerup', () => { isDrawing = false; });
  canvas.addEventListener('pointermove', (e) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    scratch(pos.x, pos.y);
  });
}
window.openScratchGame = openScratchGame;
