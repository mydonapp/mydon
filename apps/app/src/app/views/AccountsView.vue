<template>
  <div class="p-8">
    <div class="flex">
      <div>
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
      </div>
      <div>
        <div class="join">
          <input
            class="join-item btn"
            type="radio"
            name="options"
            aria-label="All"
            :checked="timeFilter === 'all'"
            @click="timeFilter = 'all'"
          />
          <input
            class="join-item btn"
            type="radio"
            name="options"
            aria-label="2024"
            :checked="timeFilter === '2024'"
            @click="timeFilter = '2024'"
          />
          <input
            class="join-item btn"
            type="radio"
            name="options"
            aria-label="2025"
            :checked="timeFilter === '2025'"
            @click="timeFilter = '2025'"
          />
        </div>
      </div>
    </div>
    <div class="grid grid-cols-4 gap-8" v-if="accounts">
      <div>
        <h2 class="text-xl mb-2">Assets</h2>
        <ul class="menu bg-base-200 w-full rounded-box">
          <li v-for="account in accounts.assets.accounts" :key="account.id">
            <router-link :to="{ name: 'Account', params: { id: account.id } }"
              >{{ account.name }}
              <span v-if="account.retirementAccount"
                ><svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                >
                  <g
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    color="currentColor"
                  >
                    <path
                      d="M19.5 16v-3.994c0-1.486 0-2.23-.256-2.91c-.255-.68-.745-1.24-1.723-2.358L16 5H8L6.48 6.738C5.5 7.856 5.01 8.416 4.755 9.096s-.256 1.424-.256 2.91V16c0 2.828 0 4.243.879 5.121S7.672 22 10.5 22h3c2.828 0 4.243 0 5.121-.879c.879-.878.879-2.293.879-5.121"
                    />
                    <path
                      d="M9.5 15.683c0 1.23 1.854 2.237 3.633 1.672s1.517-2.23.913-2.884s-1.491-.544-2.506-.596c-2.281-.116-2.442-2.303-.595-3.168c1.355-.635 3.093.18 3.293 1.293m-2.267-2.5v.978m0 7.242v.78M7.5 2h9c.466 0 .699 0 .883.076a1 1 0 0 1 .54.541c.077.184.077.417.077.883s0 .699-.076.883a1 1 0 0 1-.541.54C17.199 5 16.966 5 16.5 5h-9c-.466 0-.699 0-.883-.076a1 1 0 0 1-.54-.541C6 4.199 6 3.966 6 3.5s0-.699.076-.883a1 1 0 0 1 .541-.54C6.801 2 7.034 2 7.5 2"
                    />
                  </g></svg></span
              ><span
                :class="`badge badge-sm ${
                  account.balance >= 0 ? 'badge-success' : 'badge-error'
                }`"
                >{{ formatCurrency(account.balance, account.currency) }}</span
              ></router-link
            >
          </li>
          <li>
            <a
              >Total Without Retirement:
              <span
                :class="`badge badge-sm ${
                  accounts.assets.totalWithoutRetirement >= 0
                    ? 'badge-success'
                    : 'badge-error'
                }`"
                >{{
                  formatCurrency(accounts.assets.totalWithoutRetirement, 'CHF')
                }}</span
              ></a
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

const timeFilter = ref('2025');

const { accounts, createAccount, loading } = useAccounts(timeFilter);

const { isPrivate, togglePrivacy } = usePrivacy();

const name = ref('');
const openingBalance = ref(0);
const accountType = ref('ASSETS');

const transactionDescription = ref('');
const creditAccountId = ref();
const debitAccountId = ref();
const transactionDate = ref(
  new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString()
);
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
  transactionDate.value = new Date(
    new Date().setUTCHours(0, 0, 0, 0)
  ).toISOString();
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
