(() => {
  const record = document.getElementById("technical-record");
  function hashTarget() {
    try { return document.getElementById(decodeURIComponent(location.hash.slice(1))); }
    catch { return null; }
  }
  function prepareRecord(target) {
    if (target && record?.contains(target)) record.open = true;
  }
  const startTarget = hashTarget();
  prepareRecord(startTarget);
  document.addEventListener("click", event => {
    const link = event.target.closest?.('a[href^="#"]');
    if (!link) return;
    prepareRecord(document.getElementById(link.hash.slice(1)));
  });
  window.addEventListener("hashchange", () => prepareRecord(hashTarget()));
  if (startTarget && record?.contains(startTarget))
    window.addEventListener("load", () => startTarget.scrollIntoView({block:"start"}), {once:true});

  const root = document.querySelector("[data-stage-switch]");
  if (!root) return;
  const tabs = [...root.querySelectorAll("[data-stage-link]")];
  const panels = tabs.map(tab => document.getElementById(tab.hash.slice(1)));
  if (panels.some(panel => !panel)) return;
  tabs[0].parentElement.setAttribute("role", "tablist");
  tabs.forEach((tab, index) => {
    tab.id = `production-tab-${index + 1}`;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", panels[index].id);
    panels[index].setAttribute("role", "tabpanel");
    panels[index].setAttribute("aria-labelledby", tab.id);
    panels[index].tabIndex = 0;
  });
  const activate = (index, focus = false) => {
    tabs.forEach((tab, i) => {
      tab.setAttribute("aria-selected", String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
    if (focus) tabs[index].focus();
  };
  function sync() {
    const index = panels.indexOf(hashTarget());
    if (index >= 0) activate(index);
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", event => {
      event.preventDefault();
      activate(i);
      if (location.hash !== tab.hash) history.replaceState(history.state, "", tab.hash);
    });
    tab.addEventListener("keydown", event => {
      let next = i;
      switch (event.key) {
        case "ArrowRight": next = (i + 1) % tabs.length; break;
        case "ArrowLeft": next = (i + tabs.length - 1) % tabs.length; break;
        case "Home": next = 0; break;
        case "End": next = tabs.length - 1; break;
        case " ": break;
        default: return;
      }
      event.preventDefault();
      activate(next, true);
      if (location.hash !== tabs[next].hash) history.replaceState(history.state, "", tabs[next].hash);
    });
  });
  activate(0);
  sync();
  window.addEventListener("hashchange", sync);
})();
