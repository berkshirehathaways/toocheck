import { apiError } from "@/lib/api/errors";
export const dynamic = "force-dynamic";
export function GET() {
  return apiError("not_found", "share-card renderer is not yet implemented (PR-10)", { status: 501 });
}
