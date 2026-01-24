
/**
 * Simple parser to convert basic Markdown syntax to HTML for emails.
 * Supports:
 * - Bold: **text** -> <b>text</b>
 * - Italic: *text* -> <i>text</i>
 * - Links: [text](url) -> <a href="url">text</a>
 * - Lists: - item -> &bull; item
 * - Newlines: \n -> <br>
 */
export const parseBasicMarkdown = (text) => {
    if (!text) return '';
    let html = String(text);

    // Normalize newlines (handle Windows \r\n, Mac \r, and escaped \n)
    html = html.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\\n/g, '\n');

    // Bold **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

    // Italic *text*
    html = html.replace(/\*(?![*])(.*?)\*/g, '<i>$1</i>');

    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #4f46e5; text-decoration: underline;">$1</a>');

    // Horizontal Rule (---)
    html = html.replace(/^---+$/gm, '<hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />');

    // Lists
    // Match lines starting with "- " or "* " (common variations)
    // We use [\s\S] approach or ensure multiline flag works with normalized \n
    html = html.replace(/^\s*[-*]\s+(.+)$/gm, '&bull; $1');

    // Explicit break [br]
    html = html.replace(/\[br\]/gi, '<br>');

    // Convert newlines to <br>
    html = html.replace(/\n/g, '<br>');

    return html;
};
