import { useFetch } from '@vueuse/core';

interface CreateAccount {
  name: string;
  openingBalance: number;
  type: string;
}

export const useAccounts = () => {
  const {
    isFetching,
    error,
    data,
    execute: refetchAccounts,
  } = useFetch<any[]>('http://localhost:3000/v1/accounts').json();

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
