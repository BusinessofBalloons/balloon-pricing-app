import { createClient } from '@metagptx/web-sdk';

// Create client instance with backend URL
export const client = createClient({
  baseUrl: import.meta.env.VITE_API_URL
});
