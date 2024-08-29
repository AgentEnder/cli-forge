export function fromDashedToCamelCase(str: string) {
  return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
}

export function fromCamelOrDashedCaseToConstCase(str: string) {
  const parts = [];
  let currentPart = '';
  let prev: string | undefined;
  for (const char of str) {
    if (char === '-') {
      if (currentPart.length) {
        parts.push(currentPart);
      }
      currentPart = '';
      continue;
    }
    // Previous was lower case and current is upper case
    if (prev && prev?.toLowerCase() === prev && char === char.toUpperCase()) {
      parts.push(currentPart);
      currentPart = char;
      // Handle someCLITool -> SOME_CLI_TOOL
    } else if (
      prev?.toUpperCase() === prev &&
      char === char.toLowerCase() &&
      currentPart.length > 1
    ) {
      parts.push(currentPart.slice(0, -1));
      currentPart = currentPart.slice(-1) + char;
    } else {
      currentPart += char;
    }
    prev = char;
  }
  parts.push(currentPart);
  return parts.join('_').toUpperCase();
}

export function getEnvKey(prefix: string | undefined, key: string) {
  return prefix
    ? `${prefix}_${fromCamelOrDashedCaseToConstCase(key)}`
    : fromCamelOrDashedCaseToConstCase(key);
}
