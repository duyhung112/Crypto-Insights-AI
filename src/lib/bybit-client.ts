
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
    const url = `${BYBIT_API_URL}/v5/market/kline?category=linear&symbol=${symbol}&interval=${interval}&limit=${limit}`;
    
    // Add a Referer header to prevent "Forbidden" errors on deployed environments.
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        'Referer': 'https://www.google.com/' // Using a generic, safe referer.
      }
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Bybit API error response:", errorBody);
      throw new Error(`Bybit API Error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.retCode !== 0) {
      throw new Error(`Bybit API Error: ${data.retMsg}`);
    }

    return data.result;
  }
  
  // You can add other authenticated methods here in the future
  // For example: createOrder, getWalletBalance, etc.
}

// Export a singleton instance
export const bybitClient = new BybitClient();
