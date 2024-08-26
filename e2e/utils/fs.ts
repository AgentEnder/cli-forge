import { existsSync } from 'fs';

export function checkFilesExist(files: string[]) {
  const missingFiles = files.filter((file) => !existsSync(file));
  if (missingFiles.length) {
    throw new Error(`Missing files: ${missingFiles.join(', ')}`);
  }
}
