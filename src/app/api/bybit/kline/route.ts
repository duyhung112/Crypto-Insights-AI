// This is a new file.
import {NextRequest, NextResponse} from 'next/server';

const BYBIT_API_URL = "https://api.bybit.com";

// We export this function so it can be called directly from server-side components/actions
// This avoids the HTTP round-trip and any potential Vercel authentication middleware.
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const interval = searchParams.get('interval');
    const limit = searchParams.get('limit');
    
    if (!symbol || !interval) {
        return NextResponse.json({ error: 'Missing required parameters: symbol and interval' }, { status: 400 });
    }

    const bybitUrl = `${BYBIT_API_URL}/v5/market/kline?category=linear&symbol=${symbol}&interval=${interval}&limit=${limit || 200}`;

    try {
        const response = await fetch(bybitUrl, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Bybit API error response from within API route:", errorBody);
            // Return a structured error
            return NextResponse.json({ error: `Bybit API Error: ${response.statusText}`, details: errorBody }, { status: response.status });
        }

        const data = await response.json();

        if (data.retCode !== 0) {
             return NextResponse.json({ error: `Bybit API Error: ${data.retMsg || 'Bybit API returned an error'}`, details: data }, { status: 400 });
        }
        
        // Return the successful response
        return NextResponse.json(data);

    } catch (error) {
        console.error(`[API Route] Failed to fetch from Bybit API: ${bybitUrl}`, error);
        if (error instanceof Error) {
             return NextResponse.json({ error: `Failed to call Bybit API: ${error.message}` }, { status: 500 });
        }
        return NextResponse.json({ error: 'An unknown error occurred while fetching kline data.' }, { status: 500 });
    }
}
