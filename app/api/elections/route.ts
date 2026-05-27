import { listElections } from '@/mocks/loader';
import { jsonOk } from '@/lib/api/errors';

export const dynamic = 'force-static';

export function GET() {
  return jsonOk({ elections: listElections() });
}
