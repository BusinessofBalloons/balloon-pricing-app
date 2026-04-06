import { createClient } from '@metagptx/web-sdk';

export const client = createClient({
  baseUrl: `${import.meta.env.VITE_API_URL}/api/v1`
});
