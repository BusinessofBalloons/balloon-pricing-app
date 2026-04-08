// Production-safe configuration

export function getAPIBaseURL(): string {
  const url = import.meta.env.VITE_API_BASE_URL;

  if (!url) {
    throw new Error("VITE_API_BASE_URL is not defined");
  }

  return url;
}

export const config = {
  get API_BASE_URL() {
    return getAPIBaseURL();
  },
};
