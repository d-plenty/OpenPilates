// Light or dark. Loaded before the page paints so there is no flash of the wrong one.
// The choice ('light', 'dark' or 'auto' to follow the device) is kept in this browser.
(function () {
  var KEY = 'op.theme';
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function choice() { try { return localStorage.getItem(KEY) || 'auto'; } catch (e) { return 'auto'; } }
  function apply() {
    var c = choice();
    var dark = c === 'dark' || (c === 'auto' && mq && mq.matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    var meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.setAttribute('content', dark ? '#111715' : '#0F6E62');
  }
  window.opTheme = {
    get: choice,
    set: function (c) { try { localStorage.setItem(KEY, c); } catch (e) { /* private mode */ } apply(); },
    isDark: function () { return document.documentElement.getAttribute('data-theme') === 'dark'; }
  };
  if (mq && mq.addEventListener) mq.addEventListener('change', apply);
  apply();
})();
