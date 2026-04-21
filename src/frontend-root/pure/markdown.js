function toMarkdownScalar(value, fallback) {
  const clean = String(value == null ? '' : value)
    .replace(/\r\n?/g, ' ')
    .replace(/\n/g, ' ')
    .trim();

  if (!clean) {
    return fallback;
  }

  return clean;
}

module.exports = {
  toMarkdownScalar
};
