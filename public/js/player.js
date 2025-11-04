const Player = (() => {
  const modal = document.getElementById('player-modal');
  const video = document.getElementById('player');
  const msg = document.getElementById('player-message');
  const qSelect = document.getElementById('ctl-quality');

  let hls = null;
  let currentSrc = null;
  let autoLevel = true;

  const btnPlay = document.getElementById('ctl-play');
  const btnMute = document.getElementById('ctl-mute');
  const btnPip = document.getElementById('ctl-pip');
  const btnFull = document.getElementById('ctl-fullscreen');
  const btnClose = document.getElementById('ctl-close');

  function showMessage(text, transient = true) {
    if (!msg) return;
    msg.textContent = text;
    msg.hidden = false;
    if (transient) setTimeout(() => { msg.hidden = true; }, 2000);
  }

  function clearMessage() { if (msg) msg.hidden = true; }

  function teardown() {
    try {
      if (hls) { hls.destroy(); hls = null; }
      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
      }
    } catch {}
    if (qSelect) qSelect.innerHTML = '';
  }

  function setupQualityMenu() {
    if (!qSelect) return;
    qSelect.innerHTML = '';
    const optAuto = document.createElement('option');
    optAuto.value = 'auto';
    optAuto.textContent = 'Auto';
    qSelect.appendChild(optAuto);
    qSelect.value = 'auto';

    if (window.Hls && hls && hls.levels) {
      const levels = hls.levels
        .map((l, i) => ({ i, h: l.height || 0, b: l.bitrate || 0 }))
        .sort((a,b) => b.h - a.h || b.b - a.b);

      levels.forEach(({ i, h, b }) => {
        const opt = document.createElement('option');
        opt.value = String(i);
        opt.textContent = h ? `${h}p` : `${Math.round(b/1000)}kbps`;
        qSelect.appendChild(opt);
      });

      qSelect.addEventListener('change', () => {
        if (!hls) return;
        if (qSelect.value === 'auto') {
          autoLevel = true;
          hls.currentLevel = -1;
        } else {
          autoLevel = false;
          hls.currentLevel = parseInt(qSelect.value, 10);
        }
      });
    }
  }

  function open(src) {
    if (!src || !modal) return;
    currentSrc = src;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    play(src);
  }

  function close() {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    teardown();
  }

  function play(src) {
    if (!video) return;
    teardown();
    clearMessage();

    const canNativeHls = video.canPlayType && video.canPlayType('application/vnd.apple.mpegurl');
    const useHlsJs = !canNativeHls && window.Hls && window.Hls.isSupported && window.Hls.isSupported();

    if (useHlsJs) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
        fragLoadingMaxRetry: 5,
        fragLoadingRetryDelay: 1000,
        manifestLoadingRetryDelay: 1000,
      });
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setupQualityMenu();
        video.play().catch(()=>{});
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        const fatal = data?.fatal;
        if (fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              showMessage(window.I18N?.t('player.reconnecting') || 'Reconnecting…', false);
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              showMessage(window.I18N?.t('player.error') || 'Playback error', false);
              hls.destroy(); hls = null;
          }
        }
      });
    } else if (canNativeHls) {
      video.src = src;
      video.addEventListener('loadedmetadata', () => video.play().catch(()=>{}), { once: true });
      setupQualityMenu();
    } else {
      showMessage(window.I18N?.t('player.unavailable') || 'Stream unavailable', false);
    }
  }

  if (btnPlay) btnPlay.addEventListener('click', () => { if (video.paused) video.play(); else video.pause(); });
  if (btnMute) btnMute.addEventListener('click', () => { video.muted = !video.muted; });
  if (btnPip) btnPip.addEventListener('click', async () => { try { if (document.pictureInPictureElement) await document.exitPictureInPicture(); else if (document.pictureInPictureEnabled) await video.requestPictureInPicture(); } catch {} });
  if (btnFull) btnFull.addEventListener('click', async () => { const el = document.getElementById('player-modal') || video; try { if (!document.fullscreenElement) await el.requestFullscreen(); else await document.exitFullscreen(); } catch {} });
  if (btnClose) btnClose.addEventListener('click', () => close());

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Backspace') {
      if (modal && !modal.classList.contains('hidden')) close();
    }
  });

  return { open, close, play };
})();
window.Player = Player;

