SWAPLANGUAGE PDF LINK - CHROME / EDGE EXTENSION

Install in Chrome:
1. Extract the ZIP to a permanent folder.
2. Open chrome://extensions in Chrome.
3. Enable Developer mode.
4. Click Load unpacked and choose the swaplanguage-pdf-link folder
   containing manifest.json.
5. Reload your SwapLanguage page. Sign in normally if needed.

For Edge, use edge://extensions and the same Load unpacked steps.

Use:
- Open a SwapLanguage lesson's file reader and select a document.
- A small panel at the bottom right displays the document's title.
- Click Open PDF to open the direct file in a new tab in that browser.
- Use the browser's PDF download button or Ctrl+S to save it.
- Selecting another document updates the link. Previously seen documents
  can use their remembered link without another request.

How it works:
The reader loads each PDF from:
https://app.swaplanguage.com/api/file-reader/<document UUID>/bytes
The extension observes those resource URLs and matches them to document
selections. No lesson or document IDs are hardcoded. It does not change
requests, read cookies, inspect PDF contents, or send data anywhere.
Links are held only in memory for the current page and lesson.

Scope and limitations:
- Only https://app.swaplanguage.com is matched by the extension.
- It adds a panel only at /users/file-reader.
- Authentication is provided by your normal browser session.
- Install and reload the reader before using it. If there is no link,
  reload and select the document again.
- The extension depends on the endpoint and document-row classes observed
  in October 2026. A site redesign may require an update.
- This is a direct-link helper, not an automatic PDF downloader.
- Rapid selection changes are matched by request start time to avoid
  using a late response for the wrong document. An unrecognized change
  waits for a new request instead of guessing.

Validation:
Tracking logic and the UI were tested with simulated document loading,
selection changes, cached selections, and late responses. Live installation
in Chrome has not been performed in this chat.

Reference:
https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts
https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver/observe
