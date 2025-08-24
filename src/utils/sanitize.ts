import sanitizeHtml from 'sanitize-html';

export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove HTML tags and dangerous content
  const clean = sanitizeHtml(input, {
    allowedTags: [], // No HTML tags allowed
    allowedAttributes: {}, // No attributes allowed
    disallowedTagsMode: 'recursiveEscape'
  });

  // Trim whitespace
  return clean.trim();
};

export const sanitizeHtmlContent = (input: string, allowedTags: string[] = []): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Allow specific HTML tags for rich content (if needed)
  const clean = sanitizeHtml(input, {
    allowedTags: allowedTags,
    allowedAttributes: {
      'a': ['href', 'title'],
      'img': ['src', 'alt'],
      'strong': [],
      'em': [],
      'ul': [],
      'ol': [],
      'li': []
    },
    disallowedTagsMode: 'recursiveEscape'
  });

  return clean.trim();
};
