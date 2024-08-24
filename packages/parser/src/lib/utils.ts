export function fromDashedToCamelCase(str: string) {
  return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
}
