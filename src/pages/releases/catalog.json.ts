import { releases } from '../../data/releases';
export function GET() { return new Response(JSON.stringify(releases,null,2), {headers:{'Content-Type':'application/json'}}); }
