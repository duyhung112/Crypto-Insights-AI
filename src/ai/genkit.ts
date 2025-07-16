import { genkit, type Genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// This function allows for dynamic initialization of Genkit with a user-provided API key.
export function initGenkit(apiKey?: string): Genkit {
  const plugins = [];
  if (apiKey) {
    plugins.push(googleAI({ apiKey }));
  }
  // If no API key is provided, Genkit will be initialized without the Google AI plugin,
  // and subsequent calls will fail, which is the desired behavior to enforce key usage.

  return genkit({
    plugins,
    model: 'googleai/gemini-1.5-flash-latest',
  });
}

// A default instance is exported for defining tools, which doesn't require an API key.
// The actual execution will use the dynamically initialized instance.
export const ai = genkit({
  plugins: [], // No plugins needed for just defining structures
});
