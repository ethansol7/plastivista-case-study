document.querySelectorAll('[role="tablist"]').forEach(group => {
  const tabs = [...group.querySelectorAll('[role="tab"]')];
  function selectView(tab) {
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(item.getAttribute('aria-controls'));
      panel.hidden = !selected;
      if (!selected) panel.querySelectorAll('video').forEach(video => video.pause());
    });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectView(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      selectView(tabs[next]);
      tabs[next].focus({preventScroll:true});
    });
  });
});
const viewer = document.querySelector('.image-viewer');
const viewerImage = viewer.querySelector('img');
const framed = window.self !== window.top;
if (framed) document.documentElement.classList.add('is-embedded');
let sourceButton;
const heroLink = document.querySelector('.hero-image');
const phoneMedia = matchMedia('(max-width: 600px)');
function updateHeroLink() {
  heroLink.href = phoneMedia.matches ? 'image.html?view=portrait' : 'image.html?view=exhibition';
  heroLink.dataset.image = phoneMedia.matches ? 'assets/system-portrait.webp' : 'assets/exhibition-2600.webp';
}
updateHeroLink();
phoneMedia.addEventListener('change', updateHeroLink);
document.querySelectorAll('[data-enlarge]').forEach(button => {
  if (framed) button.setAttribute('aria-label', `${button.getAttribute('aria-label')}, opens in a new tab`);
  button.addEventListener('click', event => {
    if (framed || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    sourceButton = button;
    const source = button.querySelector('img');
    const isPortrait = button.classList.contains('hero-image') && phoneMedia.matches;
    viewerImage.src = button.dataset.image;
    viewerImage.alt = isPortrait ? 'Ethan beside the PlastiVista shredder and Sol lamps.' : source.alt;
    viewer.showModal();
  });
});
viewer.querySelector('.close-viewer').addEventListener('click', () => viewer.close());
viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
viewer.addEventListener('close', () => sourceButton?.focus({preventScroll:true}));
document.querySelectorAll('[data-play]').forEach(button => {
  const video = document.getElementById(button.dataset.play);
  button.addEventListener('click', () => {
    video.play().then(() => { button.hidden = true; video.focus(); }).catch(() => {
      button.hidden = true;
      video.focus();
    });
  });
  video.addEventListener('playing', () => { button.hidden = true; });
});
