/* Shared tracking logic. No network requests, credentials, or persistent storage. */
(() => {
  "use strict";
  const origin = "https://app.swaplanguage.com";
  const pathPattern = /^\/api\/file-reader\/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\/bytes$/i;
  function pdfURL(value) {
    try {
      const url = new URL(value);
      if (url.origin !== origin || !pathPattern.test(url.pathname) || url.search || url.hash) return null;
      return url.href;
    } catch { return null; }
  }

  class Tracker {
    constructor() {
      this.history = [];
      this.links = new Map();
      this.current = "";
    }
    select(key, time) {
      if (!key || key === this.current) return;
      this.current = key;
      this.history.push({ key, time });
    }
    record(entry) {
      const url = pdfURL(entry.name);
      if (!url || !Number.isFinite(entry.startTime)) return;
      if (entry.responseStatus && (entry.responseStatus < 200 || entry.responseStatus >= 300)) return;
      // Attribute requests by their START, so a late response cannot replace
      // the link for a different document selected in the meantime.
      const selection = this.history.findLast(item => item.time <= entry.startTime);
      if (!selection) return;
      const previous = this.links.get(selection.key);
      if (!previous || entry.startTime >= previous.time) {
        this.links.set(selection.key, { url, time: entry.startTime });
      }
    }
    get url() { return this.links.get(this.current)?.url || null; }
  }
  globalThis.SwapPDF = Object.freeze({ pdfURL, Tracker });
})();
