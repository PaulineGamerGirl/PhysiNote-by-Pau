
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  return (
    <div className={`prose prose-slate max-w-none prose-headings:font-nunito prose-p:font-nunito ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // UNIFORM TYPOGRAPHY: 
          // Big Headers = 64px (2 lines)
          // Body Text = 32px (1 line)
          
          h1: ({node, ...props}) => <h1 className="text-3xl font-black uppercase tracking-tight mb-[32px] text-slate-900 leading-[64px]" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-2xl font-bold uppercase tracking-wide mb-[32px] mt-0 text-slate-800 leading-[64px]" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-lg font-bold mb-[32px] mt-0 text-slate-800 underline decoration-slate-300 decoration-2 underline-offset-4 leading-[32px]" {...props} />,
          
          ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-0 mb-[32px] text-slate-700 marker:text-slate-900" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal pl-5 space-y-0 mb-[32px] text-slate-700 marker:text-slate-900 font-bold" {...props} />,
          
          li: ({node, ...props}) => <li className="pl-1 leading-[32px]" {...props} />,
          p: ({node, ...props}) => <p className="mb-[32px] text-slate-700 font-medium leading-[32px]" {...props} />,
          
          code: ({node, inline, className, children, ...props}: any) => {
             return inline ? 
               <code className="bg-slate-100 px-1 rounded text-sm font-bold font-mono text-blue-600" {...props}>{children}</code> :
               <code className="block bg-slate-100 text-slate-800 p-[32px] rounded-sm mb-[32px] text-sm font-mono border-l-4 border-slate-300" {...props}>{children}</code>
          },
          blockquote: ({node, ...props}) => (
              <blockquote className="border-l-4 border-slate-900 pl-4 italic text-slate-800 mb-[32px] leading-[32px]" {...props} />
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
