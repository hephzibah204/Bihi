// utils/sanitizeHtml.ts
// Lightweight HTML sanitizer with a conservative allowlist.
// In browsers, you can swap to DOMPurify by importing it and delegating.

const ALLOWED_TAGS = new Set([
  'h1','h2','h3','h4','h5','h6',
  'p','br','strong','b','em','i','u','small','sub','sup','code','pre',
  'ul','ol','li','dl','dt','dd',
  'table','thead','tbody','tfoot','tr','th','td',
  'blockquote','hr','div','span','section','article'
]);
const ALLOWED_ATTRS = new Set(['colspan','rowspan','scope','style']); // keep minimal; style is sanitized

function stripEventHandlers(el: Element) {
  // Remove on* handlers and javascript: URLs
  [...el.getAttributeNames()].forEach((name) => {
    const val = el.getAttribute(name) || '';
    if (name.toLowerCase().startsWith('on')) el.removeAttribute(name);
    if (/^javascript:/i.test(val)) el.removeAttribute(name);
    if (!ALLOWED_ATTRS.has(name.toLowerCase())) {
      // allow data-*, aria-* attributes
      if (!/^data-/.test(name) && !/^aria-/.test(name)) el.removeAttribute(name);
    }
    if (name.toLowerCase() === 'style') {
      // very conservative: keep only basic text styles
      const safe = (val || '').replace(/position|fixed|absolute|z-index|url\(/gi, '');
      el.setAttribute('style', safe);
    }
  });
}

export function sanitizeHtml(input: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(String(input || ''), 'text/html');
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    const toRemove: Element[] = [];
    // Remove script/style and disallowed tags
    doc.querySelectorAll('script,style,iframe,object,embed,link,meta').forEach((n) => n.remove());
    let node: Node | null = walker.nextNode();
    while (node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        if (!ALLOWED_TAGS.has(el.tagName.toLowerCase())) {
          toRemove.push(el);
        } else {
          stripEventHandlers(el);
        }
      }
      node = walker.nextNode();
    }
    toRemove.forEach((el) => el.replaceWith(...Array.from(el.childNodes)));
    return doc.body.innerHTML || '';
  } catch {
    return String(input || '');
  }
}

export default sanitizeHtml;
