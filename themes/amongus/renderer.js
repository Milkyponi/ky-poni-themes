/**
 * KY-Poni — Among Us Meeting Chat Theme Renderer
 * Kontrak tema standar: window.KYPoniTheme = { renderMessage, onLoad, onSpecialEvent }
 *
 * Ciri khas:
 * - Avatar crewmate dari 16 sprite asli 144x136 (`assets/crewmates/01_red.png` .. `16_mint.png`).
 * - Warna per-viewer UNIK DALAM SATU SESI (Bos Opsi A): pool 16 warna diacak Fisher-Yates
 *   sekali saat modul dimuat, lalu dikonsumsi satu per satu. Viewer #17 ke atas memakai
 *   LRU (colorLastUsed minimum), jadi tidak ada dua viewer yang bertabrakan warna
 *   selama jumlah viewer <= 16.
 * - Warna diikat ke identitas viewer (channelId → nama → anon:id), bukan ke posisi DOM,
 *   sehingga `rebuildDom()` core (ganti font/warna/skala) tidak mengocok warna balon.
 * - 9-slice 3-kolom skin dari PNG original; Super Chat = trim emas, New Member = trim emerald.
 * - TANPA animasi: animasi masuk/keluar milik core (overlay_transitions.css v1.3.1+).
 *
 * Keamanan teks: seluruh isi pesan dipasang lewat `textContent`, bukan innerHTML.
 * `item.rawText` dipakai lebih dulu supaya `&` dan `<` tampil apa adanya (tanpa
 * double-escape warisan `message` yang sudah di-escape di batas sistem).
 */

