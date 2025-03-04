import { useFetch } from '@vueuse/core';
import { ref, watch, type Ref } from 'vue';

interface CreateAccount {
  name: string;
  openingBalance: number;
  type: string;
}

export const useAccounts = (timeFilter?: Ref<string>) => {
  console.log('Updating time filter:', timeFilter?.value);
  let toFromQuery = '';
  if (timeFilter?.value === '2024') {
    toFromQuery = '?from=2024-01-01&to=2024-12-31';
  } else if (timeFilter?.value === '2025') {
    toFromQuery = '?from=2025-01-01&to=2025-12-31';
  }

  const url = ref(`http://localhost:3000/v1/accounts${toFromQuery}`);

  watch(timeFilter, () => {
    console.log('Updating URL:', timeFilter?.value);
    if (timeFilter?.value === '2024') {
      toFromQuery = `?from=2024-01-01&to=2024-12-31`;
    } else if (timeFilter?.value === '2025') {
      toFromQuery = `?from=2025-01-01&to=2025-12-31`;
    } else {
      toFromQuery = '';
    }
    url.value = `http://localhost:3000/v1/accounts${toFromQuery}`;
    console.log('Updated URL:', url.value);
  });

  const {
    isFetching,
    error,
    data,
    execute: refetchAccounts,
  } = useFetch<any[]>(url, { refetch: true }).json();

  const createAccount = async (account: CreateAccount) => {
    await fetch('http://localhost:3000/v1/accounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
