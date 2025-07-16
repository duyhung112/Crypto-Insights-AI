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
    
    // Use a proxy to bypass CORS/Forbidden issues on deployed environments.
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(bybitUrl)}`;

    const response = await fetch(proxyUrl, {
      cache: "no-store",
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Proxy API error response:", errorBody);
      throw new Error(`Proxy API Error: ${response.statusText}`);
    }

    const proxyData = await response.json();
    
    // The actual Bybit data is nested in the 'contents' field of the proxy response
    const bybitData = JSON.parse(proxyData.contents);

    if (bybitData.retCode !== 0) {
      console.error("Bybit API error details:", bybitData);
      throw new Error(`Bybit API Error: ${bybitData.retMsg}`);
    }

    return bybitData.result;
  }
  
  // You can add other authenticated methods here in the future
  // For example: createOrder, getWalletBalance, etc.
}

// Export a singleton instance
export const bybitClient = new BybitClient();
