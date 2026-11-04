/**
 * KY-Poni - Undertale Retro Box Theme Renderer Plugin
 * Implements Standard Theme Plugin Contract (THEME_SPEC.md).
 */

(function () {
  function escapeText(text) {
    const div = document.createElement('div');
    div.innerText = text || '';
    return div.innerHTML;
  }

  window.KYPoniTheme = {
    renderMessage(item, context) {
      const entry = document.createElement('div');
      entry.className = `chat-entry ${item.type === 'superchat' ? 'is-superchat' : ''} ${item.type === 'membership' ? 'is-membership' : ''}`;
      entry.id = `msg-${item.id}`;

      const box = document.createElement('div');
      box.className = 'ut-dialogue-box';

      // 1. Header with Soul Icon & Author
      const header = document.createElement('div');
      header.className = 'ut-header';

      const soul = document.createElement('span');
      soul.className = 'ut-soul-icon';
      header.appendChild(soul);

      const name = document.createElement('span');
      name.className = 'ut-author-name';
      name.textContent = (item.author && item.author.name) || 'HUMAN';
      header.appendChild(name);

      if (item.type === 'superchat' && item.superchat) {
        const scBadge = document.createElement('span');
        scBadge.className = 'ut-badge-superchat';
        scBadge.textContent = item.superchat.amount;
        header.appendChild(scBadge);
      } else if (item.type === 'membership') {
        const memBadge = document.createElement('span');
        memBadge.className = 'ut-badge-member';
        memBadge.textContent = 'NEW MEMBER';
        header.appendChild(memBadge);
      }

      box.appendChild(header);

      // 2. Message Body with Undertale Asterisk
      const body = document.createElement('div');
      body.className = 'ut-message-body';

      const fsize = context && context.fsize;
      if (fsize && fsize > 0) {
        body.style.fontSize = `${fsize}px`;
      }

      body.innerHTML = `<span class="ut-asterisk">*</span>${item.message || ''}`;
      box.appendChild(body);

      entry.appendChild(box);
      return entry;
    },

    onLoad(context) {
      console.log('[Undertale Theme] Initialized with layout:', context.layout);
    }
  };
})();
