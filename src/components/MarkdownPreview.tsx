import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, FileText, Sparkles, ExternalLink, Code2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MarkdownPreviewProps {
  content: string;
  fileName?: string;
  className?: string;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  content,
  fileName = 'README.md',
  className = ''
}) => {
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const handleCopySnippet = (codeText: string, id: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeId(id);
    confetti({ particleCount: 15, spread: 35, origin: { y: 0.7 } });
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className={`w-full h-full overflow-y-auto p-4 sm:p-6 bg-[#0d1117] text-[#c9d1d9] font-sans selection:bg-[#1f6feb]/30 ${className}`}>
      {/* Markdown Document Header */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#30363d] font-mono text-xs text-[#8b949e]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#58a6ff]/15 text-[#58a6ff] border border-[#58a6ff]/30">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <div className="text-white font-bold">{fileName}</div>
            <div className="text-[10px] text-[#8b949e]">Markdown Live Rendered View</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-[#161b22] border border-[#30363d] text-[#79c0ff]">
          <Sparkles className="h-3 w-3 text-[#58a6ff]" />
          <span>GFM Enabled</span>
        </div>
      </div>

      {/* Main Markdown Body Content */}
      <div className="markdown-body max-w-4xl mx-auto space-y-4">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ node, ...props }) => (
              <h1
                className="text-2xl sm:text-3xl font-bold text-white pb-2.5 border-b border-[#30363d] tracking-tight mt-6 mb-4 flex items-center gap-2"
                {...props}
              />
            ),
            h2: ({ node, ...props }) => (
              <h2
                className="text-xl sm:text-2xl font-semibold text-[#f0f6fc] pb-1.5 border-b border-[#21262d] mt-5 mb-3"
                {...props}
              />
            ),
            h3: ({ node, ...props }) => (
              <h3 className="text-lg font-semibold text-[#79c0ff] mt-4 mb-2" {...props} />
            ),
            h4: ({ node, ...props }) => (
              <h4 className="text-base font-semibold text-[#d2a8ff] mt-3 mb-1.5" {...props} />
            ),
            p: ({ node, ...props }) => (
              <div className="text-sm leading-relaxed text-[#c9d1d9] mb-3" {...props} />
            ),
            pre: ({ node, children, ...props }: any) => {
              // Pass through children directly since code block component renders the full wrapper
              return <>{children}</>;
            },
            a: ({ node, href, children, ...props }) => (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="text-[#58a6ff] hover:text-[#79c0ff] underline underline-offset-2 inline-flex items-center gap-0.5 hover:opacity-90 font-medium"
                {...props}
              >
                <span>{children}</span>
                <ExternalLink className="h-3 w-3 inline ml-0.5" />
              </a>
            ),
            ul: ({ node, ...props }) => (
              <ul className="list-disc list-inside space-y-1.5 text-sm text-[#c9d1d9] ml-2 mb-3" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="list-decimal list-inside space-y-1.5 text-sm text-[#c9d1d9] ml-2 mb-3" {...props} />
            ),
            li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
            blockquote: ({ node, ...props }) => (
              <blockquote
                className="border-l-4 border-[#1f6feb] bg-[#161b22]/70 rounded-r-xl px-4 py-2.5 my-3 text-sm text-[#8b949e] italic font-mono"
                {...props}
              />
            ),
            hr: ({ node, ...props }) => <hr className="border-[#30363d] my-6" {...props} />,
            table: ({ node, ...props }) => (
              <div className="overflow-x-auto my-4 border border-[#30363d] rounded-xl shadow-inner">
                <table className="w-full text-left text-xs border-collapse font-mono" {...props} />
              </div>
            ),
            thead: ({ node, ...props }) => (
              <thead className="bg-[#161b22] text-[#f0f6fc] border-b border-[#30363d]" {...props} />
            ),
            th: ({ node, ...props }) => (
              <th className="px-3.5 py-2.5 font-semibold text-[#58a6ff]" {...props} />
            ),
            td: ({ node, ...props }) => (
              <td className="px-3.5 py-2 border-b border-[#21262d] text-[#c9d1d9]" {...props} />
            ),
            code: ({ node, inline, className, children, ...props }: any) => {
              const match = /language-(\w+)/.exec(className || '');
              const codeString = String(children).replace(/\n$/, '');
              const blockId = `code-${Math.random().toString(36).substring(2, 9)}`;

              if (inline) {
                return (
                  <code
                    className="px-1.5 py-0.5 rounded-md bg-[#161b22] text-[#79c0ff] font-mono text-[12px] border border-[#30363d]"
                    {...props}
                  >
                    {children}
                  </code>
                );
              }

              return (
                <div className="my-3 rounded-xl border border-[#30363d] bg-[#090d13] overflow-hidden shadow-lg font-mono">
                  {/* Code Header Bar */}
                  <div className="bg-[#161b22] px-3.5 py-2 border-b border-[#30363d] flex items-center justify-between text-xs text-[#8b949e]">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <Code2 className="h-3.5 w-3.5 text-[#58a6ff]" />
                      <span>{match ? match[1].toUpperCase() : 'CODE'}</span>
                    </div>
                    <button
                      onClick={() => handleCopySnippet(codeString, blockId)}
                      className="px-2 py-0.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] hover:text-white text-[11px] font-semibold flex items-center gap-1 border border-[#30363d] transition-all"
                    >
                      {copiedCodeId === blockId ? (
                        <>
                          <Check className="h-3 w-3 text-[#3fb950]" />
                          <span className="text-[#3fb950]">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  {/* Code Block Pre */}
                  <pre className="p-3.5 overflow-x-auto text-xs text-[#79c0ff] leading-relaxed">
                    <code>{children}</code>
                  </pre>
                </div>
              );
            }
          }}
        >
          {content || '*No content to render*'}
        </ReactMarkdown>
      </div>
    </div>
  );
};
