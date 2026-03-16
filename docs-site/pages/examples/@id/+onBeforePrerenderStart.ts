import type { OnBeforePrerenderStartAsync } from 'vike/types';
import { loadExamples } from '../../../server/utils/examples';

const onBeforePrerenderStart: OnBeforePrerenderStartAsync = async () => {
  const { siteExamples } = await loadExamples();
  return siteExamples.map((ex) => `/examples/${ex.id}`);
};

export default onBeforePrerenderStart;
