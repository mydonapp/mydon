import axios from 'axios';
import { useRoute, useRouter } from 'vue-router';

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
}

interface FetchTokenResponse {
  accessToken: string;
  expiry: number;
}

let accessToken: string | undefined = undefined;
let accessTokenExpiry: Date | undefined = undefined;

export const useAuth = () => {
  const router = useRouter();
  const route = useRoute();
  const AUTH_URI = 'http://localhost:3000';

  const isAuthenticated = () => {
    return !!getAccessToken();
  };

  const init = async () => {
    await fetchAccessToken();
  };

  const getAccessToken = () => {
    if (accessTokenExpiry && accessToken) {
      if (accessTokenExpiry.getTime() > new Date().getTime()) {
        return accessToken;
      }
    }
    return undefined;
  };

  const login = async (email: string, password: string, next?: string) => {
    try {
      const response = await axios.post<FetchTokenResponse>(
        AUTH_URI + '/v1/auth/login/password',
        {
          email,
          password,
        },
        { withCredentials: true }
      );

      if (response.data) {
        accessTokenExpiry = new Date(response.data.expiry * 1000);
        accessToken = response.data.accessToken;
      }
      if (next) {
        await router.push(next);
        return {
          success: true,
          errorMessage: undefined,
        };
      }
      await router.push({ name: 'Dashboard' });

      return {
        success: true,
        errorMessage: undefined,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          errorMessage: error.response?.data?.message as string | undefined,
        };
      }
      return {
        success: false,
        errorMessage: 'Something went wrong.',
      };
    }
  };

  const signup = async (input: SignUpInput) => {
    const result = await axios.post(
      AUTH_URI + '/v1/auth/signup',
      {
        ...input,
      },
      { withCredentials: true }
    );

    if (result.status === 201) {
      await router.push({
        name: 'Login',
        query: { email: input.email, next: route.query.next },
      });
    }
  };

  const fetchAccessToken = async () => {
    const result = await axios.post<FetchTokenResponse>(
      AUTH_URI + '/v1/auth/refresh',
      undefined,
      {
        withCredentials: true,
      }
    );
    if (result.data) {
      accessTokenExpiry = new Date(result.data.expiry * 1000);
      accessToken = result.data.accessToken;
    }
  };

  const logout = async () => {
    try {
      await axios.post(
        AUTH_URI + '/v1/auth/logout',
        {},
        {
          withCredentials: true,
        }
      );
      accessTokenExpiry = undefined;
      accessToken = undefined;
      void router.push({ name: 'Login' });
    } catch (error) {
      console.error('logout failed', error as Error);
    }
  };

  const changePassword = async (input: {
    currentPassword: string;
    newPassword: string;
  }) => {
    try {
      await axios.put(
        AUTH_URI + '/v1/auth/account/password',
        {
          ...input,
        },
        { withCredentials: true }
      );

      return {
        success: true,
        errorMessage: undefined,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          errorMessage: error.response?.data?.message as string | undefined,
        };
      }
      return {
        success: false,
        errorMessage: 'Something went wrong.',
      };
    }
  };

  return {
    account: {
      email: '',
      name: '',
    },
    getAccessToken,
    logout,
    login,
    isAuthenticated,
    signup,
    changePassword,
    init,
  };
};
