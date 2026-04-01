/**
 * Simple utility to strip HTML tags from a string.
 */
export function cleanHtml(html: string): string {
  if (!html) return "";
  
  // Replace <br> and <p> with newlines
  let text = html.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/p>/gi, "\n");
  text = text.replace(/<li>/gi, "• ");
  text = text.replace(/<\/li>/gi, "\n");
  
  // Strip all other tags
  text = text.replace(/<[^>]*>?/gm, "");
  
  // Decode common HTML entities
  text = text.replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'");

  // Trim extra whitespace and multiple newlines
  return text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
    .trim();
}
