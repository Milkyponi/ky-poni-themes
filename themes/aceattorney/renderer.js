/**
 * KY-Poni - Ace Attorney Courtroom Theme Renderer
 * Kontrak tema standar: window.KYPoniTheme = { renderMessage, onLoad, onSpecialEvent }
 *
 * Ciri khas:
 * - Nameplate 3-slice PNG original (cap kiri 17px / mid repeat-x / cap kanan 17px).
 * - Dialogue box dari strip atas + tile 32x32 seamless + strip bawah (Asset-First).
 * - Tier lebar sadar `fsize` (tier-1 .. tier-4) mengikuti pola persona3reload.
 * - TANPA animasi: animasi masuk/keluar milik core (overlay_transitions.css v1.3.1+).
 *
 * Keamanan teks: seluruh isi pesan dipasang lewat `textContent`, bukan innerHTML.
 * `rawText` dipakai lebih dulu supaya `&` dan `<` tampil apa adanya (tanpa
 * double-escape warisan `message` yang sudah di-escape di batas sistem).
 */

(function () {
  'use strict';

  const DEFAULT_FONT_STACK = "'P052', 'Noto Serif', Georgia, serif";

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
    return "'" + name.replace(/'/g, '') + "', 'Noto Serif', Georgia, serif";
  }

  window.KYPoniTheme = {
    renderMessage(item, context) {
      const ctx = context || {};
      const isSuperChat = item.type === 'superchat';
      const isMembership = item.type === 'membership';

      // Sumber teks: rawText (mentah) lebih dulu, fallback message (di-decode).
      const sourceText = (item.rawText !== undefined && item.rawText !== null)
        ? String(item.rawText)
        : decodeEntities(String(item.message || ''));
      const chatText = sourceText;
      const rawLength = chatText.length;
      const newlineCount = (chatText.match(/\n/g) || []).length;

      const fsize = (ctx && Number(ctx.fsize) > 0) ? Number(ctx.fsize) : 16;
      const fontFactor = Math.max(1, fsize / 16);
      const badgeBonus = (isSuperChat ? 24 : 0) + (isMembership ? 22 : 0);
      const effectiveLength = Math.round(rawLength * fontFactor) + badgeBonus;

      // 4-Tier Dynamic Width (sadar fsize). Ambang dikalibrasi ke lebar
      // 460/540/620/680 px supaya 200 karakter @20px tetap tier-3 dan
      // 350 karakter @20px naik ke tier-4.
      let tierClass = 'tier-1';
      if (effectiveLength > 400 || newlineCount >= 3) {
        tierClass = 'tier-4';
      } else if (effectiveLength > 175 || newlineCount >= 2) {
        tierClass = 'tier-3';
      } else if (effectiveLength > 55 || newlineCount >= 1 || isSuperChat || isMembership) {
        tierClass = 'tier-2';
      }

      const entry = document.createElement('div');
      entry.className = 'chat-entry ' + tierClass
        + (isSuperChat ? ' is-superchat' : '')
        + (isMembership ? ' is-membership' : '');
      entry.id = 'msg-' + item.id;

      const box = document.createElement('div');
      box.className = 'aa-dialogue-box';

      // A. Skin: strip atas + tile tengah seamless + strip bawah
      const skin = document.createElement('div');
      skin.className = 'aa-box-skin';
      const top = document.createElement('div');
      top.className = 'aa-box-top';
      const mid = document.createElement('div');
      mid.className = 'aa-box-mid';
      const bot = document.createElement('div');
      bot.className = 'aa-box-bot';
      skin.appendChild(top);
      skin.appendChild(mid);
      skin.appendChild(bot);
      box.appendChild(skin);

      // B. Nameplate + badge
      const topBar = document.createElement('div');
      topBar.className = 'aa-top-bar';

      const nameplate = document.createElement('div');
      nameplate.className = 'aa-nameplate';

      const npLeft = document.createElement('div');
      npLeft.className = 'aa-np-left';

      const npMid = document.createElement('div');
      npMid.className = 'aa-np-mid';

      const authorName = document.createElement('span');
      authorName.className = 'aa-author-name';
      const author = (item.author && item.author.name) ? String(item.author.name) : '';
      authorName.textContent = author.trim() ? author : 'Viewer';
      npMid.appendChild(authorName);

      const npRight = document.createElement('div');
      npRight.className = 'aa-np-right';

      nameplate.appendChild(npLeft);
      nameplate.appendChild(npMid);
      nameplate.appendChild(npRight);
      topBar.appendChild(nameplate);

      if (isSuperChat) {
        const badge = document.createElement('span');
        badge.className = 'aa-badge aa-badge-superchat';
        badge.textContent = (item.superchat && item.superchat.amount) ? String(item.superchat.amount) : 'SUPER CHAT';
        topBar.appendChild(badge);
      } else if (isMembership) {
        const badge = document.createElement('span');
        badge.className = 'aa-badge aa-badge-member';
        badge.textContent = 'NEW MEMBER';
        topBar.appendChild(badge);
      }

      box.appendChild(topBar);

      // C. Isi pesan (textContent murni, zero XSS)
      const messageBox = document.createElement('div');
      messageBox.className = 'aa-message-box';

      const messageText = document.createElement('div');
      messageText.className = 'aa-message-text';
      messageText.style.fontSize = fsize + 'px';
      messageText.style.fontFamily = resolveFontFamily(ctx.font);
      if (ctx.color) {
        messageText.style.color = String(ctx.color);
      }
      messageText.textContent = chatText;
      messageBox.appendChild(messageText);
      box.appendChild(messageBox);

      // D. Chevron sudut kanan bawah
      const chevron = document.createElement('div');
      chevron.className = 'aa-chevron';
      box.appendChild(chevron);

      entry.appendChild(box);
      return entry;
    },

    onLoad(context) {
      const ctx = context || {};
      console.log('[Ace Attorney Theme] Courtroom overlay siap. Layout: ' + (ctx.layout || 'vertical')
        + ', anchor: ' + (ctx.pos || 'bottom-left'));
    },

    onSpecialEvent(item, context) {
      console.log('[Ace Attorney Theme] Special event: ' + (item && item.type), item);
    }
  };
})();
