/**
 * KY-Poni - Cyberpunk 2077 Night City HUD Theme Renderer Plugin
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
      box.className = 'cp-hud-box';

      // 1. Cyberpunk Header Bar
      const header = document.createElement('div');
      header.className = 'cp-header';

      const authorWrapper = document.createElement('div');
      authorWrapper.className = 'cp-author-wrapper';

      const holoTag = document.createElement('span');
      holoTag.className = 'cp-holo-tag';
      holoTag.textContent = '// COMMS //';
      authorWrapper.appendChild(holoTag);

      const name = document.createElement('span');
      name.className = 'cp-author-name';
      name.textContent = (item.author && item.author.name) || 'CHOOMBA';
      authorWrapper.appendChild(name);

      header.appendChild(authorWrapper);

      if (item.type === 'superchat' && item.superchat) {
        const scBadge = document.createElement('span');
        scBadge.className = 'cp-badge-superchat';
        scBadge.textContent = `★ ${escapeText(item.superchat.amount)} ED`;
        header.appendChild(scBadge);
      } else if (item.type === 'membership') {
        const memBadge = document.createElement('span');
        memBadge.className = 'cp-badge-member';
        memBadge.textContent = 'NETRUNNER';
        header.appendChild(memBadge);
      }

      box.appendChild(header);

      // 2. Message Body
      const body = document.createElement('div');
      body.className = 'cp-message-body';

      const fsize = context && context.fsize;
      if (fsize && fsize > 0) {
        body.style.fontSize = `${fsize}px`;
      }

      body.innerHTML = item.message || '';
      box.appendChild(body);

      entry.appendChild(box);
      return entry;
    },

    onLoad(context) {
      console.log('[Cyberpunk Theme] Initialized with layout:', context.layout);
    }
  };
})();
