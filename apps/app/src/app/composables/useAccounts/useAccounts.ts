import { useFetch } from '@vueuse/core';
import { ref, watch, type Ref } from 'vue';
import { useAuth } from '../useAuth';
import { useConstant } from '../useConstant';

interface CreateAccount {
  name: string;
  openingBalance: number;
  type: string;
  currency?: string;
  categoryId?: string;
}

export interface AccountSimple {
  id: string;
  name: string;
  type: string;
  currency: string;
  isActive: boolean;
  retirementAccount: boolean;
  categoryId: string | null;
  categoryName: string | null;
}

export const useAccounts = (timeFilter?: Ref<string>) => {
  const { getAccessToken } = useAuth();
  const { URI } = useConstant();

  let toFromQuery = '';
  if (timeFilter?.value === '2024') {
    toFromQuery = '?from=2024-01-01&to=2024-12-31';
  } else if (timeFilter?.value === '2025') {
    toFromQuery = '?from=2025-01-01&to=2025-12-31';
  } else if (timeFilter?.value === '2026') {
    toFromQuery = '?from=2026-01-01&to=2026-12-31';
  }

  const url = ref(`${URI.API}/v1/accounts${toFromQuery}`);

  watch(timeFilter, () => {
    if (timeFilter?.value === '2024') {
      toFromQuery = `?from=2024-01-01&to=2024-12-31`;
    } else if (timeFilter?.value === '2025') {
      toFromQuery = `?from=2025-01-01&to=2025-12-31`;
    } else if (timeFilter?.value === '2026') {
      toFromQuery = `?from=2026-01-01&to=2026-12-31`;
    } else {
      toFromQuery = '';
    }
    url.value = `${URI.API}/v1/accounts${toFromQuery}`;
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

  const fetchSimple = async (): Promise<AccountSimple[]> => {
    const res = await fetch(`${URI.API}/v1/accounts?list=true`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    });
    return res.json();
  };

  const updateAccount = async (
    id: string,
    data: { name?: string; categoryId?: string | null; isActive?: boolean },
  ) => {
    const res = await fetch(`${URI.API}/v1/accounts/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  };

  return {
    accounts: data,
    loading: isFetching,
    error,
    createAccount,
    updateAccount,
    fetchSimple,
    refetchAccounts,
  };
};
