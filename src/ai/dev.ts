import { config } from 'dotenv';
config();

// The flows are now initialized dynamically within the actions that call them,
// so we no longer need to import them here for the dev server.
// This prevents the accidental initialization of a Genkit instance without an API key.
