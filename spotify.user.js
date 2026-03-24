// ==UserScript==
// @name         playback-pal
// @namespace    https://github.com/ViSaLrOxX/playback-pal
// @version      1.0.0
// @description  Playback speed controls for Spotify
// @author       ViSaLrOxX
// @match        *://open.spotify.com/*
// @grant        GM_addStyle
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';

  const win    = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
  const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];
  const SK     = 'msc5:' + location.hostname;

  let speed     = parseFloat(localStorage.getItem(SK) || '1');
  let uiReady   = false;
  let lastHref  = location.href;
  let lastTrack = '';

  const liveNodes = new Set();
  win.__mscSpeed  = speed;

  function patchStart() {
    const proto = win.AudioBufferSourceNode && win.AudioBufferSourceNode.prototype;
    if (!proto || proto.__mscOk) return;
    proto.__mscOk = true;
    const _start  = proto.start;
    proto.start   = function (when, offset, dur) {
      this.playbackRate.value = win.__mscSpeed;
      liveNodes.add(this);
      this.addEventListener('ended', () => liveNodes.delete(this), { once: true });
      return _start.apply(this, arguments);
    };
  }

  function patchContext(Ctx) {
    if (!Ctx || Ctx.prototype.__mscCtxOk) return;
    Ctx.prototype.__mscCtxOk = true;
    const _cbs = Ctx.prototype.createBufferSource;
    Ctx.prototype.createBufferSource = function () {
      const node = _cbs.call(this);
      node.playbackRate.value = win.__mscSpeed;
      return node;
    };
  }

  function patchMediaElProto() {
    const desc = Object.getOwnPropertyDescriptor(win.HTMLMediaElement.prototype, 'playbackRate');
    if (!desc || !desc.set || desc.set.__mscOk) return;
    const _set   = desc.set;
    const setter = function () { _set.call(this, win.__mscSpeed); };
    setter.__mscOk = true;
    Object.defineProperty(win.HTMLMediaElement.prototype, 'playbackRate', {
      configurable: true, enumerable: true, get: desc.get, set: setter,
    });
  }

  function patchAll() {
    patchStart();
    patchContext(win.AudioContext);
    patchContext(win.webkitAudioContext);
    patchMediaElProto();
  }

  patchAll();

  ['AudioContext', 'webkitAudioContext'].forEach(name => {
    if (win[name]) return;
    let _Ctx;
    Object.defineProperty(win, name, {
      configurable: true,
      get() { return _Ctx; },
      set(C) { _Ctx = C; patchContext(C); patchStart(); },
    });
  });

  function setSpeed(val) {
    win.__mscSpeed = val;
    speed = val;
    localStorage.setItem(SK, val);

    liveNodes.forEach(node => {
      try { node.playbackRate.setValueAtTime(val, node.context.currentTime); }
      catch (_) { try { node.playbackRate.value = val; } catch (_2) {} }
    });

    document.querySelectorAll('audio, video').forEach(el => {
      try {
        Object.defineProperty(el, 'playbackRate', { configurable: true, writable: true, value: val });
        el.defaultPlaybackRate = val;
      } catch (_) {}
    });
  }

  function watchTitle() {
    const t = document.querySelector('title');
    if (!t || t.__mscWatched) return;
    t.__mscWatched = true;
    new MutationObserver(() => {
      setTimeout(() => setSpeed(speed), 150);
      setTimeout(() => setSpeed(speed), 700);
    }).observe(t, { childList: true });
  }

  function watchMediaSession() {
    const ms = win.navigator && win.navigator.mediaSession;
    if (!ms) return;
    setInterval(() => {
      const title = ms.metadata && ms.metadata.title;
      if (title && title !== lastTrack) {
        lastTrack = title;
        setTimeout(() => setSpeed(speed), 150);
        setTimeout(() => setSpeed(speed), 900);
      }
    }, 500);
  }

  watchMediaSession();

  document.addEventListener('keydown', e => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
    const idx = SPEEDS.indexOf(speed);
    if (e.key === '[' && idx > 0)                 pick(SPEEDS[idx - 1]);
    if (e.key === ']' && idx < SPEEDS.length - 1) pick(SPEEDS[idx + 1]);
  }, true);

  GM_addStyle(`
    #msc {
      position: fixed;
      bottom: 88px;
      right: 18px;
      z-index: 2147483647;
      font-family: -apple-system, 'Segoe UI', system-ui, sans-serif;
      user-select: none;
    }
    #msc-panel {
      background: rgba(0,0,0,0.88);
      backdrop-filter: blur(20px) saturate(150%);
      -webkit-backdrop-filter: blur(20px) saturate(150%);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 13px;
      padding: 12px 14px 11px;
      min-width: 232px;
      box-shadow: 0 10px 36px rgba(0,0,0,0.65);
    }
    #msc-panel.off { display: none; }
    #msc-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    #msc-label {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.13em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.25);
    }
    #msc-right { display: flex; align-items: center; gap: 7px; }
    #msc-cur {
      font-size: 12px;
      font-weight: 800;
      color: #1ed760;
      background: rgba(30,215,96,0.1);
      border: 1px solid rgba(30,215,96,0.25);
      border-radius: 5px;
      padding: 1px 8px 2px;
    }
    #msc-hide {
      background: none;
      border: none;
      color: rgba(255,255,255,0.2);
      font-size: 15px;
      line-height: 1;
      cursor: pointer;
      padding: 0;
      transition: color 0.1s;
    }
    #msc-hide:hover { color: rgba(255,255,255,0.6); }
    #msc-btns {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 5px;
      margin-bottom: 8px;
    }
    .msb {
      background: rgba(255,255,255,0.055);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 6px;
      color: rgba(255,255,255,0.45);
      font-family: inherit;
      font-size: 11px;
      font-weight: 700;
      padding: 6px 2px;
      cursor: pointer;
      transition: background 0.1s, color 0.1s, transform 0.1s;
      letter-spacing: -0.01em;
    }
    .msb:hover { background: rgba(255,255,255,0.1); color: #fff; transform: translateY(-1px); }
    .msb:active { transform: none; }
    .msb.active {
      background: rgba(30,215,96,0.14);
      border-color: rgba(30,215,96,0.38);
      color: #1ed760;
    }
    #msc-custom {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 7px;
    }
    #msc-custom-input {
      flex: 1;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 6px;
      color: #fff;
      font-family: inherit;
      font-size: 11px;
      font-weight: 600;
      padding: 5px 8px;
      outline: none;
      transition: border-color 0.1s;
    }
    #msc-custom-input:focus { border-color: rgba(30,215,96,0.4); }
    #msc-custom-input::placeholder { color: rgba(255,255,255,0.2); }
    #msc-custom-btn {
      background: rgba(30,215,96,0.12);
      border: 1px solid rgba(30,215,96,0.3);
      border-radius: 6px;
      color: #1ed760;
      font-family: inherit;
      font-size: 11px;
      font-weight: 700;
      padding: 5px 10px;
      cursor: pointer;
      transition: background 0.1s;
    }
    #msc-custom-btn:hover { background: rgba(30,215,96,0.22); }
    #msc-sub {
      font-size: 9px;
      color: rgba(255,255,255,0.16);
      text-align: center;
    }
    #msc-sub b { color: rgba(30,215,96,0.45); }
    #msc-pill {
      position: fixed;
      bottom: 88px;
      right: 18px;
      z-index: 2147483646;
      background: rgba(0,0,0,0.88);
      border: 1px solid rgba(30,215,96,0.28);
      border-radius: 20px;
      padding: 5px 12px 6px;
      color: #1ed760;
      font-family: inherit;
      font-size: 11.5px;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      display: none;
      transition: transform 0.1s;
    }
    #msc-pill:hover { transform: scale(1.05); }
  `);

  function buildUI() {
    if (uiReady || !document.body) return;
    uiReady = true;

    const wrap = document.createElement('div');
    wrap.id = 'msc';
    wrap.innerHTML = `
      <div id="msc-panel">
        <div id="msc-top">
          <span id="msc-label">&#9654; speed</span>
          <div id="msc-right">
            <span id="msc-cur">${speed}x</span>
            <button id="msc-hide">&#x2212;</button>
          </div>
        </div>
        <div id="msc-btns">
          ${SPEEDS.map(s => `<button class="msb${s === speed ? ' active' : ''}" data-s="${s}">${s}x</button>`).join('')}
        </div>
        <div id="msc-custom">
          <input id="msc-custom-input" type="number" min="0.1" max="10" step="0.05" placeholder="custom e.g. 1.3" />
          <button id="msc-custom-btn">Set</button>
        </div>
        <div id="msc-sub">[ / ] to step &bull; saved per site</div>
      </div>
    `;

    const pill = document.createElement('button');
    pill.id = 'msc-pill';
    pill.textContent = speed + 'x';

    document.body.appendChild(wrap);
    document.body.appendChild(pill);

    wrap.querySelectorAll('.msb').forEach(btn =>
      btn.addEventListener('click', () => pick(parseFloat(btn.dataset.s)))
    );

    const input = document.getElementById('msc-custom-input');
    document.getElementById('msc-custom-btn').addEventListener('click', () => {
      const val = parseFloat(input.value);
      if (val >= 0.1 && val <= 10) { pick(val); input.value = ''; }
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('msc-custom-btn').click();
      e.stopPropagation();
    });

    document.getElementById('msc-hide').addEventListener('click', () => {
      document.getElementById('msc-panel').classList.add('off');
      pill.style.display = 'block';
    });
    pill.addEventListener('click', () => {
      document.getElementById('msc-panel').classList.remove('off');
      pill.style.display = 'none';
    });

    watchTitle();
  }

  function pick(val) {
    setSpeed(val);
    document.querySelectorAll('.msb').forEach(b => b.classList.toggle('active', parseFloat(b.dataset.s) === val));
    const cur  = document.getElementById('msc-cur');
    const pill = document.getElementById('msc-pill');
    const sub  = document.getElementById('msc-sub');
    if (cur)  cur.textContent  = val + 'x';
    if (pill) pill.textContent = val + 'x';
    if (sub)  sub.innerHTML    = `<b>${val}x</b> &bull; [ / ] to step &bull; saved per site`;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(buildUI, 700));
  } else {
    setTimeout(buildUI, 700);
  }

  setInterval(() => {
    if (location.href !== lastHref) {
      lastHref = location.href;
      setTimeout(() => { patchAll(); if (!uiReady) buildUI(); setSpeed(speed); }, 1800);
    }
    document.querySelectorAll('audio, video').forEach(el => {
      if (el.__mscSeen === speed) return;
      el.__mscSeen = speed;
      try { el.defaultPlaybackRate = speed; } catch (_) {}
    });
  }, 1500);

})();