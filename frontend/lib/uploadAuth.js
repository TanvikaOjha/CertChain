 
export const UPLOAD_AUTH_WINDOW_MS = 5 * 60 * 1000;
 
export function uploadAuthMessage(timestamp) {
  return `CertChain upload authorization\nTimestamp: ${timestamp}`;
}
 
