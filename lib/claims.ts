/** Shared by /api/claims (web) and the WhatsApp bot — same claim numbering either way. */
export function generateClaimNumber(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(1000 + Math.random() * 8999);
  return `ZVIG-C-${year}-${seq}`;
}
