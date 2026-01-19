
export const cleanSvgContent = (content: string) => {
  if (!content) return '';
  return content.replace(/```svg/g, '').replace(/```xml/g, '').replace(/```/g, '').trim();
};

export const parseMarkdownToHtml = (markdown: string): string => {
  if (!markdown) return '';

  let html = markdown;

  // 1. Headers (### Header)
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // 2. Bold (**text**)
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');

  // 3. Italic (*text*)
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

  // 4. LaTeX (Try to make it look distinct, though TipTap doesn't render MathJax natively without plugins)
  // We wrap it in a code style so it doesn't look like broken text
  html = html.replace(/\$\$(.*?)\$\$/gim, '<code style="background:#f1f5f9; color:#0f172a; padding:4px; border-radius:4px; font-family:monospace;">$1</code>');
  html = html.replace(/\$(.*?)\$/gim, '<code style="background:#f1f5f9; color:#2563eb; padding:2px; border-radius:2px; font-family:monospace;">$1</code>');

  // 5. Lists (- item)
  // Simple replacement, proper parsing would require a library but this covers basic Gemini output
  html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
  // Wrap li in ul? This is tricky with regex alone, but TipTap handles loose li well enough or we leave as lines.
  
  // 6. Paragraphs (Double newline)
  // Split by double newlines and wrap in p if not already a tag
  const blocks = html.split('\n\n');
  const finalHtml = blocks.map(block => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<h') || trimmed.startsWith('<li') || trimmed.startsWith('<code')) return trimmed;
      return `<p>${trimmed}</p>`;
  }).join('');

  return finalHtml;
};
