const PRODUCT_CONTEXT_PREFIX = '__MBV_PRODUCT_CONTEXT__';

export const parseProductMessage = (content) => {
  if (typeof content !== 'string') {
    return { product: null, text: content ?? '' };
  }

  if (content.startsWith(PRODUCT_CONTEXT_PREFIX)) {
    const separatorIndex = content.indexOf('\n');
    const metadataText = separatorIndex >= 0
      ? content.slice(PRODUCT_CONTEXT_PREFIX.length, separatorIndex)
      : content.slice(PRODUCT_CONTEXT_PREFIX.length);
    const text = separatorIndex >= 0 ? content.slice(separatorIndex + 1) : '';

    try {
      return {
        product: JSON.parse(metadataText),
        text,
      };
    } catch (error) {
      return { product: null, text: text || content };
    }
  }

  const legacyMatch = content.match(/^Consulta sobre producto: (.+)\n([\s\S]+)$/);

  if (legacyMatch) {
    return {
      product: { name: legacyMatch[1] },
      text: legacyMatch[2],
    };
  }

  return { product: null, text: content };
};

export const getChatPreviewText = (content) => {
  const { text } = parseProductMessage(content);
  const preview = String(text ?? '').trim();
  return preview || 'Consulta sobre producto';
};

export { PRODUCT_CONTEXT_PREFIX };
