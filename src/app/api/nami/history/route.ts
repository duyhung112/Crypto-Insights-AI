// /src/app/api/nami/history/route.ts
import { NextRequest, NextResponse } from 'next/server';

const NAMI_API_URL = "https://nami.exchange/api/v1/chart/history";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const resolution = searchParams.get('resolution');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    
    if (!symbol || !resolution || !from || !to) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const namiUrl = `${NAMI_API_URL}?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}`;

    try {
        const response = await fetch(namiUrl, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Nami API error response from within API route:", errorBody);
            return NextResponse.json({ error: `Nami API Error: ${response.statusText}`, details: errorBody }, { status: response.status });
        }

        const data = await response.json();
        
        return NextResponse.json(data);

    } catch (error) {
        console.error(`[API Route] Failed to fetch from Nami API: ${namiUrl}`, error);
        if (error instanceof Error) {
             return NextResponse.json({ error: `Failed to call Nami API: ${error.message}` }, { status: 500 });
        }
        return NextResponse.json({ error: 'An unknown error occurred while fetching kline data.' }, { status: 500 });
    }
}
