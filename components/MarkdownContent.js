"use client";

import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

export default function MarkdownContent({ children, className = "" }) {
  const text = typeof children === "string" ? children : "";
  return (
    <div className={`markdown-body text-slate-800 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkBreaks]}
        components={{
          p: ({ ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
          strong: ({ ...props }) => <strong className="font-semibold text-slate-900" {...props} />,
          em: ({ ...props }) => <em className="italic" {...props} />,
          ul: ({ ...props }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0" {...props} />,
          ol: ({ ...props }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0" {...props} />,
          li: ({ ...props }) => <li className="leading-relaxed" {...props} />,
          blockquote: ({ ...props }) => (
            <blockquote
              className="my-2 border-l-4 border-[var(--teal)]/50 pl-3 italic text-slate-600"
              {...props}
            />
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
