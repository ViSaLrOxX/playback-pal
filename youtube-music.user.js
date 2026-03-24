// ==UserScript==
// @name         playback-pal · YouTube Music
// @namespace    https://github.com/ViSaLrOxX/playback-pal
// @version      1.0.0
// @description  Playback speed controls for YouTube Music
// @author       ViSaLrOxX
// @match        *://music.youtube.com/*
// @grant        GM_addStyle
// @grant        unsafeWindow
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const win    = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
  const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];
  const SK     = 'pp:ytmusic';

  let speed      = parseFloat(localStorage.getItem(SK) || '1');
  let uiReady    = false;
  let lastTrack  = '';
  let lockActive = false;

  function getVideo() {
    return document.querySelector('video');
  }

  function forceRate(v, val) {
    if (!v) return;
    lockActive = true;
    try {
      v.playbackRate        = val;
      v.defaultPlaybackRate = val;
    } catch (_) {}
    setTimeout(() => { lockActive = false; }, 50);
  }

  function attachToVideo(v) {
    if (!v || v.__ppAttached) return;
    v.__ppAttached = true;
    forceRate(v, speed);
    v.addEventListener('ratechange',     () => { if (!lockActive && v.playbackRate !== speed) forceRate(v, speed); });
    v.addEventListener('play',           () => forceRate(v, speed));
    v.addEventListener('canplay',        () => forceRate(v, speed));
    v.addEventListener('loadedmetadata', () => forceRate(v, speed));
    v.addEventListener('seeking',        () => forceRate(v, speed));
  }

  setInterval(() => {
    const v = getVideo();
    if (v) {
      attachToVideo(v);
      if (!lockActive && v.playbackRate !== speed) forceRate(v, speed);
    }
  }, 500);

  setInterval(() => {
    const ms = win.navigator && win.navigator.mediaSession;
    if (!ms) return;
    const title = ms.metadata && ms.metadata.title;
    if (title && title !== lastTrack) {
      lastTrack = title;
      [300, 800, 1500].forEach(t => setTimeout(() => forceRate(getVideo(), speed), t));
    }
  }, 500);

  function setSpeed(val) {
    speed = val;
    localStorage.setItem(SK, val);
    forceRate(getVideo(), val);
  }

  GM_addStyle(`
    #pp {
      position: fixed;
      bottom: 72px;
      right: 18px;
      z-index: 2147483647;
      font-family: -apple-system, 'Segoe UI', system-ui, sans-serif;
      user-select: none;
    }
    #pp-panel {
      background: rgba(0,0,0,0.88);
      backdrop-filter: blur(20px) saturate(150%);
      -webkit-backdrop-filter: blur(20px) saturate(150%);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 13px;
      padding: 12px 14px 11px;
      min-width: 232px;
      box-shadow: 0 10px 36px rgba(0,0,0,0.65);
    }
    #pp-panel.off { display: none; }
    #pp-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    #pp-label {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.13em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.25);
    }
    #pp-right { display: flex; align-items: center; gap: 7px; }
    #pp-cur {
      font-size: 12px;
      font-weight: 800;
      color: #ff0000;
      background: rgba(255,0,0,0.1);
      border: 1px solid rgba(255,0,0,0.25);
      border-radius: 5px;
      padding: 1px 8px 2px;
    }
    #pp-hide {
      background: none;
      border: none;
      color: rgba(255,255,255,0.2);
      font-size: 15px;
      line-height: 1;
      cursor: pointer;
      padding: 0;
      transition: color 0.1s;
    }
    #pp-hide:hover { color: rgba(255,255,255,0.6); }
    #pp-btns {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 5px;
      margin-bottom: 8px;
    }
    .ppb {
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
    .ppb:hover { background: rgba(255,255,255,0.1); color: #fff; transform: translateY(-1px); }
    .ppb:active { transform: none; }
    .ppb.active {
      background: rgba(255,0,0,0.14);
      border-color: rgba(255,0,0,0.38);
      color: #ff0000;
    }
    #pp-custom {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 7px;
    }
    #pp-custom-input {
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
    #pp-custom-input:focus { border-color: rgba(255,0,0,0.4); }
    #pp-custom-input::placeholder { color: rgba(255,255,255,0.2); }
    #pp-custom-btn {
      background: rgba(255,0,0,0.12);
      border: 1px solid rgba(255,0,0,0.3);
      border-radius: 6px;
      color: #ff0000;
      font-family: inherit;
      font-size: 11px;
      font-weight: 700;
      padding: 5px 10px;
      cursor: pointer;
      transition: background 0.1s;
    }
    #pp-custom-btn:hover { background: rgba(255,0,0,0.22); }
    #pp-sub {
      font-size: 9px;
      color: rgba(255,255,255,0.16);
      text-align: center;
    }
    #pp-sub b { color: rgba(255,0,0,0.55); }
    #pp-pill {
      position: fixed;
      bottom: 72px;
      right: 18px;
      z-index: 2147483646;
      background: rgba(0,0,0,0.88);
      border: 1px solid rgba(255,0,0,0.28);
      border-radius: 20px;
      padding: 5px 12px 6px;
      color: #ff0000;
      font-family: inherit;
      font-size: 11.5px;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      display: none;
      transition: transform 0.1s;
    }
    #pp-pill:hover { transform: scale(1.05); }
  `);

  function el(tag, attrs, text) {
    const e = document.createElement(tag);
    if (attrs) Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') e.className = v;
      else e.setAttribute(k, v);
    });
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function buildUI() {
    if (uiReady || !document.body) return;
    uiReady = true;

    const wrap   = el('div', { id: 'pp' });
    const panel  = el('div', { id: 'pp-panel' });
    const top    = el('div', { id: 'pp-top' });
    const label  = el('span', { id: 'pp-label' }, '▶ speed');
    const right  = el('div', { id: 'pp-right' });
    const cur    = el('span', { id: 'pp-cur' }, speed + 'x');
    const hide   = el('button', { id: 'pp-hide' }, '−');
    const btns   = el('div', { id: 'pp-btns' });
    const custom = el('div', { id: 'pp-custom' });
    const input  = el('input', { id: 'pp-custom-input', type: 'number', min: '0.1', max: '10', step: '0.05', placeholder: 'custom e.g. 1.3' });
    const setBtn = el('button', { id: 'pp-custom-btn' }, 'Set');
    const sub    = el('div', { id: 'pp-sub' }, '[ / ] to step • saved per site');
    const pill   = el('button', { id: 'pp-pill' }, speed + 'x');

    SPEEDS.forEach(s => {
      const b = el('button', { class: 'ppb' + (s === speed ? ' active' : ''), 'data-s': s }, s + 'x');
      b.addEventListener('click', () => pick(s));
      btns.appendChild(b);
    });

    right.appendChild(cur);
    right.appendChild(hide);
    top.appendChild(label);
    top.appendChild(right);
    custom.appendChild(input);
    custom.appendChild(setBtn);
    panel.appendChild(top);
    panel.appendChild(btns);
    panel.appendChild(custom);
    panel.appendChild(sub);
    wrap.appendChild(panel);

    document.body.appendChild(wrap);
    document.body.appendChild(pill);

    setBtn.addEventListener('click', () => {
      const val = parseFloat(input.value);
      if (val >= 0.1 && val <= 10) { pick(val); input.value = ''; }
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') setBtn.click();
      e.stopPropagation();
    });
    hide.addEventListener('click', () => {
      panel.classList.add('off');
      pill.style.display = 'block';
    });
    pill.addEventListener('click', () => {
      panel.classList.remove('off');
      pill.style.display = 'none';
    });
    document.addEventListener('keydown', e => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      const idx = SPEEDS.indexOf(speed);
      if (e.key === '[' && idx > 0)                 pick(SPEEDS[idx - 1]);
      if (e.key === ']' && idx < SPEEDS.length - 1) pick(SPEEDS[idx + 1]);
    }, true);
  }

  function pick(val) {
    setSpeed(val);
    document.querySelectorAll('.ppb').forEach(b => b.classList.toggle('active', parseFloat(b.dataset.s) === val));
    const cur  = document.getElementById('pp-cur');
    const pill = document.getElementById('pp-pill');
    const sub  = document.getElementById('pp-sub');
    if (cur)  cur.textContent = val + 'x';
    if (pill) pill.textContent = val + 'x';
    if (sub)  sub.textContent = val + 'x • [ / ] to step • saved per site';
  }

  const tryBuild = setInterval(() => {
    if (document.body) {
      buildUI();
      if (uiReady) clearInterval(tryBuild);
    }
  }, 300);

})();