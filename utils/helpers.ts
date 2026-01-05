export const cleanSvgContent = (content: string) => {
  if (!content) return '';
  return content.replace(/```svg/g, '').replace(/```xml/g, '').replace(/```/g, '').trim();
};