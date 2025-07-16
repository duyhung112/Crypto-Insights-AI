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
    const bybitUrl = `${BYBIT_API_URL}/v5/market/kline?category=linear&symbol=${symbol}&interval=${interval}&limit=${limit}`;

    try {
        const response = await fetch(bybitUrl, {
          cache: 'no-store', // Ensure fresh data is fetched
          headers: {
            'Accept': 'application/json',
            // Adding a common User-Agent can sometimes help bypass simple bot detection
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Bybit API error response:", errorBody);
            throw new Error(`Bybit API Error: ${response.statusText} - ${errorBody}`);
        }

        const data = await response.json();

        if (data.retCode !== 0) {
            throw new Error(`Bybit API Error: ${data.retMsg || 'Bybit API returned an error'}`);
        }

        return data.result;
    } catch (error) {
        console.error(`Failed to fetch from Bybit API: ${bybitUrl}`, error);
        if (error instanceof Error) {
            throw new Error(`Failed to call Bybit API: ${error.message}`);
        }
        throw new Error('An unknown error occurred while fetching kline data.');
    }
  }
  
  // You can add other authenticated methods here in the future
  // For example: createOrder, getWalletBalance, etc.
}

// Export a singleton instance
export const bybitClient = new BybitClient();
