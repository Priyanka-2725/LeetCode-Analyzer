/**
 * Extracts a LeetCode username from either:
 *  - A plain username: "john_doe"
 *  - A profile URL: "https://leetcode.com/u/john_doe/" or "https://leetcode.com/john_doe"
 */
export function extractUsername(input: string): string {
  const trimmed = input.trim();

  // Try to parse as URL
  try {
    const url = new URL(trimmed);
    if (url.hostname.includes('leetcode.com')) {
      // Handle /u/username or /username patterns
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length >= 2 && parts[0] === 'u') {
        return parts[1];
      }
      if (parts.length >= 1) {
        return parts[0];
      }
    }
  } catch {
    // Not a URL — treat as plain username
  }

  // Validate plain username (alphanumeric, underscores, hyphens)
  const usernameRegex = /^[a-zA-Z0-9_-]{1,50}$/;
  if (!usernameRegex.test(trimmed)) {
    throw new Error('Invalid username format');
  }

  return trimmed;
}
