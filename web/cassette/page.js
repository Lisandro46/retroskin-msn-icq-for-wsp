(() => {
  const equipment = {
    deck: { file: 'deck.png', alt: 'Interfaz de Retro Cassette con el deck 3D, estante de cassettes y librito abierto sobre la mesa. Biblioteca de demostración.' },
    portable: { file: 'portable.png', alt: 'Interfaz de Retro Cassette con el portátil azul en 3D, estante de cassettes y librito abierto. Biblioteca de demostración.' }
  };
  const image = document.getElementById('equipment-image');
  document.querySelectorAll('[data-equipment]').forEach(button => {
    button.addEventListener('click', () => {
      const shot = equipment[button.dataset.equipment];
      image.src = `/assets/cassette/${shot.file}`;
      image.alt = shot.alt;
      document.getElementById('full-capture').href = image.src;
      document.querySelectorAll('[data-equipment]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    });
  });
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const selectTab = tab => {
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
    });
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      selectTab(tabs[next]);
      tabs[next].focus();
    });
  });
  const ua = navigator.userAgent.toLowerCase();
  const platform = (navigator.userAgentData?.platform || navigator.platform || '').toLowerCase();
  const isMobile = /android|iphone|ipad|ipod/.test(ua) || (platform.includes('mac') && navigator.maxTouchPoints > 1);
  const isMac = !isMobile && platform.includes('mac');
  const isWindows = platform.includes('win');
  const main = document.getElementById('main-download');
  const note = document.getElementById('platform-note');
  if (isMac) {
    main.href = '#descargas';
    main.textContent = '↓ Descargar para Mac';
    selectTab(document.getElementById('tab-mac'));
    note.textContent = 'Mac en prueba · Apple Silicon e Intel · También para Windows';
  } else if (isMobile || !isWindows) {
    main.href = '#descargas';
    main.textContent = 'Ver descargas para computadora';
    note.textContent = 'Para Windows y Mac (en prueba). No hay versión para celular ni Linux.';
  }
  // Only an optional version label depends on GitHub. Downloads work without JavaScript.
  fetch('https://api.github.com/repos/Lisandro46/retro-cassette-descargas/releases/latest', { signal: AbortSignal.timeout(5000) })
    .then(response => response.ok ? response.json() : Promise.reject())
    .then(release => {
      if (!/^v?\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/.test(release.tag_name || '')) return;
      document.getElementById('release-version').textContent = `Versión ${release.tag_name.replace(/^v/, '')}`;
      document.getElementById('release-link').href = `https://github.com/Lisandro46/retro-cassette-descargas/releases/tag/${encodeURIComponent(release.tag_name)}`;
    })
    .catch(() => {});
})();
