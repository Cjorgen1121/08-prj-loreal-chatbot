// Cloudflare Pages maps this file to /api/chat.
// Reuse the same secure handler as the standalone Worker example.
import worker from "../../RESOURCE_cloudflare-worker.js";

export function onRequest(context) {
  return worker.fetch(context.request, context.env);
}
