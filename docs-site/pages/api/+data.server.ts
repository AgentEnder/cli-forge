import type { PageContextServer } from 'vike/types';
import type { PackageInfo } from '../../server/utils/packages.js';

export type ApiData = { packages: PackageInfo[] };

export function data(pageContext: PageContextServer): ApiData {
  const packagesMap = pageContext.globalContext.packages;
  const packages = Object.values(packagesMap).sort((a, b) =>
    a.dirName.localeCompare(b.dirName)
  );
  return { packages };
}
