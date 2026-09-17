'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function MarkdownLegal({ content }: { content: string }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="prose prose-slate dark:prose-invert max-w-3xl mx-auto px-4 py-12">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}