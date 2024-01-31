<template>
  <div class="p-8">
    <div class="grid grid-cols-4 gap-8">
      <div>
        <h2 class="text-xl mb-2">Assets</h2>
        <ul class="menu bg-base-200 w-full rounded-box">
          <li v-for="account in assetsAccounts" :key="account.id">
            <a
              >{{ account.name
              }}<span
                :class="`badge badge-sm ${
                  account.balance >= 0 ? 'badge-success' : 'badge-error'
                }`"
                >{{ formatCurrency(account.balance) }}</span
              ></a
            >
          </li>
        </ul>
      </div>
      <div>
        <h2>Liabilities</h2>
        <ul class="menu bg-base-200 w-full rounded-box">
          <li v-for="account in liabilitiesAccounts" :key="account.id">
            <a
              >{{ account.name
              }}<span
                :class="`badge badge-sm ${
                  account.balance >= 0 ? 'badge-error' : 'badge-success'
                }`"
                >{{ formatCurrency(account.balance) }}</span
              ></a
            >
          </li>
        </ul>
      </div>
      <div>
        <h2>Income</h2>
        <ul class="menu bg-base-200 w-full rounded-box">
          <li v-for="account in incomeAccounts" :key="account.id">
            <a
              >{{ account.name
              }}<span
                :class="`badge badge-sm ${
                  account.balance >= 0 ? 'badge-success' : 'badge-error'
                }`"
                >{{ formatCurrency(account.balance) }}</span
              ></a
            >
          </li>
        </ul>
      </div>
      <div>
        <h2>Expenses</h2>
        <ul class="menu bg-base-200 w-full rounded-box">
          <li v-for="account in expensesAccounts" :key="account.id">
            <a
              >{{ account.name
              }}<span
                :class="`badge badge-sm ${
                  account.balance >= 0 ? 'badge-error' : 'badge-success'
                }`"
                >{{ formatCurrency(account.balance) }}</span
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

const { formatCurrency } = useCurrency();

const { accounts, createAccount } = useAccounts();

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

const assetsAccounts = computed(
  () => accounts.value?.filter((account) => account.type === 'ASSETS') || []
);
const liabilitiesAccounts = computed(
  () =>
    accounts.value?.filter((account) => account.type === 'LIABILITIES') || []
);
const incomeAccounts = computed(
  () => accounts.value?.filter((account) => account.type === 'INCOME') || []
);
const expensesAccounts = computed(
  () => accounts.value?.filter((account) => account.type === 'EXPENSE') || []
);
</script>
