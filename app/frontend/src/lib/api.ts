import { createClient } from '@metagptx/web-sdk';

export const client = createClient({
  baseURL: import.meta.env.VITE_API_URL
});
