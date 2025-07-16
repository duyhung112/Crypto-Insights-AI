// This is a new file.
const BYBIT_API_URL = "https://api.bybit.com";

// Function to get the base URL of the app
function getBaseUrl() {
  // Vercel-provided variable for the deployment URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Fallback for other environments or local development
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
}

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
    const baseUrl = getBaseUrl();
    const internalApiUrl = `${baseUrl}/api/bybit/kline?symbol=${symbol}&interval=${interval}&limit=${limit}`;

    try {
        const response = await fetch(internalApiUrl, {
          cache: 'no-store',
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Internal API error response:", errorBody);
            throw new Error(`API Route Error: ${response.statusText} - ${errorBody}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(`Bybit API Error: ${data.error}`);
        }

        return data.result;
    } catch (error) {
        console.error(`Failed to fetch from internal API route: ${internalApiUrl}`, error);
        if (error instanceof Error) {
            throw new Error(`Failed to call internal kline API: ${error.message}`);
        }
        throw new Error('An unknown error occurred while fetching kline data.');
    }
  }
  
  // You can add other authenticated methods here in the future
  // For example: createOrder, getWalletBalance, etc.
}

// Export a singleton instance
export const bybitClient = new BybitClient();
