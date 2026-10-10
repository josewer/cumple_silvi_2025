// =============================================================================
// MSN MESSENGER - MODO REAL P2P (PINCHI & CHIMPI EN DIRECTO VIA WEBRTC / PEERJS)
// =============================================================================

(function () {
  // ID fija de la sala para Pinchi
  const PINCHI_PEER_ID = 'pinchi-silvi-cumple-2025-msn';

  // Detectar si estamos en modo Chimpi (a través de URL ?rol=chimpi o localStorage)
  const urlParams = new URLSearchParams(window.location.search);
  const isChimpiMode = urlParams.get('rol') === 'chimpi' || urlParams.get('chimpi') === '1';

  let peer = null;
  let activeConn = null;
  let connectInterval = null;
  let heartbeatInterval = null;

  window._liveConnection = null;
  window.liveChimpi = {
    get conn() { return (activeConn && activeConn.open) ? activeConn : (window._liveConnection && window._liveConnection.open ? window._liveConnection : null); }
  };
  window._isChimpiMode = isChimpiMode;
  window._botSilenced = true; // Por defecto cuando está en vivo, el bot nosti está silenciado

  // Esperar a que PeerJS esté disponible en el navegador
  function ensurePeerLoaded(callback) {
    if (typeof Peer !== 'undefined') {
      callback();
    } else {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (typeof Peer !== 'undefined') {
          clearInterval(interval);
          callback();
        } else if (attempts > 60) {
          clearInterval(interval);
          console.warn('PeerJS no disponible tras 15 segundos.');
        }
      }, 250);
    }
  }

  // Crear o actualizar la barra de estado en directo en la parte superior
  function updateLiveUI(status, isConnected) {
    let banner = document.getElementById('liveStatusBanner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'liveStatusBanner';
      banner.style.cssText = `
        padding: 8px 12px;
        font-size: 12px;
        font-weight: bold;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        gap: 8px;
        z-index: 9999;
        transition: background 0.3s;
        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      `;
      // Selector corregido: soporta #chatWindow y .window
      const chatWindow = document.getElementById('chatWindow') || document.querySelector('.window') || document.body;
      if (chatWindow) {
        chatWindow.insertBefore(banner, chatWindow.firstChild);
      }
    }

    if (isChimpiMode) {
      // --- VISTA DE CHIMPI ---
      if (isConnected) {
        banner.style.background = '#28a745';
        banner.style.color = '#ffffff';
        banner.innerHTML = `
          <span>🟢 <b>EN VIVO CON PINCHI:</b> Eres Chimpi (🐷). El bot está silenciado.</span>
          <div style="margin-left:auto;display:flex;align-items:center;">
            <button id="toggleBotBtn" style="background:#fff;border:none;border-radius:4px;padding:4px 8px;font-size:11px;font-weight:bold;cursor:pointer;color:#333;">
              ${window._botSilenced ? '🤖 Bot: 🔇 Silenciado' : '🤖 Bot: 🔊 Activo'}
            </button>
          </div>
        `;

        const botBtn = document.getElementById('toggleBotBtn');
        if (botBtn) {
          botBtn.onclick = () => {
            window._botSilenced = !window._botSilenced;
            if (activeConn && activeConn.open) {
              activeConn.send({ type: 'set_bot', silenced: window._botSilenced });
            }
            updateLiveUI('connected', true);
          };
        }
      } else {
        banner.style.background = '#ffc107';
        banner.style.color = '#212529';
        banner.innerHTML = `
          <span>⏳ <b>MODO CHIMPI:</b> Conectando con Pinchi... (Asegúrate de que tenga la web abierta en su móvil)</span>
          <button id="reconnectChimpiBtn" style="background:#212529;color:#fff;border:none;border-radius:4px;padding:3px 8px;font-size:11px;cursor:pointer;margin-left:6px;">
            🔄 Forzar Reconexión
          </button>
        `;
        const reconBtn = document.getElementById('reconnectChimpiBtn');
        if (reconBtn) {
          reconBtn.onclick = () => {
            initP2P();
          };
        }
      }
    } else {
      // --- VISTA DE PINCHI ---
      if (isConnected) {
        banner.style.display = 'flex';
        banner.style.background = '#e7f5ff';
        banner.style.color = '#0078d7';
        banner.style.borderBottom = '1.5px solid #70a1ff';
        banner.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:2px 0;">
            <span>✨ <b>¡Chimpi está en directo contigo! 🐷💖</b></span>
          </div>
        `;

        const mobileStatus = document.querySelector('.mobile-contact-status');
        if (mobileStatus) {
          mobileStatus.innerHTML = `🟢 <b>En directo contigo ahora mismo</b>`;
        }
      } else {
        banner.style.display = 'none';
        const mobileStatus = document.querySelector('.mobile-contact-status');
        if (mobileStatus) {
          mobileStatus.innerHTML = `🎵 Escuchando: Avril Lavigne - Complicated`;
        }
      }
    }
  }

  const PEER_CONFIG = {
    debug: 1,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
        { urls: 'stun:stun.relay.metered.ca:80' },
        {
          urls: 'turn:standard.relay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:standard.relay.metered.ca:443',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:standard.relay.metered.ca:443?transport=tcp',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ]
    }
  };

  // Inicialización de la red P2P
  function initP2P() {
    ensurePeerLoaded(() => {
      try {
        if (isChimpiMode) {
          setupChimpiMode();
        } else {
          setupPinchiMode();
        }
      } catch (err) {
        console.warn('Nota P2P:', err);
      }
    });
  }

  // Liberar ID inmediatamente si se cierra o recarga la pestaña
  window.addEventListener('beforeunload', () => {
    if (peer && !peer.destroyed) {
      try { peer.destroy(); } catch (e) {}
    }
  });

  let pinchiRetryTimeout = null;

  // --- MODO PINCHI (ESCUCHA CONEXIÓN) ---
  function setupPinchiMode() {
    clearTimeout(pinchiRetryTimeout);

    if (peer && !peer.destroyed) {
      try { peer.destroy(); } catch (e) {}
    }

    try {
      peer = new Peer(PINCHI_PEER_ID, PEER_CONFIG);
    } catch (e) {
      console.warn('Pinchi: Error al instanciar Peer:', e);
      pinchiRetryTimeout = setTimeout(setupPinchiMode, 3000);
      return;
    }

    peer.on('open', (id) => {
      console.log('Pinchi lista para recibir a Chimpi. ID:', id);
    });

    peer.on('connection', (conn) => {
      console.log('Pinchi: Conexión entrante de Chimpi detectada...');
      setupConnectionDataHandlers(conn);

      const markReady = () => {
        console.log('Pinchi: ¡Canal P2P abierto y listo con Chimpi!');
        if (activeConn && activeConn !== conn) {
          try { activeConn.close(); } catch (e) {}
        }
        activeConn = conn;
        window._liveConnection = conn;
        updateLiveUI('connected', true);
      };

      if (conn.open) {
        markReady();
      } else {
        conn.on('open', markReady);
      }

      conn.on('close', () => {
        console.log('Pinchi: Conexión con Chimpi cerrada.');
        if (activeConn === conn) {
          activeConn = null;
          window._liveConnection = null;
          updateLiveUI('disconnected', false);
        }
      });

      conn.on('error', (err) => {
        console.warn('Pinchi: Error en conexión:', err);
      });
    });

    peer.on('error', (err) => {
      console.warn('Pinchi Peer error:', err.type, err);
      if (err.type === 'unavailable-id') {
        console.log('ID temporalmente retenida en servidor. Reintentando en 3s...');
        clearTimeout(pinchiRetryTimeout);
        pinchiRetryTimeout = setTimeout(() => {
          if (!activeConn || !activeConn.open) {
            setupPinchiMode();
          }
        }, 3000);
      } else if (err.type === 'disconnected' || err.type === 'network') {
        if (peer && !peer.destroyed) {
          try { peer.reconnect(); } catch (e) {}
        }
      }
    });

    peer.on('disconnected', () => {
      console.log('Pinchi Peer desconectado del servidor. Intentando reconectar...');
      if (peer && !peer.destroyed) {
        try { peer.reconnect(); } catch (e) {}
      } else {
        setupPinchiMode();
      }
    });
  }

  // --- MODO CHIMPI (CONECTA A PINCHI) ---
  let pendingConn = null;
  let isConnecting = false;
  let chimpiReconnectTimeout = null;

  function setupChimpiMode() {
    updateLiveUI('waiting', false);
    adaptUIToChimpi();

    if (pendingConn && !pendingConn.open) {
      try { pendingConn.close(); } catch (e) {}
      pendingConn = null;
    }

    if (peer && !peer.destroyed) {
      try { peer.destroy(); } catch (e) {}
    }

    try {
      peer = new Peer(PEER_CONFIG);
    } catch (e) {
      console.warn('Chimpi: Error al instanciar Peer:', e);
      clearTimeout(chimpiReconnectTimeout);
      chimpiReconnectTimeout = setTimeout(setupChimpiMode, 3000);
      return;
    }

    peer.on('open', (id) => {
      console.log('Chimpi Peer abierto. ID propia:', id);
      connectToPinchi();
    });

    peer.on('error', (err) => {
      console.warn('Chimpi Peer error:', err.type, err);
      isConnecting = false;
      if (err.type === 'peer-unavailable') {
        updateLiveUI('waiting', false);
      } else if (err.type === 'network' || err.type === 'disconnected') {
        if (peer && !peer.destroyed) {
          try { peer.reconnect(); } catch (e) {}
        }
      }
    });

    peer.on('disconnected', () => {
      if (peer && !peer.destroyed) {
        try { peer.reconnect(); } catch (e) {}
      }
    });

    function connectToPinchi() {
      if (activeConn && activeConn.open) return;
      if (isConnecting) return;
      if (!peer || peer.destroyed) {
        setupChimpiMode();
        return;
      }
      if (peer.disconnected) {
        try { peer.reconnect(); } catch (e) {}
        return;
      }
      if (!peer.open) return;

      // Descartar conexión pendiente anterior si no llegó a abrirse
      if (pendingConn && !pendingConn.open) {
        try { pendingConn.close(); } catch (e) {}
        pendingConn = null;
      }

      isConnecting = true;
      const connectTimeout = setTimeout(() => {
        isConnecting = false;
        if (pendingConn && !pendingConn.open) {
          try { pendingConn.close(); } catch (e) {}
          pendingConn = null;
        }
      }, 5000);

      console.log('Chimpi intentando conectar a Pinchi...');
      try {
        const conn = peer.connect(PINCHI_PEER_ID, {
          reliable: true
        });
        pendingConn = conn;

        setupConnectionDataHandlers(conn);

        conn.on('open', () => {
          clearTimeout(connectTimeout);
          isConnecting = false;
          pendingConn = null;
          console.log('¡Chimpi conectado con éxito a Pinchi!');
          activeConn = conn;
          window._liveConnection = conn;
          updateLiveUI('connected', true);
        });

        conn.on('close', () => {
          clearTimeout(connectTimeout);
          isConnecting = false;
          if (pendingConn === conn) pendingConn = null;
          console.log('Conexión con Pinchi cerrada.');
          if (activeConn === conn) {
            activeConn = null;
            window._liveConnection = null;
            updateLiveUI('disconnected', false);
          }
        });

        conn.on('error', (err) => {
          clearTimeout(connectTimeout);
          isConnecting = false;
          if (pendingConn === conn) pendingConn = null;
          console.warn('Error en conexión con Pinchi:', err);
        });
      } catch (e) {
        clearTimeout(connectTimeout);
        isConnecting = false;
        pendingConn = null;
        console.warn('Excepción al conectar con Pinchi:', e);
      }
    }

    if (connectInterval) clearInterval(connectInterval);
    connectInterval = setInterval(() => {
      if (!activeConn || !activeConn.open) {
        connectToPinchi();
      }
    }, 3500);
  }

  function adaptUIToChimpi() {
    document.title = 'MSN Messenger - [MODO CHIMPI EN VIVO 🐷]';

    const mobileName = document.querySelector('.mobile-contact-name');
    if (mobileName) {
      mobileName.innerHTML = `Pinchi 🐧 <span class="status-badge">(En línea)</span>`;
    }
    const mobileStatus = document.querySelector('.mobile-contact-status');
    if (mobileStatus) {
      mobileStatus.textContent = `💖 Cumpleañera favorita`;
    }
    const chimpiAvatarHeader = document.querySelector('.mobile-avatar-chimpi');
    if (chimpiAvatarHeader) {
      chimpiAvatarHeader.style.backgroundImage = `url('./resources/pinchi_1.png')`;
    }
    const pinchiAvatarInput = document.querySelector('.mobile-avatar-pinchi');
    if (pinchiAvatarInput) {
      pinchiAvatarInput.style.backgroundImage = `url('./resources/chimpi_1.png')`;
    }
  }

  // Manejo de datos WebRTC
  function setupConnectionDataHandlers(conn) {
    let lastDataReceived = Date.now();

    // Heartbeat periódico bidireccional (ping/pong) para mantener vivo el canal y detectar zombis
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    heartbeatInterval = setInterval(() => {
      if (conn && conn.open) {
        try { conn.send({ type: 'ping' }); } catch (e) {}

        // Si pasan más de 18 segundos sin recibir ningún dato ni pong del rival, cerrar canal zombi
        if (Date.now() - lastDataReceived > 18000) {
          console.warn('P2P Heartbeat timeout (>18s sin respuesta). Cerrando canal zombi...');
          try { conn.close(); } catch (e) {}
        }
      }
    }, 5000);

    // Monitoreo de estado ICE de WebRTC si está disponible
    if (conn.peerConnection) {
      try {
        conn.peerConnection.addEventListener('iceconnectionstatechange', () => {
          const state = conn.peerConnection ? conn.peerConnection.iceConnectionState : null;
          if (state === 'failed') {
            console.warn('ICE WebRTC failed. Cerrando conexión para reintento...');
            try { conn.close(); } catch (e) {}
          }
        });
      } catch (e) {}
    }

    conn.on('data', (data) => {
      if (!data || typeof data !== 'object') return;
      lastDataReceived = Date.now();

      switch (data.type) {
        case 'ping':
          try { conn.send({ type: 'pong' }); } catch (e) {}
          break;

        case 'pong':
          // Canal confirmado como activo
          break;

        case 'chat':
          handleIncomingChatMessage(data);
          break;

        case 'buzz':
          handleIncomingBuzz(data);
          break;

        case 'typing':
          handleIncomingTyping(data);
          break;

        case 'video_overlay':
          handleIncomingVideo(data);
          break;

        case 'ttt_move':
          handleIncomingTicTacToeMove(data);
          break;

        case 'memory_init':
          if (typeof window._handleRemoteMemoryInit === 'function') {
            window._handleRemoteMemoryInit(data);
          }
          break;

        case 'memory_flip':
          if (typeof window._handleRemoteMemoryFlip === 'function') {
            window._handleRemoteMemoryFlip(data.index);
          }
          break;

        case 'game_invite':
          handleIncomingGameInvite(data);
          break;

        case 'game_invite_response':
          handleIncomingGameInviteResponse(data);
          break;

        case 'game_abandon':
          handleIncomingGameAbandon(data);
          break;

        case 'bs_ready':
          if (typeof window._handleRemoteBattleshipReady === 'function') {
            window._handleRemoteBattleshipReady(data);
          }
          break;

        case 'bs_start_turn':
          if (typeof window._handleRemoteBattleshipStartTurn === 'function') {
            window._handleRemoteBattleshipStartTurn(data);
          }
          break;

        case 'bs_shot':
          if (typeof window._handleRemoteBattleshipShot === 'function') {
            window._handleRemoteBattleshipShot(data);
          }
          break;

        case 'bs_shot_result':
          if (typeof window._handleRemoteBattleshipShotResult === 'function') {
            window._handleRemoteBattleshipShotResult(data);
          }
          break;

        // --- EXPANSIONES MULTIJUGADOR MSN ---
        case 'C4_DROP':
          if (typeof window._handleRemoteConnect4Drop === 'function') window._handleRemoteConnect4Drop(data);
          break;
        case 'C4_RESTART':
          if (typeof window._handleRemoteConnect4Restart === 'function') window._handleRemoteConnect4Restart();
          break;

        case 'BUZZ_PREPARE':
          if (typeof window._handleRemoteBuzzPrepare === 'function') window._handleRemoteBuzzPrepare(data);
          break;
        case 'BUZZ_HIT':
          if (typeof window._handleRemoteBuzzHit === 'function') window._handleRemoteBuzzHit(data);
          break;
        case 'BUZZ_FOUL':
          if (typeof window._handleRemoteBuzzFoul === 'function') window._handleRemoteBuzzFoul(data);
          break;

        case 'WB_DRAW':
          if (typeof window._handleRemoteWhiteboardDraw === 'function') window._handleRemoteWhiteboardDraw(data);
          break;
        case 'WB_CLEAR':
          if (typeof window._handleRemoteWhiteboardClear === 'function') window._handleRemoteWhiteboardClear();
          break;
        case 'WB_GUESS':
          if (typeof window._handleRemoteWhiteboardGuess === 'function') window._handleRemoteWhiteboardGuess(data);
          break;
        case 'WB_GUESS_CORRECT':
          if (typeof window._handleRemoteWhiteboardCorrect === 'function') window._handleRemoteWhiteboardCorrect(data);
          break;

        case 'SNOW_ACTION':
          if (typeof window._handleRemoteSnowAction === 'function') window._handleRemoteSnowAction(data);
          break;

        case 'TUG_PULSE':
          if (typeof window._handleRemoteTugPulse === 'function') window._handleRemoteTugPulse(data);
          break;

        case 'SYNC_VOTE':
          if (typeof window._handleRemoteSyncVote === 'function') window._handleRemoteSyncVote(data);
          break;

        case 'REBUS_SEND':
          if (typeof window._handleRemoteRebusSend === 'function') window._handleRemoteRebusSend(data);
          break;

        case 'HOCKEY_PADDLE':
          if (typeof window._handleRemoteHockeyPaddle === 'function') window._handleRemoteHockeyPaddle(data);
          break;
        case 'HOCKEY_STATE':
          if (typeof window._handleRemoteHockeyState === 'function') window._handleRemoteHockeyState(data);
          break;

        case 'WHEEL_SPIN':
          if (typeof window._handleRemoteWheelSpin === 'function') window._handleRemoteWheelSpin(data);
          break;

        case 'open_game':
          if (data.game === 'tictactoe' && typeof openTicTacToeGame === 'function') openTicTacToeGame();
          else if (data.game === 'memory' && typeof openMemoryGame === 'function') openMemoryGame(data.deckItemIds, data.startingTurn, true);
          else if (data.game === 'battleship' && typeof openBattleshipGame === 'function') openBattleshipGame();
          else if (data.game === 'connect4' && typeof openConnect4Game === 'function') openConnect4Game();
          else if (data.game === 'buzzduel' && typeof openBuzzDuelGame === 'function') openBuzzDuelGame();
          else if (data.game === 'whiteboard' && typeof openWhiteboardGame === 'function') openWhiteboardGame();
          else if (data.game === 'snowbattle' && typeof openSnowBattleGame === 'function') openSnowBattleGame();
          else if (data.game === 'tugofwar' && typeof openTugOfWarGame === 'function') openTugOfWarGame();
          else if (data.game === 'synctest' && typeof openSyncTestGame === 'function') openSyncTestGame();
          else if (data.game === 'rebus' && typeof openRebusGame === 'function') openRebusGame();
          else if (data.game === 'airhockey' && typeof openAirHockeyGame === 'function') openAirHockeyGame();
          else if (data.game === 'sharedwheel' && typeof openSharedWheelGame === 'function') openSharedWheelGame();
          else if (typeof openGamesHub === 'function') openGamesHub();
          break;

        case 'set_bot':
          window._botSilenced = !!data.silenced;
          break;
      }
    });

    conn.on('close', () => {
      console.log('Data connection cerrada.');
      if (window._activeLiveGame) {
        const game = window._activeLiveGame;
        window._activeLiveGame = null;
        if (typeof closeGameModal === 'function') closeGameModal(true);
        const chat = document.getElementById('chat');
        if (chat) {
          const container = document.createElement('div');
          container.className = 'message-container aviso';
          container.innerHTML = `
            <div class="message aviso" style="color:#c0392b;font-weight:bold;font-size:12px;padding:5px 9px;max-width:85%;">
              🚪 Conexión perdida durante la partida de <b>${game}</b>. Partida finalizada.
            </div>
          `;
          chat.appendChild(container);
          chat.scrollTop = chat.scrollHeight;
        }
      }
      if (activeConn === conn) {
        updateLiveUI('closed', false);
        activeConn = null;
        window._liveConnection = null;
      }
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    });
  }

  // Retransmitir mensaje a la otra persona cuando el usuario local envía algo
  window.broadcastLiveMessage = function (text, sender) {
    if (!activeConn || !activeConn.open) {
      console.log('Mensaje no transmitido: conexión P2P no abierta actualmente.');
      if (isChimpiMode) {
        const chat = document.getElementById('chat');
        if (chat) {
          const warn = document.createElement('div');
          warn.className = 'message-container aviso';
          warn.innerHTML = `<div class="message aviso" style="color:#d35400;font-size:11px;">⚠️ Esperando conexión: Pinchi debe tener abierta la web en su móvil para recibirlo.</div>`;
          chat.appendChild(warn);
          chat.scrollTop = chat.scrollHeight;
        }
      }
      return;
    }
    try {
      activeConn.send({
        type: 'chat',
        text: text,
        sender: sender
      });
      activeConn.send({
        type: 'typing',
        isTyping: false
      });
    } catch (e) {
      console.warn('Error al transmitir mensaje P2P:', e);
    }
  };

  function handleIncomingChatMessage(data) {
    if (typeof addMessage === 'function') {
      const sender = data.sender || 'chimpy';
      // Pasamos isRemote = true para que no rebote de vuelta
      addMessage(data.text, sender, null, null, null, true);
    }
    const sound = document.getElementById('soundNotification');
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {});
    }
  }

  let lastBuzzSent = 0;
  window.sendLiveBuzz = function () {
    const now = Date.now();
    if (now - lastBuzzSent < 1500) return;
    lastBuzzSent = now;
    if (activeConn && activeConn.open) {
      activeConn.send({ type: 'buzz', time: now });
    }
  };

  let lastBuzzReceived = 0;
  function handleIncomingBuzz(data) {
    const now = Date.now();
    if (now - lastBuzzReceived < 1500) return;
    lastBuzzReceived = now;

    if (typeof window.agitarPantalla === 'function') {
      window.agitarPantalla();
    }
    const container = document.createElement('div');
    container.className = 'message-container aviso';
    const msg = document.createElement('div');
    msg.className = 'message aviso';
    msg.textContent = '¡Has recibido un zumbido! 🔊';
    container.appendChild(msg);
    const chat = document.getElementById('chat');
    if (chat) {
      chat.appendChild(container);
      chat.scrollTop = chat.scrollHeight;
    }
  }

  function handleIncomingTyping(data) {
    if (typeof showTyping === 'function' && typeof hideTyping === 'function') {
      if (data.isTyping) {
        showTyping();
      } else {
        hideTyping();
      }
    }
  }

  function handleIncomingVideo(data) {
    if (typeof addVideo === 'function' && data.src) {
      addVideo(data.src, data.duration || 10);
    }
  }

  function handleIncomingTicTacToeMove(data) {
    if (typeof window._handleRemoteTicTacToe === 'function') {
      window._handleRemoteTicTacToe(data.index);
    }
  }

  // Funciones para sincronizar el Reto de Memoria en vivo
  window.sendLiveMemoryInit = function (deckItemIds, startingTurn) {
    if (!activeConn || !activeConn.open) return;
    activeConn.send({
      type: 'memory_init',
      deckItemIds: deckItemIds,
      startingTurn: startingTurn || '🐧'
    });
  };

  window.sendLiveMemoryFlip = function (cardIndex) {
    if (!activeConn || !activeConn.open) return;
    activeConn.send({
      type: 'memory_flip',
      index: cardIndex
    });
  };

  // ---------------------------------------------------------------------------
  // SISTEMA DE INVITACIONES A JUEGOS EN MODO LIVE (ESTILO MSN MESSENGER RETRO)
  // ---------------------------------------------------------------------------
  window.sendLiveGameInvite = function (gameId) {
    if (!activeConn || !activeConn.open) {
      if (gameId === 'tictactoe' && typeof openTicTacToeGame === 'function') openTicTacToeGame();
      else if (gameId === 'memory' && typeof openMemoryGame === 'function') openMemoryGame();
      else if (gameId === 'battleship' && typeof openBattleshipGame === 'function') openBattleshipGame();
      return;
    }

    const gameMap = {
      tictactoe: { title: 'Tres en Raya MSN', icon: '❌⭕' },
      memory: { title: 'Reto de Memoria', icon: '🧠' },
      battleship: { title: 'Hundir la Flota', icon: '🚢' },
      connect4: { title: 'Conecta 4 MSN', icon: '🔴🔵' },
      buzzduel: { title: 'Duelo de Zumbidos', icon: '⚡' },
      whiteboard: { title: 'Pizarra MSN', icon: '🎨' },
      snowbattle: { title: 'Guerra de Nieve', icon: '❄️' },
      tugofwar: { title: 'Zampabollos MSN', icon: '🎂' },
      synctest: { title: 'Desafío Telepático', icon: '🔮' },
      rebus: { title: 'Jeroglífico MSN', icon: '😎' },
      airhockey: { title: 'Air Hockey MSN', icon: '🏒' },
      sharedwheel: { title: 'Ruleta de Pareja', icon: '🎡' }
    };
    const g = gameMap[gameId] || { title: 'Juego MSN', icon: '🎮' };
    const inviteId = 'inv_' + Date.now();
    const myName = isChimpiMode ? 'Chimpi' : 'Pinchi';
    const mySymbol = isChimpiMode ? '🐷' : '🐧';
    const opponentName = isChimpiMode ? 'Pinchi' : 'Chimpi';

    let deckItemIds = null;
    if (gameId === 'memory' && typeof window.generateMemoryDeckIds === 'function') {
      deckItemIds = window.generateMemoryDeckIds();
    }
    window._lastInviteDeck = deckItemIds;

    // 1. Enviar paquete WebRTC a la otra persona con la baraja idéntica
    try {
      activeConn.send({
        type: 'game_invite',
        inviteId: inviteId,
        gameId: gameId,
        gameTitle: g.title,
        gameIcon: g.icon,
        from: myName,
        fromSymbol: mySymbol,
        deckItemIds: deckItemIds
      });
    } catch (e) {
      console.warn('Error enviando invitación WebRTC:', e);
    }

    // 2. Notificar en el chat del remitente
    const chat = document.getElementById('chat');
    if (chat) {
      const container = document.createElement('div');
      container.className = 'message-container aviso';
      container.innerHTML = `
        <div class="message aviso" id="invite-box-${inviteId}" style="max-width:85%;font-size:12px;padding:4px 8px;">
          📨 Invitando a <b>${opponentName}</b> a <b>${g.icon} ${g.title}</b>... ⏳
        </div>
      `;
      chat.appendChild(container);
      chat.scrollTop = chat.scrollHeight;
    }

    if (typeof playRetroTone === 'function') playRetroTone(400, 'sine', 0.1);
  };

  function handleIncomingGameInvite(data) {
    const chat = document.getElementById('chat');
    if (!chat) return;

    if (data.gameId === 'memory' && Array.isArray(data.deckItemIds)) {
      window._incomingInviteDeck = data.deckItemIds;
    }

    // Sonido clásico de notificación de MSN
    const sound = document.getElementById('soundNotification');
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {});
    }
    if (navigator.vibrate) try { navigator.vibrate([100, 60, 100]); } catch (e) {}

    const container = document.createElement('div');
    container.className = 'message-container aviso';
    container.innerHTML = `
      <div class="message msn-invite-bubble" id="incoming-invite-${data.inviteId}">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
          <div style="font-size:12px;color:#004a9f;">
            ${data.gameIcon} <b>${data.from}</b> te invita a <b>${data.gameTitle}</b>
          </div>
          <div style="display:flex;gap:6px;margin-left:auto;" id="invite-btns-${data.inviteId}">
            <button type="button" class="msn-invite-btn accept" onclick="window.respondToGameInvite('${data.inviteId}', '${data.gameId}', true)">
              ✅ Aceptar
            </button>
            <button type="button" class="msn-invite-btn decline" onclick="window.respondToGameInvite('${data.inviteId}', '${data.gameId}', false)">
              ❌ Rechazar
            </button>
          </div>
        </div>
      </div>
    `;
    chat.appendChild(container);
    chat.scrollTop = chat.scrollHeight;
  }

  window.respondToGameInvite = function (inviteId, gameId, accepted) {
    const btnsElem = document.getElementById(`invite-btns-${inviteId}`);
    const myName = isChimpiMode ? 'Chimpi' : 'Pinchi';

    if (btnsElem) {
      if (accepted) {
        btnsElem.innerHTML = `<span style="color:#28a745;font-weight:bold;font-size:11px;">✅ ¡Aceptado! Abriendo... 🚀</span>`;
      } else {
        btnsElem.innerHTML = `<span style="color:#777;font-style:italic;font-size:11px;">❌ Rechazado</span>`;
      }
    }

    if (activeConn && activeConn.open) {
      try {
        activeConn.send({
          type: 'game_invite_response',
          inviteId: inviteId,
          gameId: gameId,
          accepted: accepted,
          deckItemIds: window._incomingInviteDeck || null,
          from: myName
        });
      } catch (e) {}
    }

    if (accepted) {
      if (typeof playRetroTone === 'function') playRetroTone(550, 'triangle', 0.15);
      setTimeout(() => {
        if (gameId === 'tictactoe' && typeof openTicTacToeGame === 'function') openTicTacToeGame();
        else if (gameId === 'memory' && typeof openMemoryGame === 'function') openMemoryGame(window._incomingInviteDeck, '🐧', true);
        else if (gameId === 'battleship' && typeof openBattleshipGame === 'function') openBattleshipGame();
        else if (gameId === 'connect4' && typeof openConnect4Game === 'function') openConnect4Game();
        else if (gameId === 'buzzduel' && typeof openBuzzDuelGame === 'function') openBuzzDuelGame();
        else if (gameId === 'whiteboard' && typeof openWhiteboardGame === 'function') openWhiteboardGame();
        else if (gameId === 'snowbattle' && typeof openSnowBattleGame === 'function') openSnowBattleGame();
        else if (gameId === 'tugofwar' && typeof openTugOfWarGame === 'function') openTugOfWarGame();
        else if (gameId === 'synctest' && typeof openSyncTestGame === 'function') openSyncTestGame();
        else if (gameId === 'rebus' && typeof openRebusGame === 'function') openRebusGame();
        else if (gameId === 'airhockey' && typeof openAirHockeyGame === 'function') openAirHockeyGame();
        else if (gameId === 'sharedwheel' && typeof openSharedWheelGame === 'function') openSharedWheelGame();
      }, 400);
    }
  };

  function handleIncomingGameInviteResponse(data) {
    const inviteBox = document.getElementById(`invite-box-${data.inviteId}`);
    if (data.accepted) {
      if (inviteBox) {
        inviteBox.innerHTML = `
          <span style="color:#28a745;font-weight:bold;font-size:11px;">
            🎉 ¡<b>${data.from}</b> ha aceptado! ¡A jugar! 🚀
          </span>
        `;
      }
      if (typeof playRetroTone === 'function') playRetroTone(620, 'triangle', 0.2);
      if (navigator.vibrate) try { navigator.vibrate([80, 50, 80]); } catch (e) {}

      setTimeout(() => {
        if (data.gameId === 'tictactoe' && typeof openTicTacToeGame === 'function') openTicTacToeGame();
        else if (data.gameId === 'memory' && typeof openMemoryGame === 'function') openMemoryGame(data.deckItemIds || window._lastInviteDeck, '🐧', false);
        else if (data.gameId === 'battleship' && typeof openBattleshipGame === 'function') openBattleshipGame();
        else if (data.gameId === 'connect4' && typeof openConnect4Game === 'function') openConnect4Game();
        else if (data.gameId === 'buzzduel' && typeof openBuzzDuelGame === 'function') openBuzzDuelGame();
        else if (data.gameId === 'whiteboard' && typeof openWhiteboardGame === 'function') openWhiteboardGame();
        else if (data.gameId === 'snowbattle' && typeof openSnowBattleGame === 'function') openSnowBattleGame();
        else if (data.gameId === 'tugofwar' && typeof openTugOfWarGame === 'function') openTugOfWarGame();
        else if (data.gameId === 'synctest' && typeof openSyncTestGame === 'function') openSyncTestGame();
        else if (data.gameId === 'rebus' && typeof openRebusGame === 'function') openRebusGame();
        else if (data.gameId === 'airhockey' && typeof openAirHockeyGame === 'function') openAirHockeyGame();
        else if (data.gameId === 'sharedwheel' && typeof openSharedWheelGame === 'function') openSharedWheelGame();
      }, 400);
    } else {
      if (inviteBox) {
        inviteBox.innerHTML = `
          <span style="color:#c0392b;font-style:italic;font-size:11px;">
            🥺 <b>${data.from}</b> no puede jugar ahora
          </span>
        `;
      }
      if (typeof playRetroTone === 'function') playRetroTone(220, 'sine', 0.15);
    }
  }

  // Notificar abandono voluntario de partida activa
  window.sendLiveGameAbandon = function (gameName) {
    const myName = isChimpiMode ? 'Chimpi' : 'Pinchi';
    const mySymbol = isChimpiMode ? '🐷' : '🐧';

    if (activeConn && activeConn.open) {
      try {
        activeConn.send({
          type: 'game_abandon',
          game: gameName,
          from: myName,
          fromSymbol: mySymbol
        });
      } catch (e) {}
    }

    const chat = document.getElementById('chat');
    if (chat) {
      const container = document.createElement('div');
      container.className = 'message-container aviso';
      container.innerHTML = `
        <div class="message aviso" style="color:#c0392b;font-size:12px;padding:4px 8px;max-width:85%;">
          🚪 Has abandonado la partida de <b>${gameName}</b>.
        </div>
      `;
      chat.appendChild(container);
      chat.scrollTop = chat.scrollHeight;
    }
  };

  // Procesar abandono del rival
  function handleIncomingGameAbandon(data) {
    if (typeof closeGameModal === 'function') {
      closeGameModal(true); // Cerrar juego sin reenviar abandono
    }
    window._activeLiveGame = null;

    if (typeof playRetroTone === 'function') playRetroTone(220, 'sine', 0.25);
    if (navigator.vibrate) try { navigator.vibrate([80, 50, 80]); } catch (e) {}

    const chat = document.getElementById('chat');
    if (chat) {
      const container = document.createElement('div');
      container.className = 'message-container aviso';
      container.innerHTML = `
        <div class="message aviso" style="color:#c0392b;font-weight:bold;font-size:12px;padding:5px 9px;max-width:85%;">
          🚪 <b>${data.from} ${data.fromSymbol}</b> ha abandonado la partida de <b>${data.game || 'juego'}</b>. Partida finalizada.
        </div>
      `;
      chat.appendChild(container);
      chat.scrollTop = chat.scrollHeight;
    }
  }

  // Interceptar escritura en tiempo real para indicador "Escribiendo..."
  const inputElem = document.getElementById('input');
  if (inputElem) {
    let typingTimeout = null;
    inputElem.addEventListener('input', () => {
      if (!activeConn || !activeConn.open) return;
      try {
        activeConn.send({ type: 'typing', isTyping: true });
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
          if (activeConn && activeConn.open) {
            activeConn.send({ type: 'typing', isTyping: false });
          }
        }, 1400);
      } catch (e) {}
    });
  }

  // Interceptar botones de vídeos
  const pigBtn = document.getElementById('pig');
  if (pigBtn) {
    pigBtn.addEventListener('click', () => {
      if (activeConn && activeConn.open) {
        try {
          activeConn.send({
            type: 'video_overlay',
            src: './resources/msn-pig-dance.mp4',
            duration: 10
          });
        } catch (e) {}
      }
    }, true);
  }

  const angryBtn = document.getElementById('angry');
  if (angryBtn) {
    angryBtn.addEventListener('click', () => {
      if (activeConn && activeConn.open) {
        try {
          activeConn.send({
            type: 'video_overlay',
            src: './resources/msn-guitarra.mp4',
            duration: 9
          });
        } catch (e) {}
      }
    }, true);
  }

  window.sendLiveTicTacToeMove = function (cellIndex) {
    if (activeConn && activeConn.open) {
      try {
        activeConn.send({
          type: 'ttt_move',
          index: cellIndex
        });
      } catch (e) {}
    }
  };

  // Reconectar automáticamente si se cambia de pestaña, se recupera la red o se desbloquea el móvil
  function handleDeviceWakeup() {
    console.log('Dispositivo activo o en primer plano. Verificando estado P2P...');
    if (!peer || peer.destroyed) {
      initP2P();
      return;
    }
    if (peer.disconnected) {
      try { peer.reconnect(); } catch (e) {}
    }
    if (!activeConn || !activeConn.open) {
      if (isChimpiMode) {
        initP2P();
      } else {
        if (!peer.open && !peer.destroyed) {
          try { peer.reconnect(); } catch (e) {}
        }
      }
    }
  }

  window.addEventListener('online', () => {
    console.log('Red detectada online. Reanudando P2P...');
    handleDeviceWakeup();
  });

  window.addEventListener('focus', () => {
    handleDeviceWakeup();
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      handleDeviceWakeup();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initP2P);
  } else {
    initP2P();
  }
})();
