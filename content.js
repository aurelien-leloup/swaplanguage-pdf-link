(() => {
  "use strict";
  const { Tracker, pdfURL } = globalThis.SwapPDF;
  let tracker = new Tracker();
  let context = "";
  let contextStart = -Infinity;
  let pending = [];
  let host;
  let link;
  let status;
  let title;
  let queued = false;
  let awaitingSelection = false;

  const normalize = value => (value || "").normalize("NFC").replace(/\s+/g, " ").trim();
  function pageContext() {
    return location.pathname === "/users/file-reader" ? location.pathname + location.search : "";
  }
  function syncContext() {
    const next = pageContext();
    if (next === context) return;
    // Preserve requests preceding initial DOM creation; discard requests from
    // an earlier lesson when navigation happens inside the single-page app.
    contextStart = context ? performance.now() : contextStart;
    context = next;
    tracker = new Tracker();
    awaitingSelection = false;
    pending = pending.filter(entry => entry.startTime >= contextStart);
  }
  function activeTitle() {
    return normalize(document.querySelector("button.document-row--active")?.textContent);
  }
  function ensurePanel() {
    if (host?.isConnected || !document.body) return;
    host = document.createElement("div");
    host.id = "swaplanguage-pdf-link-extension";
    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <style>
        :host { all: initial; position: fixed; bottom: 20px; right: 20px; z-index: 2147483647; }
        :host([hidden]) { display: none; }
        section { font: 14px/1.4 system-ui, sans-serif; color: #183029; background: #fff;
          border: 1px solid #d8e2de; border-radius: 14px; box-shadow: 0 4px 24px #0002;
          padding: 16px; width: min(290px, calc(100vw - 72px)); }
        strong { display: block; font-size: 15px; }
        p { margin: 8px 0 12px; overflow-wrap: anywhere; }
        a { display: block; text-align: center; padding: 10px 14px; border-radius: 8px;
          background: #17664e; color: white; text-decoration: none; font-weight: 650; }
        a:hover { background: #114c3a; }
        a:focus-visible { outline: 3px solid #dc8d30; outline-offset: 3px; }
        a[hidden] { display: none; }
        small { display: block; margin-top: 10px; color: #53675f; }
      </style>
      <section aria-label="SwapLanguage PDF link">
        <strong>SwapLanguage PDF</strong>
        <p id="title"></p>
        <a hidden target="_blank" rel="noopener noreferrer">Open PDF ↗</a>
        <small role="status" aria-live="polite"></small>
      </section>`;
    title = shadow.querySelector("#title");
    link = shadow.querySelector("a");
    status = shadow.querySelector("small");
    document.body.append(host);
  }
  function render() {
    queued = false;
    syncContext();
    if (!context) {
      if (host) host.hidden = true;
      return;
    }
    const selected = activeTitle();
    if (selected === tracker.current) awaitingSelection = false;
    if (!awaitingSelection && selected && selected !== tracker.current) {
      // Initial requests may begin before the document row exists.
      // Later programmatic changes wait for a fresh request rather than
      // guessing which old request belongs to the new selection.
      tracker.select(selected, tracker.history.length ? performance.now() : contextStart);
    }
    if (tracker.current) {
      pending.forEach(entry => tracker.record(entry));
      pending = [];
    }
    ensurePanel();
    if (!host) return;
    host.hidden = false;
    const url = selected === tracker.current ? tracker.url : null;
    const text = (awaitingSelection ? tracker.current : selected) || "Select a document in the reader.";
    if (title.textContent !== text) title.textContent = text;
    link.hidden = !url;
    if (url) link.href = url;
    else link.removeAttribute("href");
    const hint = url
      ? "Opens in this signed-in browser. Use the PDF viewer to save it."
      : "Waiting for the PDF. If needed, reload this page and select the document again.";
    if (status.textContent !== hint) status.textContent = hint;
  }
  function schedule() {
    if (!queued) {
      queued = true;
      queueMicrotask(render);
    }
  }
  // Capture selection before the site's click handler starts its request.
  document.addEventListener("click", event => {
    const row = event.target instanceof Element ? event.target.closest("button.document-row") : null;
    if (!row || !pageContext()) return;
    syncContext();
    tracker.select(normalize(row.textContent), performance.now());
    awaitingSelection = activeTitle() !== tracker.current;
    // Immediately hide a link for the previously selected document.
    if (link) { link.hidden = true; link.removeAttribute("href"); }
    schedule();
  }, true);

  function capture(entries) {
    syncContext();
    if (!context) return;
    for (const entry of entries) {
      if (entry.startTime >= contextStart && pdfURL(entry.name)) {
        pending.push({ name: entry.name, startTime: entry.startTime, responseStatus: entry.responseStatus });
      }
    }
    schedule();
  }
  const resources = new PerformanceObserver(list => capture(list.getEntries()));
  resources.observe({ type: "resource", buffered: true });
  const mutations = new MutationObserver(records => {
    // Our own panel must not create a render loop.
    if (records.some(record => record.target !== host && !host?.contains(record.target))) schedule();
  });
  mutations.observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  window.addEventListener("popstate", schedule);
  window.addEventListener("pageshow", schedule);
  schedule();
})();
