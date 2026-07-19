import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export default function MathText({ text, className = '' }: { text: string; className?: string }) {
  const parts = String(text || '').split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g);
  return <span className={className}>{parts.map((part, index) => {
    const display = part.startsWith('$$') && part.endsWith('$$');
    const inline = !display && part.startsWith('$') && part.endsWith('$');
    if (!display && !inline) return <React.Fragment key={index}>{part}</React.Fragment>;
    const formula = part.slice(display ? 2 : 1, display ? -2 : -1);
    return <span
      key={index}
      className={display ? 'block my-2 overflow-x-auto' : 'inline-block align-middle'}
      dangerouslySetInnerHTML={{ __html: katex.renderToString(formula, { displayMode: display, throwOnError: false, strict: 'warn', trust: false, output: 'html' }) }}
    />;
  })}</span>;
}
