import { genkit, type Genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// This function allows for dynamic initialization of Genkit with a user-provided API key.
export function initGenkit(apiKey?: string): Genkit {
  const plugins = [];
  if (apiKey) {
    plugins.push(googleAI({ apiKey }));
  } else {
    // Fallback to environment variable if no key is provided
    plugins.push(googleAI());
  }

  return genkit({
    plugins,
    model: 'googleai/gemini-1.5-flash-latest',
  });
}

// A default instance for cases where a user-specific key is not needed,
// though most of our flows will now use the dynamic one.
export const ai = initGenkit();
