import { useQuery } from '@tanstack/vue-query';
import { useAuth } from '../useAuth';
import { useConstant } from '../useConstant';

export interface User {
  id: string;
  name: string;
  email: string;
}

export const useUser = () => {
  const { URI } = useConstant();
  const { getAccessToken } = useAuth();

  const {
    data: user,
    isFetching: loading,
    error,
  } = useQuery({
    queryKey: ['user'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: async (): Promise<User> => {
      const response = await fetch(`${URI.API}/v1/auth/me`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user information');
      }

      return response.json();
    },
  });

  return {
    user,
    loading,
    error,
  };
};
