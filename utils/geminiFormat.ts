// utils/geminiFormat.ts
// Minimal formatter to convert Gemini/Markdown-style text to sanitized HTML
// Handles headings, bold, italics, code, lists, blockquotes, and paragraphs.

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatInline(text: string): string {
  // Inline code: `code`
  text = text.replace(/`([^`]+)`/g, (_m, p1) => `<code>${escapeHtml(p1)}</code>`);
  // Bold: **text**
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Italic: _text_ or *text*
  text = text.replace(/(^|\W)_([^_]+)_(?=\W|$)/g, '$1<em>$2</em>');
  text = text.replace(/(^|\W)\*([^*]+)\*(?=\W|$)/g, '$1<em>$2</em>');
  return text;
}

function formatBlocks(src: string): string {
  const lines = String(src || '').split(/\r?\n/);
  const out: string[] = [];
  let i = 0;

  function flushParagraph(buf: string[]) {
    if (!buf.length) return;
    const text = buf.join(' ').trim();
    if (text) out.push(`<p>${formatInline(text)}</p>`);
    buf.length = 0;
  }

  while (i < lines.length) {
    // Code block ```
    if (/^```/.test(lines[i])) {
      const lang = lines[i].slice(3).trim();
      i++;
      const code: string[] = [];
      while (i < lines.length && !/^```/.test(lines[i])) { code.push(lines[i++]); }
      if (i < lines.length && /^```/.test(lines[i])) i++;
      out.push(`<pre><code${lang ? ` data-lang="${escapeHtml(lang)}"` : ''}>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }

    // Headings
    const h = lines[i].match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      out.push(`<h${level}>${formatInline(h[2].trim())}</h${level}>`);
      i++;
      continue;
    }

    // Blockquote
    if (/^>\s*/.test(lines[i])) {
      const quote: string[] = [];
      while (i < lines.length && /^>\s*/.test(lines[i])) {
        quote.push(lines[i].replace(/^>\s*/, ''));
        i++;
      }
      out.push(`<blockquote>${formatInline(quote.join(' ').trim())}</blockquote>`);
      continue;
    }

    // Unordered list
    if (/^\s*[-*]\s+/.test(lines[i])) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
        i++;
      }
      out.push(`<ul>${items.map(it => `<li>${formatInline(it.trim())}</li>`).join('')}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(lines[i])) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      out.push(`<ol>${items.map(it => `<li>${formatInline(it.trim())}</li>`).join('')}</ol>`);
      continue;
    }

    // Paragraph accumulation
    const p: string[] = [];
    while (i < lines.length && lines[i].trim() !== '') {
      p.push(lines[i++]);
    }
    flushParagraph(p);
    // Skip blank line
    while (i < lines.length && lines[i].trim() === '') i++;
  }

  return out.join('\n');
}

export function geminiToHtml(text: string): string {
  try { return formatBlocks(text); } catch { return escapeHtml(String(text || '')); }
}

export default geminiToHtml;
