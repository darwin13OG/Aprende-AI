import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MathMarkdownProps {
  content: string;
  className?: string;
}

export const MathMarkdown: React.FC<MathMarkdownProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Pre-process content for optimal LaTeX/KaTeX math presentation and spacing
  let processed = content.replace(/\\(\$)/g, '$');

  // Ensure block equations with $$ have generous line-breaks so they render as centered display blocks
  processed = processed.replace(/([^\n])\s*\$\$/g, '$1\n\n$$$$');
  processed = processed.replace(/\$\$\s*([^\n])/g, '$$$$\n\n$1');

  // Convert \frac to \dfrac inside math blocks to provide ample vertical separation between numerator and denominator
  processed = processed.replace(/(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g, (match) => {
    return match.replace(/\\frac\b/g, '\\dfrac');
  });

  return (
    <div className={`math-content text-xs sm:text-sm leading-relaxed overflow-x-auto ${className}`}>
      <Markdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
        components={{
          p: ({ children }) => (
            <p className="mb-3.5 last:mb-0 leading-relaxed text-slate-800 dark:text-slate-100">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-slate-950 dark:text-white">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-cyan-700 dark:text-cyan-300 font-medium not-italic-brackets">
              {children}
            </em>
          ),
          ul: ({ children }) => (
            <ul className="space-y-3.5 my-3.5 pl-5 list-disc marker:text-cyan-500">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-4 my-3.5 pl-5 list-decimal marker:text-blue-500 dark:marker:text-cyan-400 font-bold">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="pl-1.5 leading-loose font-normal text-slate-800 dark:text-slate-100 my-1.5">
              {children}
            </li>
          ),
          hr: () => <hr className="my-4 border-t border-slate-200 dark:border-cyan-500/20" />,
          h1: ({ children }) => (
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-4 mb-2">
              {children}
            </h3>
          ),
          h2: ({ children }) => (
            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white mt-3.5 mb-1.5">
              {children}
            </h4>
          ),
          h3: ({ children }) => (
            <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-3 mb-1.5">
              {children}
            </h5>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-cyan-500 pl-3.5 italic my-3 text-slate-600 dark:text-slate-300 bg-cyan-500/5 py-1.5 rounded-r-lg">
              {children}
            </blockquote>
          ),
          code: ({ inline, children }: any) => {
            if (inline) {
              return (
                <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#070d1a] border border-slate-300 dark:border-cyan-500/30 font-mono text-[11px] text-pink-600 dark:text-pink-300 font-medium">
                  {children}
                </code>
              );
            }
            return (
              <pre className="p-3 my-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800">
                <code>{children}</code>
              </pre>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full text-left text-xs border border-slate-200 dark:border-cyan-500/30 rounded-lg overflow-hidden">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="bg-slate-100 dark:bg-[#0d172a] px-3 py-2 font-bold border-b border-slate-200 dark:border-cyan-500/30">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
              {children}
            </td>
          ),
        }}
      >
        {processed}
      </Markdown>
    </div>
  );
};
