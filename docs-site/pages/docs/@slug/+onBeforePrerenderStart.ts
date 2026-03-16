import type { OnBeforePrerenderStartAsync } from 'vike/types';
import { join } from 'node:path';
import { scanCategories, scanDocs } from '../../../server/utils/docs';

const onBeforePrerenderStart: OnBeforePrerenderStartAsync = async () => {
  const docsDir = join(process.cwd(), 'docs');
  const categories = await scanCategories(docsDir);
  const docs = await scanDocs(docsDir, categories);
  return docs.map((doc) => `/docs/${doc.slug}`);
};

export default onBeforePrerenderStart;
