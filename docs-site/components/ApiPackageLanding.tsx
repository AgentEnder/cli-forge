import React from 'react';
import type { ApiExportKind, ApiPackage } from 'vike-plugin-typedoc';
import { Link } from './Link.js';

export interface ApiPackageLandingProps {
  apiPackage: ApiPackage;
}

const KIND_ORDER: Record<ApiExportKind, number> = {
  function: 0,
  class: 1,
  interface: 2,
  type: 3,
  enum: 4,
  variable: 5,
};

const KIND_LABELS: Record<ApiExportKind, string> = {
  function: 'Functions',
  class: 'Classes',
  interface: 'Interfaces',
  type: 'Types',
  enum: 'Enums',
  variable: 'Variables',
};

export function ApiPackageLanding({ apiPackage }: ApiPackageLandingProps) {
  // Group exports by kind
  const byKind = new Map<ApiExportKind, typeof apiPackage.exports>();
  for (const exp of apiPackage.exports) {
    const existing = byKind.get(exp.kind);
    if (existing) {
      existing.push(exp);
    } else {
      byKind.set(exp.kind, [exp]);
    }
  }

  const sortedKinds = Array.from(byKind.keys()).sort(
    (a, b) => KIND_ORDER[a] - KIND_ORDER[b]
  );

  return (
    <div>
      {apiPackage.exports.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-100 mb-4 tracking-wider">
            API EXPORTS
          </h2>

          {sortedKinds.map((kind) => {
            const exports = byKind.get(kind) ?? [];
            return (
              <div key={kind} className="mb-6">
                <h3 className="text-sm font-semibold text-gray-400 mb-2 tracking-wider uppercase">
                  {KIND_LABELS[kind]}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {exports.map((exp) => (
                    <Link
                      key={exp.slug}
                      href={exp.path}
                      className="block p-3 border border-gray-700 rounded hover:bg-gray-800/50 hover:border-gray-600 transition-colors no-underline"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-sm font-mono text-gray-200">
                          {exp.name}
                        </code>
                        <span className="text-[10px] text-gray-500 tracking-wider uppercase">
                          {exp.kind}
                        </span>
                      </div>
                      {exp.description && (
                        <p className="text-xs text-gray-400 line-clamp-2">
                          {exp.description}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