(function () {
  'use strict';

  const DEFAULT_FONT_STACK = "'Liberation Sans', Arial, Helvetica, sans-serif";
  const ASSET_BASE = '/themes/amongus/assets/crewmates/';

  /**
   * 16 warna Among Us. Urutan indeks = urutan field `colorLastUsed`, jadi
   * pemetaan ini tidak boleh diubah tanpa menyesuaikan QA (dataset
   * `data-crewmate-color` adalah kontrak yang diperiksa test).
   */
  const CREWMATES = [
    { slug: 'red', file: '01_red.png' },
    { slug: 'blue', file: '02_blue.png' },
    { slug: 'green', file: '03_green.png' },
    { slug: 'yellow', file: '04_yellow.png' },
    { slug: 'orange', file: '05_orange.png' },
    { slug: 'purple', file: '06_purple.png' },
    { slug: 'cyan', file: '07_cyan.png' },
    { slug: 'pink', file: '08_pink.png' },
    { slug: 'lime', file: '09_lime.png' },
    { slug: 'brown', file: '10_brown.png' },
    { slug: 'white', file: '11_white.png' },
    { slug: 'black', file: '12_black.png' },
    { slug: 'lavender', file: '13_lavender.png' },
    { slug: 'darkgreen', file: '14_darkgreen.png' },
    { slug: 'magenta', file: '15_magenta.png' },
    { slug: 'mint', file: '16_mint.png' }
  ];

  // Pool warna bebas. Fisher-Yates SEKALI saat modul init → setiap sesi live
  // mulai dari urutan warna yang berbeda (viewer pertama tidak selalu merah).
  const unusedPool = CREWMATES.map((_, index) => index);
  for (let i = unusedPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = unusedPool[i];
    unusedPool[i] = unusedPool[j];
    unusedPool[j] = tmp;
  }

  /** viewerKey → color index */
  const viewerColorMap = new Map();
  /** color index → tick terakhir dipakai (LRU) */
  const colorLastUsed = new Array(CREWMATES.length).fill(0);
  let tick = 0;

  function viewerKey(item) {
    const author = item && item.author ? item.author : null;

    if (author && author.channelId) {
      const channelKey = String(author.channelId).trim().toLowerCase();
      if (channelKey) return channelKey;
    }

    if (author && author.name) {
      const nameKey = String(author.name).trim().toLowerCase();
      if (nameKey) return 'name:' + nameKey;
    }

    return 'anon:' + String((item && item.id) || Math.random());
  }

  /**
   * Warna stabil per viewer: viewer yang sudah punya warna mempertahankannya
   * (hanya tick-nya yang naik), viewer baru mengambil dari pool, dan viewer
   * ke-17 dan seterusnya merebut warna yang paling lama tidak dipakai.
   */
  function pickCrewmateColor(item) {
    const key = viewerKey(item);
    tick += 1;

    if (viewerColorMap.has(key)) {
      const existing = viewerColorMap.get(key);
      colorLastUsed[existing] = tick;
      return CREWMATES[existing];
    }

    let index;
    if (unusedPool.length > 0) {
      index = unusedPool.pop();
    } else {
      index = 0;
      for (let i = 1; i < colorLastUsed.length; i++) {
        if (colorLastUsed[i] < colorLastUsed[index]) index = i;
      }
    }

    viewerColorMap.set(key, index);
    colorLastUsed[index] = tick;
    return CREWMATES[index];
  }

  /**
   * Decode entitas HTML sekali saja — hanya dipakai untuk fallback `item.message`
   * (jalur lama yang teksnya sudah di-escape di batas sistem). Hasilnya tetap
   * dipasang lewat textContent, jadi tidak ada markup yang bisa dieksekusi.
   */
  function decodeEntities(text) {
    if (typeof text !== 'string' || text.indexOf('&') === -1) return text;
    const box = document.createElement('textarea');
    box.innerHTML = text;
    return box.value;
  }

  function resolveFontFamily(font) {
    if (!font) return DEFAULT_FONT_STACK;
    const name = String(font).trim();
    if (!name) return DEFAULT_FONT_STACK;
    return "'" + name.replace(/'/g, '') + "', Arial, Helvetica, sans-serif";
  }

  function el(tag, className) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  /** Ukuran + tebal outline username mengikuti preset fsize (Polish #3).
   *  Dengan `paint-order: stroke fill`, separuh stroke tertutup fill putih,
   *  jadi nilai 3.6/4.2/4.8 px menghasilkan outline luar nyata 1.8/2.1/2.4 px. */
  function nameScaleFor(fsize) {
    if (fsize <= 14) return { fontSize: 16, stroke: 3.6 };
    if (fsize <= 17) return { fontSize: 18, stroke: 4.2 };
    return { fontSize: 21, stroke: 4.8 };
  }

  window.KYPoniTheme = {
    renderMessage(item, context) {
      const ctx = context || {};
      const message = item || {};
      const isSuperChat = message.type === 'superchat';
      const isMembership = message.type === 'membership';

      // Sumber teks: rawText (mentah) lebih dulu, fallback message (di-decode).
      const sourceText = (message.rawText !== undefined && message.rawText !== null)
        ? String(message.rawText)
        : decodeEntities(String(message.message || ''));
      const newlineCount = (sourceText.match(/\n/g) || []).length;
      const rawLength = sourceText.length;

      const fsize = (Number(ctx.fsize) > 0) ? Number(ctx.fsize) : 16;
      const fontFactor = Math.max(1, fsize / 16);
      const badgeBonus = (isSuperChat ? 24 : 0) + (isMembership ? 22 : 0);
      const effectiveLength = Math.round(rawLength * fontFactor) + badgeBonus;

      // 4-Tier Dynamic Width (sadar fsize). Ambang dikalibrasi ke lebar
      // 460/540/620/680 px: 200 karakter @20px tetap tier-3, 350 karakter
      // Super Chat @20px naik ke tier-4.
      let tierClass = 'tier-1';
      if (effectiveLength > 400 || newlineCount >= 3) {
        tierClass = 'tier-4';
      } else if (effectiveLength > 175 || newlineCount >= 2) {
        tierClass = 'tier-3';
      } else if (effectiveLength > 55 || newlineCount >= 1 || isSuperChat || isMembership) {
        tierClass = 'tier-2';
      }

      const isTall = tierClass === 'tier-3' || tierClass === 'tier-4'
        || newlineCount >= 2 || effectiveLength > 110;

      const entry = el('div', 'chat-entry ' + tierClass
        + (isSuperChat ? ' is-superchat' : '')
        + (isMembership ? ' is-membership' : '')
        + (isTall ? ' is-tall' : ''));
      entry.id = 'msg-' + message.id;

      // Warna crewmate per viewer (stabil lintas rebuildDom).
      const crewmate = pickCrewmateColor(message);
      entry.dataset.crewmateColor = crewmate.slug;

      // A. Skin 9-slice 3 kolom
      const skin = el('div', 'au-skin');

      const colL = el('div', 'au-col-l');
      colL.appendChild(el('div', 'au-tl'));
      colL.appendChild(el('div', 'au-ml'));
      colL.appendChild(el('div', 'au-bl'));

      const colM = el('div', 'au-col-m');
      colM.appendChild(el('div', 'au-tm'));
      colM.appendChild(el('div', 'au-mc'));
      colM.appendChild(el('div', 'au-bm'));

      const colR = el('div', 'au-col-r');
      colR.appendChild(el('div', 'au-tr'));
      colR.appendChild(el('div', 'au-mr'));
      colR.appendChild(el('div', 'au-br'));

      skin.appendChild(colL);
      skin.appendChild(colM);
      skin.appendChild(colR);

      // B. Isi balon: crewmate + username/badge + pesan
      const content = el('div', 'au-content');

      const avatar = el('img', 'au-avatar');
      avatar.src = ASSET_BASE + crewmate.file;
      avatar.alt = '';
      avatar.draggable = false;
      content.appendChild(avatar);

      const textCol = el('div', 'au-text-col');

      const header = el('div', 'au-header');

      const username = el('span', 'au-username');
      const nameScale = nameScaleFor(fsize);
      username.style.fontSize = nameScale.fontSize + 'px';
      username.style.setProperty('--au-name-stroke', nameScale.stroke + 'px');
      const author = (message.author && message.author.name) ? String(message.author.name) : '';
      username.textContent = author.trim() ? author : 'Crewmate';
      username.title = username.textContent;
      header.appendChild(username);

      if (isSuperChat) {
        const badge = el('span', 'au-badge au-badge-superchat');
        badge.textContent = (message.superchat && message.superchat.amount)
          ? String(message.superchat.amount)
          : 'SUPER CHAT';
        header.appendChild(badge);
      } else if (isMembership) {
        const badge = el('span', 'au-badge au-badge-member');
        badge.textContent = 'NEW MEMBER';
        header.appendChild(badge);
      }

      textCol.appendChild(header);

      const messageText = el('div', 'au-message-text');
      messageText.style.fontSize = fsize + 'px';
      messageText.style.fontFamily = resolveFontFamily(ctx.font);
      if (ctx.color) {
        messageText.style.color = String(ctx.color);
      }
      messageText.textContent = sourceText;
      textCol.appendChild(messageText);

      content.appendChild(textCol);

      entry.appendChild(skin);
      entry.appendChild(content);
      return entry;
    },

    onLoad(context) {
      const ctx = context || {};
      console.log('[Among Us Theme] Meeting overlay siap. Layout: ' + (ctx.layout || 'vertical')
        + ', anchor: ' + (ctx.pos || 'bottom-left')
        + ', crewmate pool: ' + unusedPool.length + '/16 tersisa');
    },

    onSpecialEvent(item, context) {
      console.log('[Among Us Theme] Special event: ' + (item && item.type), item);
    }
  };
})();
