/**
 * Parse value strings like "$2.2M/s" to numeric values
 * Supports: K (thousand), M (million), B (billion)
 */
function parseValue(valueString) {
  if (!valueString || typeof valueString !== 'string') {
    return 0;
  }

  // Remove "$" and "/s" suffix
  const cleaned = valueString.replace(/^\$/, '').replace(/\/s$/, '').trim();
  
  // Extract number and suffix
  const match = cleaned.match(/^([\d.]+)([KMB])?$/i);
  
  if (!match) {
    return 0;
  }

  const number = parseFloat(match[1]);
  const suffix = (match[2] || '').toUpperCase();

  let multiplier = 1;
  switch (suffix) {
    case 'K':
      multiplier = 1000;
      break;
    case 'M':
      multiplier = 1000000;
      break;
    case 'B':
      multiplier = 1000000000;
      break;
    default:
      multiplier = 1;
  }

  return Math.floor(number * multiplier);
}

/**
 * Format numeric values back into Discord-friendly strings.
 */
function formatValue(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '$0/s';
  }

  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(1)}B/s`;
  }
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M/s`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K/s`;
  }
  return `$${value}/s`;
}

module.exports = { parseValue, formatValue };

