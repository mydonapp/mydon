export const useConstant = () => {
  return {
    URI: {
      API: (import.meta.env.VITE_API_URI as string) || 'http://localhost:3000',
    },
  };
};
