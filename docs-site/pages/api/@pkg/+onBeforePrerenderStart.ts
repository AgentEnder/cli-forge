import type { OnBeforePrerenderStartAsync } from 'vike/types';
import { scanPackages } from '../../../server/utils/packages';

const onBeforePrerenderStart: OnBeforePrerenderStartAsync = async () => {
  const packages = await scanPackages();
  return packages.map((pkg) => `/api/${pkg.dirName}`);
};

export default onBeforePrerenderStart;
