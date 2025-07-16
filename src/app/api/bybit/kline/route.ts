// This is a new file created to proxy Bybit API calls.
import {NextResponse} from 'next/server';

const BYBIT_API_URL = 'https://api.bybit.com';

// This function handles GET requests to /api/bybit/kline
export async function GET(request: Request) {
  const {searchParams} = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const interval = searchParams.get('interval');
  const limit = searchParams.get('limit');

  if (!symbol || !interval || !limit) {
    return NextResponse.json(
      {error: 'Missing required query parameters: symbol, interval, limit'},
      {status: 400}
    );
  }

  const bybitUrl = `${BYBIT_API_URL}/v5/market/kline?category=linear&symbol=${symbol}&interval=${interval}&limit=${limit}`;

  try {
    const apiResponse = await fetch(bybitUrl, {
      headers: {
        // Bybit might require some headers to identify the request source
        'Accept': 'application/json',
      },
      // Revalidate every minute
      next: { revalidate: 60 } 
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.text();
      console.error(`Bybit API call failed: ${apiResponse.status}`, errorData);
      return NextResponse.json(
        {error: `Bybit API Error: ${apiResponse.statusText}`, details: errorData},
        {status: apiResponse.status}
      );
    }

    const data = await apiResponse.json();
    
    if (data.retCode !== 0) {
      return NextResponse.json(
        {error: data.retMsg || 'Bybit API returned an error'},
        {status: 400}
      );
    }

    return NextResponse.json({ result: data.result });
  } catch (error) {
    console.error('Error proxying request to Bybit:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      {error: 'Failed to fetch data from Bybit API', details: errorMessage},
      {status: 500}
    );
  }
}
