// utils/sanitize.ts
// Wrapper for safe HTML sanitization. Delegates to our internal sanitizer.
// If you decide to use DOMPurify later, you can swap the implementation here.

import sanitizeHtml from './sanitizeHtml';

export const safeHtml = (value?: string | null): string => {
  return sanitizeHtml(value || '');
};

export default safeHtml;