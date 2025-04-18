import { useFetch } from '@vueuse/core';
import { ref, watch, type Ref } from 'vue';
import { useAuth } from '../useAuth';
import { useConstant } from '../useConstant';

interface CreateAccount {
  name: string;
  openingBalance: number;
  type: string;
}

export const useAccounts = (timeFilter?: Ref<string>) => {
  const { getAccessToken } = useAuth();
  const { URI } = useConstant();

  console.log('Updating time filter:', timeFilter?.value);
  let toFromQuery = '';
  if (timeFilter?.value === '2024') {
    toFromQuery = '?from=2024-01-01&to=2024-12-31';
  } else if (timeFilter?.value === '2025') {
    toFromQuery = '?from=2025-01-01&to=2025-12-31';
  }

  const url = ref(`${URI.API}/v1/accounts${toFromQuery}`);

  watch(timeFilter, () => {
    console.log('Updating URL:', timeFilter?.value);
    if (timeFilter?.value === '2024') {
      toFromQuery = `?from=2024-01-01&to=2024-12-31`;
    } else if (timeFilter?.value === '2025') {
      toFromQuery = `?from=2025-01-01&to=2025-12-31`;
    } else {
      toFromQuery = '';
    }
    url.value = `${URI.API}/v1/accounts${toFromQuery}`;
    console.log('Updated URL:', url.value);
  });

  const {
    isFetching,
    error,
    data,
    execute: refetchAccounts,
  } = useFetch<any[]>(url, {
    refetch: true,
    beforeFetch({ options }) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${getAccessToken()}`,
      };

      return {
        options,
      };
    },
  }).json();

  const createAccount = async (account: CreateAccount) => {
    await fetch(`${URI.API}/v1/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify(account),
    });
    refetchAccounts();
  };

  return {
    accounts: data,
    loading: isFetching,
    error,
    createAccount,
  };
};
