<template>
  <div class="p-8">
    <label class="swap">
      <input type="checkbox" v-model="isPrivate" />
      <svg
        class="w-6 h-6 text-gray-800 dark:text-white swap-off"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          stroke="currentColor"
          stroke-width="2"
          d="M21 12c0 1.2-4 6-9 6s-9-4.8-9-6c0-1.2 4-6 9-6s9 4.8 9 6Z"
        />
        <path
          stroke="currentColor"
          stroke-width="2"
          d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        />
      </svg>

      <svg
        class="w-6 h-6 text-gray-800 dark:text-white swap-on"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 14c-.5-.6-.9-1.3-1-2 0-1 4-6 9-6m7.6 3.8A5 5 0 0 1 21 12c0 1-3 6-9 6h-1m-6 1L19 5m-4 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        />
      </svg>
    </label>
    <div class="grid grid-cols-4 gap-8" v-if="accounts">
      <div>
        <h2 class="text-xl mb-2">Assets</h2>
        <ul class="menu bg-base-200 w-full rounded-box">
          <li v-for="account in accounts.assets.accounts" :key="account.id">
            <router-link :to="{ name: 'Account', params: { id: account.id } }"
              >{{ account.name
              }}<span
                :class="`badge badge-sm ${
                  account.balance >= 0 ? 'badge-success' : 'badge-error'
                }`"
                >{{ formatCurrency(account.balance, account.currency) }}</span
              ></router-link
            >
          </li>
          <li>
            <a
              >Total:
              <span
                :class="`badge badge-sm ${
                  accounts.assets.total >= 0 ? 'badge-success' : 'badge-error'
                }`"
                >{{ formatCurrency(accounts.assets.total, 'CHF') }}</span
              ></a
            >
          </li>
        </ul>
      </div>
      <div>
        <h2>Liabilities</h2>
        <ul class="menu bg-base-200 w-full rounded-box">
          <li
            v-for="account in accounts.liabilities.accounts"
            :key="account.id"
          >
            <router-link :to="{ name: 'Account', params: { id: account.id } }"
              >{{ account.name
              }}<span
                :class="`badge badge-sm ${
                  account.balance >= 0 ? 'badge-error' : 'badge-success'
                }`"
                >{{ formatCurrency(account.balance, account.currency) }}</span
              ></router-link
            >
          </li>
          <li>
            <a
              >Total:
              <span
                :class="`badge badge-sm ${
                  accounts.liabilities.total >= 0
                    ? 'badge-success'
                    : 'badge-error'
                }`"
                >{{ formatCurrency(accounts.liabilities.total, 'CHF') }}</span
              ></a
            >
          </li>
        </ul>
      </div>
      <div>
        <h2>Income</h2>
        <ul class="menu bg-base-200 w-full rounded-box">
          <li v-for="account in accounts.income.accounts" :key="account.id">
            <router-link :to="{ name: 'Account', params: { id: account.id } }"
              >{{ account.name
              }}<span
                :class="`badge badge-sm ${
                  account.balance >= 0 ? 'badge-success' : 'badge-error'
                }`"
                >{{ formatCurrency(account.balance, account.currency) }}</span
              ></router-link
            >
          </li>
          <li>
            <a
              >Total:
              <span
                :class="`badge badge-sm ${
                  accounts.income.total >= 0 ? 'badge-success' : 'badge-error'
                }`"
                >{{ formatCurrency(accounts.income.total, 'CHF') }}</span
              ></a
            >
          </li>
        </ul>
      </div>
      <div>
        <h2>Expenses</h2>
        <ul class="menu bg-base-200 w-full rounded-box">
          <li v-for="account in accounts.expense.accounts" :key="account.id">
            <router-link :to="{ name: 'Account', params: { id: account.id } }"
              >{{ account.name
              }}<span
                :class="`badge badge-sm ${
                  account.balance >= 0 ? 'badge-error' : 'badge-success'
                }`"
                >{{ formatCurrency(account.balance, account.currency) }}</span
              ></router-link
            >
          </li>
          <li>
            <a
              >Total:
              <span
                :class="`badge badge-sm ${
                  accounts.expense.total >= 0 ? 'badge-error' : 'badge-success'
                }`"
                >{{ formatCurrency(accounts.expense.total, 'CHF') }}</span
              ></a
            >
          </li>
        </ul>
      </div>
    </div>

    <div class="divider"></div>
    <h2 class="text-lg pb-4">Add Account</h2>
    <div class="flex flex-col gap">
      <label class="form-control w-full max-w-xs">
        <div class="label">
          <span class="label-text">Account Name</span>
        </div>
        <input
          type="text"
          placeholder=""
          class="input input-bordered w-full max-w-xs"
          v-model="name"
        />
      </label>
      <label class="form-control w-full max-w-xs">
        <div class="label">
          <span class="label-text">Opening Balance</span>
        </div>
        <input
          type="number"
          placeholder="openingBalance"
          class="input input-bordered w-full max-w-xs"
          v-model="openingBalance"
        />
      </label>
      <label class="form-control w-full max-w-xs">
        <div class="label">
          <span class="label-text">Account Type</span>
        </div>
        <select
          class="select select-bordered w-full max-w-xs"
          v-model="accountType"
        >
          <option>ASSETS</option>
          <option>LIABILITIES</option>
          <option>INCOME</option>
          <option>EXPENSE</option>
        </select>
      </label>
      <button class="btn btn-primary max-w-xs mt-6" @click="addAccount">
        Add
      </button>
    </div>
    <div>
      <input
        type="text"
        placeholder="Enter a description"
        class="input w-full select-bordered"
        v-model="transactionDate"
      />

      <input
        type="text"
        placeholder="Enter a description"
        class="input w-full select-bordered"
        v-model="transactionDescription"
      />

      <select
        class="select select-bordered w-full max-w-xs"
        v-model="creditAccountId"
      >
        <option :value="undefined">Select Account</option>
        <option
          v-for="account in allAccounts"
          :key="account.id"
          :value="account.id"
        >
          {{ account.name }}
        </option>
      </select>

      <select
        class="select select-bordered w-full max-w-xs"
        v-model="debitAccountId"
      >
        <option :value="undefined">Select Account</option>
        <option
          v-for="account in allAccounts"
          :key="account.id"
          :value="account.id"
        >
          {{ account.name }}
        </option>
      </select>
      <div>
        <input
          type="number"
          placeholder="Enter an amount"
          class="input w-full select-bordered"
          v-model="transactionAmount"
        />
      </div>
      <button class="btn btn-primary max-w-xs mt-6" @click="createTransaction">
        Create Transaction
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAccounts } from '../composables/useAccounts';
import { useCurrency } from '../composables/useCurrency';
import { usePrivacy } from '../composables/usePrivacy';
import { useMutation } from '@tanstack/vue-query';
import { useFetch } from '@vueuse/core';

const { formatCurrency } = useCurrency();

const { accounts, createAccount, loading } = useAccounts();

const { isPrivate, togglePrivacy } = usePrivacy();

const name = ref('');
const openingBalance = ref(0);
const accountType = ref('ASSETS');

const transactionDescription = ref('');
const creditAccountId = ref();
const debitAccountId = ref();
const transactionDate = ref(new Date().toISOString());
const transactionAmount = ref(0);

const allAccounts = computed(() => [
  ...(accounts?.value?.assets?.accounts || []),
  ...(accounts?.value?.liabilities?.accounts || []),
  ...(accounts?.value?.income?.accounts || []),
  ...(accounts?.value?.expense?.accounts || []),
]);

const addAccount = () => {
  createAccount({
    name: name.value,
    openingBalance: openingBalance.value,
    type: accountType.value,
  });
  name.value = '';
  openingBalance.value = 0;
  accountType.value = 'ASSETS';
};

const createTransaction = async () => {
  await createTransactionMutation({
    creditAmount: transactionAmount.value,
    debitAmount: transactionAmount.value,
    description: transactionDescription.value,
    creditAccountId: creditAccountId.value,
    debitAccountId: debitAccountId.value,
    transactionDate: transactionDate.value,
  });

  transactionDescription.value = '';
  creditAccountId.value = undefined;
  debitAccountId.value = undefined;
  transactionDate.value = new Date().toISOString();
  transactionAmount.value = 0;
};

const { mutateAsync: createTransactionMutation } = useMutation({
  mutationFn: async (data: {
    creditAmount: number;
    debitAmount: number;
    description: string;
    creditAccountId: string;
    debitAccountId: string;
    transactionDate: string;
  }) => {
    return await useFetch(`http://localhost:3000/v1/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creditAmount: data.creditAmount,
        debitAmount: data.debitAmount,
        description: data.description,
        creditAccountId: data.creditAccountId,
        debitAccountId: data.debitAccountId,
        transactionDate: data.transactionDate,
      }),
    });
  },
});
</script>
