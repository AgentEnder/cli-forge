import type { LinkedApiExport } from 'vike-plugin-typedoc';
import { Link } from './Link';

export interface ApiExportPageProps {
  apiExport: LinkedApiExport;
  /** Link back to the package page */
  packagePath?: string;
  /** Package display name */
  packageName?: string;
}

/** Renders a type string as HTML (with links) or plain text fallback */
function TypeText({ html, text }: { html?: string; text: string }) {
  if (html && html !== text) {
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  }
  return <>{text}</>;
}

export function ApiExportPage({
  apiExport,
  packagePath,
  packageName,
}: ApiExportPageProps) {
  return (
    <div>
      {/* Breadcrumb */}
      {packagePath && (
        <nav className="text-xs uppercase tracking-wider text-forge-ash-dim mb-4 flex items-center gap-2">
          <Link
            href="/api"
            className="text-forge-ash hover:text-forge-flame-bright transition-colors"
          >
            API
          </Link>
          <span className="text-forge-steel">/</span>
          <Link
            href={packagePath}
            className="text-forge-ash hover:text-forge-flame-bright transition-colors"
          >
            {packageName}
          </Link>
          <span className="text-forge-steel">/</span>
          <span className="text-forge-smoke">{apiExport.name}</span>
        </nav>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl text-forge-flame-bright font-mono">
            {apiExport.name}
          </h1>
          <span className="inline-block px-2 py-0.5 border border-forge-iron-light text-xs uppercase text-forge-ember-bright">
            {apiExport.kind}
          </span>
        </div>

        {apiExport.comment?.deprecated && (
          <div className="bg-forge-warning/10 border border-forge-warning/30 rounded px-3 py-2 mb-4 text-sm text-forge-warning">
            <strong>Deprecated:</strong> {apiExport.comment.deprecated}
          </div>
        )}
      </div>

      {/* Signature */}
      {apiExport.signature && (
        <div className="mb-6">
          {apiExport.signatureCodeHtml ? (
            <div
              className="prose-content"
              dangerouslySetInnerHTML={{ __html: apiExport.signatureCodeHtml }}
            />
          ) : (
            <pre className="bg-forge-bg-surface/50 border border-forge-iron-light rounded px-4 py-3 overflow-x-auto">
              <code className="text-sm text-forge-smoke font-mono">
                {apiExport.signature}
              </code>
            </pre>
          )}
        </div>
      )}

      {/* Description */}
      {(apiExport.descriptionHtml || apiExport.description) && (
        <div className="mb-6">
          {apiExport.descriptionHtml ? (
            <div
              className="prose-content"
              dangerouslySetInnerHTML={{ __html: apiExport.descriptionHtml }}
            />
          ) : (
            <p className="text-forge-ash">{apiExport.description}</p>
          )}
        </div>
      )}

      {/* Parameters */}
      {apiExport.parameters && apiExport.parameters.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-forge-flame-bright font-[Cinzel] mb-3 tracking-wider uppercase">
            Parameters
          </h2>
          <div className="bg-forge-bg border border-forge-iron-light rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-forge-iron-light">
                  <th className="text-left px-4 py-2.5 text-forge-flame-bright text-xs tracking-wider uppercase">
                    Name
                  </th>
                  <th className="text-left px-4 py-2.5 text-forge-flame-bright text-xs tracking-wider uppercase">
                    Type
                  </th>
                  <th className="text-left px-4 py-2.5 text-forge-flame-bright text-xs tracking-wider uppercase">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {apiExport.parameters.map((param) => (
                  <tr
                    key={param.name}
                    className="border-t border-forge-iron"
                  >
                    <td className="px-4 py-2.5 font-mono text-forge-smoke text-[0.8125rem]">
                      {param.name}
                      {param.optional && (
                        <span className="text-forge-ash">?</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <code className="font-mono text-forge-ember-bright text-xs bg-forge-bg-surface px-1.5 py-0.5 rounded">
                        <TypeText html={param.typeHtml} text={param.type} />
                      </code>
                    </td>
                    <td className="px-4 py-2.5 text-forge-ash text-[0.8125rem]">
                      {param.description || '\u2014'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Return type */}
      {apiExport.returnType && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-forge-flame-bright font-[Cinzel] mb-2 tracking-wider uppercase">
            Returns
          </h2>
          {apiExport.returnTypeCodeHtml ? (
            <div
              className="prose-content"
              dangerouslySetInnerHTML={{ __html: apiExport.returnTypeCodeHtml }}
            />
          ) : (
            <p className="font-mono text-forge-ember-bright text-sm">
              <TypeText
                html={apiExport.returnTypeHtml}
                text={apiExport.returnType}
              />
            </p>
          )}
        </div>
      )}

      {/* Type Parameters */}
      {apiExport.typeParameters && apiExport.typeParameters.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-forge-flame-bright font-[Cinzel] mb-3 tracking-wider uppercase">
            Type Parameters
          </h2>
          <ul className="space-y-2">
            {apiExport.typeParameters.map((tp) => (
              <li key={tp.name} className="text-sm">
                <code className="font-mono text-forge-smoke">{tp.name}</code>
                {tp.constraint && (
                  <span className="text-forge-ash">
                    {' '}
                    extends{' '}
                    <code className="font-mono text-forge-ember-bright">
                      <TypeText html={tp.constraintHtml} text={tp.constraint} />
                    </code>
                  </span>
                )}
                {tp.default && (
                  <span className="text-forge-ash">
                    {' '}
                    ={' '}
                    <code className="font-mono text-forge-ember-bright">
                      <TypeText html={tp.defaultHtml} text={tp.default} />
                    </code>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Properties */}
      {apiExport.properties && apiExport.properties.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-forge-flame-bright font-[Cinzel] mb-3 tracking-wider uppercase">
            Properties
          </h2>
          <div className="bg-forge-bg border border-forge-iron-light rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-forge-iron-light">
                  <th className="text-left px-4 py-2.5 text-forge-flame-bright text-xs tracking-wider uppercase">
                    Name
                  </th>
                  <th className="text-left px-4 py-2.5 text-forge-flame-bright text-xs tracking-wider uppercase">
                    Type
                  </th>
                  <th className="text-left px-4 py-2.5 text-forge-flame-bright text-xs tracking-wider uppercase">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {apiExport.properties.map((prop) => (
                  <tr
                    key={prop.name}
                    className="border-t border-forge-iron"
                  >
                    <td className="px-4 py-2.5 font-mono text-forge-smoke text-[0.8125rem]">
                      {prop.readonly && (
                        <span className="text-forge-ash">readonly </span>
                      )}
                      {prop.name}
                      {prop.optional && (
                        <span className="text-forge-ash">?</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <code className="font-mono text-forge-ember-bright text-xs bg-forge-bg-surface px-1.5 py-0.5 rounded">
                        <TypeText html={prop.typeHtml} text={prop.type} />
                      </code>
                    </td>
                    <td className="px-4 py-2.5 text-forge-ash text-[0.8125rem]">
                      {prop.description || '\u2014'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Methods */}
      {apiExport.methods && apiExport.methods.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-forge-flame-bright font-[Cinzel] mb-3 tracking-wider uppercase">
            Methods
          </h2>
          <div className="space-y-4">
            {apiExport.methods.map((method) => (
              <div
                key={method.name}
                className="border border-forge-iron-light rounded p-4"
              >
                <code className="text-sm font-mono text-forge-smoke block mb-2">
                  <TypeText
                    html={method.signatureHtml}
                    text={method.signature}
                  />
                </code>
                {method.description && (
                  <p className="text-sm text-forge-ash">
                    {method.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Examples */}
      {apiExport.examplesHtml && apiExport.examplesHtml.length > 0 ? (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-forge-flame-bright font-[Cinzel] mb-3 tracking-wider uppercase">
            Examples
          </h2>
          {apiExport.examplesHtml.map((html, i) => (
            <div
              key={i}
              className="prose-content mb-3"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ))}
        </div>
      ) : apiExport.comment?.examples &&
        apiExport.comment.examples.length > 0 ? (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-forge-flame-bright font-[Cinzel] mb-3 tracking-wider uppercase">
            Examples
          </h2>
          {apiExport.comment.examples.map((example, i) => (
            <pre
              key={i}
              className="bg-forge-bg-surface/50 border border-forge-iron-light rounded px-4 py-3 mb-3 overflow-x-auto"
            >
              <code className="text-sm text-forge-smoke font-mono">{example}</code>
            </pre>
          ))}
        </div>
      ) : null}

      {/* Remarks */}
      {apiExport.remarksHtml ? (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-forge-flame-bright font-[Cinzel] mb-3 tracking-wider uppercase">
            Remarks
          </h2>
          <div
            className="prose-content"
            dangerouslySetInnerHTML={{ __html: apiExport.remarksHtml }}
          />
        </div>
      ) : apiExport.comment?.remarks ? (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-forge-flame-bright font-[Cinzel] mb-3 tracking-wider uppercase">
            Remarks
          </h2>
          <p className="text-forge-ash">{apiExport.comment.remarks}</p>
        </div>
      ) : null}

      {/* See also */}
      {apiExport.comment?.see && apiExport.comment.see.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-forge-flame-bright font-[Cinzel] mb-2 tracking-wider uppercase">
            See Also
          </h2>
          <ul className="list-disc list-inside text-sm text-forge-ash">
            {apiExport.comment.see.map((ref, i) => (
              <li key={i}>{ref}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
