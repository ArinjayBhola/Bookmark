import { NextRequest, NextResponse } from 'next/server';
import { getDiscoveries } from '@/app/actions/discovery';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const region = searchParams.get('region') || 'ALL';
    const boundsStr = searchParams.get('bounds');
    
    let bounds = undefined;
    if (boundsStr) {
      try {
        bounds = JSON.parse(boundsStr);
      } catch (e) {
        console.error('Invalid bounds JSON in GET discoveries API:', e);
      }
    }

    const data = await getDiscoveries({ search, region, bounds });
    
    // Add standard Cache-Control headers so browser can cache responses
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      },
    });
  } catch (error: unknown) {
    console.error('API discoveries route error:', error);
    return NextResponse.json({ error: 'Failed to fetch discoveries' }, { status: 500 });
  }
}
