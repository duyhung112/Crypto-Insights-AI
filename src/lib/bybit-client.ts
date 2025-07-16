// This is a new file.
const BYBIT_API_URL = "https://api.bybit.com";

class BybitClient {
  private apiKey: string;
  private apiSecret: string;

  constructor() {
    this.apiKey = process.env.BYBIT_API_KEY || '';
    this.apiSecret = process.env.BYBIT_API_SECRET || '';

    // A simple check to remind user in the server console if keys are missing.
    // This is not for security, but for development convenience.
    if (typeof window === 'undefined' && (!this.apiKey || !this.apiSecret)) {
      console.warn(`
        ****************************************************************
        * BYBIT_API_KEY or BYBIT_API_SECRET is not set in .env file.   *
        * Public endpoints will work, but authenticated endpoints will fail. *
        ****************************************************************
      `);
    }
  }

  public async getKline(symbol: string, interval: string, limit: number) {
    // Construct the URL to our internal API route
    // This assumes the app is running on the same domain.
    const internalApiUrl = `/api/bybit/kline?symbol=${symbol}&interval=${interval}&limit=${limit}`;

    const response = await fetch(internalApiUrl, {
      cache: 'no-store',
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Internal API error response:", errorBody);
        throw new Error(`API Route Error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
        throw new Error(`Bybit API Error: ${data.error}`);
    }

    return data.result;
  }
  
  // You can add other authenticated methods here in the future
  // For example: createOrder, getWalletBalance, etc.
}

// Export a singleton instance
export const bybitClient = new BybitClient();
