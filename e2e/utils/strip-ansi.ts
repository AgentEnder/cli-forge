/**
 * Minimal virtual-terminal renderer.
 *
 * Processes a string containing ANSI escape sequences and reconstructs
 * the final screen content — what a user would actually see in their
 * terminal after all cursor movements and erasures have been applied.
 */
export function renderTerminalOutput(raw: string): string {
  const lines: string[] = [''];
  let row = 0;
  let col = 0;

  let i = 0;
  while (i < raw.length) {
    const ch = raw[i];

    // --- ANSI CSI escape: \x1b[ ... <letter> ---
    if (ch === '\x1b' && raw[i + 1] === '[') {
      i += 2; // skip \x1b[
      let param = '';
      while (i < raw.length && /[0-9;?]/.test(raw[i])) {
        param += raw[i];
        i++;
      }
      const cmd = raw[i] ?? '';
      i++;

      const n = parseInt(param, 10) || 1;

      switch (cmd) {
        case 'A': // cursor up
          row = Math.max(0, row - n);
          break;
        case 'B': // cursor down
          row += n;
          while (lines.length <= row) lines.push('');
          break;
        case 'C': // cursor forward
          col += n;
          break;
        case 'D': // cursor back
          col = Math.max(0, col - n);
          break;
        case 'G': // cursor to column (1-based, default 1)
          col = (parseInt(param, 10) || 1) - 1;
          break;
        case 'J': {
          // erase in display
          const mode = parseInt(param, 10) || 0;
          if (mode === 0) {
            // erase from cursor to end of screen
            lines[row] = lines[row].substring(0, col);
            lines.length = row + 1;
          } else if (mode === 2) {
            // erase entire screen
            lines.length = 0;
            lines.push('');
            row = 0;
            col = 0;
          }
          break;
        }
        case 'K': {
          // erase in line
          const kMode = parseInt(param, 10) || 0;
          if (kMode === 0) {
            // erase from cursor to end of line
            lines[row] = lines[row].substring(0, col);
          } else if (kMode === 2) {
            // erase entire line
            lines[row] = '';
            col = 0;
          }
          break;
        }
        case 'h': // set mode (e.g. ?25h show cursor) — ignore
        case 'l': // reset mode (e.g. ?25l hide cursor) — ignore
          break;
        default:
          // Unknown sequence — skip
          break;
      }
      continue;
    }

    // --- Regular characters ---
    if (ch === '\n') {
      row++;
      col = 0;
      while (lines.length <= row) lines.push('');
    } else if (ch === '\r') {
      col = 0;
    } else {
      while (lines.length <= row) lines.push('');
      // Expand line to reach current column
      while (lines[row].length < col) lines[row] += ' ';
      // Overwrite character at position
      lines[row] =
        lines[row].substring(0, col) + ch + lines[row].substring(col + 1);
      col++;
    }
    i++;
  }

  // Trim trailing empty lines and trailing whitespace per line
  return lines
    .map((l) => l.trimEnd())
    .join('\n')
    .replace(/\n+$/, '\n');
}
