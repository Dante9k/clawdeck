const tabs = [...document.querySelectorAll('[role="tab"]')];
function activate(tab) {
  for (const item of tabs) {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.dataset.tab).hidden = !selected;
  }
}
for (const tab of tabs) {
  tab.addEventListener('click', () => activate(tab));
  tab.addEventListener('keydown', (event) => {
    const index = tabs.indexOf(tab);
    const next = {
      ArrowRight: (index + 1) % tabs.length,
      ArrowLeft: (index + tabs.length - 1) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    activate(tabs[next]);
    tabs[next].focus();
  });
}
const copy = document.querySelector('[data-copy]');
copy.addEventListener('click', async () => {
  const status = document.querySelector('.copy-status');
  try {
    await navigator.clipboard.writeText(document.querySelector('#install-command').textContent);
    status.textContent = copy.dataset.copied;
  } catch {
    status.textContent = copy.dataset.failed;
  }
});
