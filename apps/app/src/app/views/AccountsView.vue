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
            <a
              >{{ account.name
              }}<span
                :class="`badge badge-sm ${
                  account.balance >= 0 ? 'badge-success' : 'badge-error'
                }`"
                >{{ formatCurrency(account.balance, account.currency) }}</span
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
            <a
              >{{ account.name
              }}<span
                :class="`badge badge-sm ${
                  account.balance >= 0 ? 'badge-error' : 'badge-success'
                }`"
                >{{ formatCurrency(account.balance, account.currency) }}</span
              ></a
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
            <a
              >{{ account.name
              }}<span
                :class="`badge badge-sm ${
                  account.balance >= 0 ? 'badge-success' : 'badge-error'
                }`"
                >{{ formatCurrency(account.balance, account.currency) }}</span
              ></a
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
            <a
              >{{ account.name
              }}<span
                :class="`badge badge-sm ${
                  account.balance >= 0 ? 'badge-error' : 'badge-success'
                }`"
                >{{ formatCurrency(account.balance, account.currency) }}</span
              ></a
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAccounts } from '../composables/useAccounts';
import { useCurrency } from '../composables/useCurrency';
import { usePrivacy } from '../composables/usePrivacy';

const { formatCurrency } = useCurrency();

const { accounts, createAccount, loading } = useAccounts();

const { isPrivate, togglePrivacy } = usePrivacy();

const name = ref('');
const openingBalance = ref(0);
const accountType = ref('ASSETS');

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

// const assetsAccounts = computed(
//   () =>
//     accounts.value
//       ?.filter((account) => account.type === 'ASSETS')
//       .sort((a, b) => b.balance - a.balance) || []
// );
// const liabilitiesAccounts = computed(
//   () =>
//     accounts.value
//       ?.filter((account) => account.type === 'LIABILITIES')
//       .sort((a, b) => b.balance - a.balance) || []
// );
// const incomeAccounts = computed(
//   () =>
//     accounts.value
//       ?.filter((account) => account.type === 'INCOME')
//       .sort((a, b) => b.balance - a.balance) || []
// );
// const expensesAccounts = computed(
//   () =>
//     accounts.value
//       ?.filter((account) => account.type === 'EXPENSE')
//       .sort((a, b) => b.balance - a.balance) || []
// );

// const assetsTotal = computed(() =>
//   assetsAccounts.value.reduce((acc, account) => acc + account.balance, 0)
// );

// const liabilitiesTotal = computed(() =>
//   liabilitiesAccounts.value.reduce((acc, account) => acc + account.balance, 0)
// );

// const incomeTotal = computed(() =>
//   incomeAccounts.value.reduce((acc, account) => acc + account.balance, 0)
// );

// const expensesTotal = computed(() =>
//   expensesAccounts.value.reduce((acc, account) => acc + account.balance, 0)
// );
</script>
