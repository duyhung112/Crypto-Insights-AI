import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-crypto-pair.ts';
import '@/ai/flows/generate-trading-signals.ts';
import '@/ai/flows/analyze-news-sentiment.ts';
