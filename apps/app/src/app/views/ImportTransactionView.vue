<template>
  <div class="min-h-screen bg-base-100">
    <!-- Header Section -->
    <div class="bg-gradient-to-r from-info to-info-content text-info-content">
      <div class="container mx-auto px-6 py-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold mb-2">{{ t('views.importTransactions.title') }}</h1>
            <p class="text-info-content/80">{{ t('views.importTransactions.subtitle') }}</p>
          </div>
          <div class="stats stats-horizontal bg-info-content/10">
            <div class="stat">
              <div class="stat-title text-info-content/80">{{ t('views.importTransactions.pendingTransactions') }}</div>
              <div class="stat-value text-info-content">{{ draftTransactions?.length || 0 }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-6 py-8">
      <!-- Import Form Card -->
      <div class="card bg-base-200 shadow-xl mb-8">
        <div class="card-body">
          <h2 class="card-title text-2xl mb-6">
            <svg
              class="w-8 h-8 mr-3"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
            {{ t('views.importTransactions.importForm.title') }}
          </h2>
          
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Configuration Section -->
            <div class="space-y-6">
              <div class="form-control">
                <label class="label">
                  <span class="label-text text-lg font-semibold">{{ t('views.importTransactions.importForm.account.label') }}</span>
                </label>
                <select
                  v-model="accountId"
                  class="select select-bordered select-lg w-full"
                >
                  <option
                    value=""
                    disabled
                  >
                    {{ t('views.importTransactions.importForm.account.placeholder') }}
                  </option>
                  <option
                    v-for="account in assetsAccounts"
                    :key="account.id"
                    :value="account.id"
                  >
                    {{ account.name }} ({{ account.currency }})
                  </option>
                </select>
                <label class="label">
                  <span class="label-text-alt">{{ t('views.importTransactions.importForm.account.help') }}</span>
                </label>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text text-lg font-semibold">{{ t('views.importTransactions.importForm.issuer.label') }}</span>
                </label>
                <select
                  v-model="importType"
                  class="select select-bordered select-lg w-full"
                >
                  <option
                    value=""
                    disabled
                  >
                    {{ t('views.importTransactions.importForm.issuer.placeholder') }}
                  </option>
                  <option value="SWISSCARD">
                    <span class="flex items-center">
                      <span class="font-semibold">Swisscard</span> - Credit Cards
                    </span>
                  </option>
                  <option value="YUH">
                    <span class="flex items-center">
                      <span class="font-semibold">Yuh</span> - Banking & Investment
                    </span>
                  </option>
                  <option value="POSTFINANCE">
                    <span class="flex items-center">
                      <span class="font-semibold">PostFinance</span> - Swiss Bank
                    </span>
                  </option>
                  <option value="WISE">
                    <span class="flex items-center">
                      <span class="font-semibold">Wise</span> - International Transfers
                    </span>
                  </option>
                </select>
                <label class="label">
                  <span class="label-text-alt">
                    <i18n-t
                      tag="span"
                      keypath="views.importTransactions.importForm.issuer.footer.text"
                    >
                      <a
                        href="https://github.com/mydonapp/mydon/issues"
                        target="_blank"
                        class="link link-primary"
                      >
                        {{ t('views.importTransactions.importForm.issuer.footer.link') }}
                      </a>
                    </i18n-t>
                  </span>
                </label>
              </div>
            </div>

            <!-- File Upload Section -->
            <div class="space-y-6">
              <div class="form-control">
                <label class="label">
                  <span class="label-text text-lg font-semibold">{{ t('views.importTransactions.importForm.upload.label') }}</span>
                </label>
                <input
                  type="file"
                  class="file-input file-input-bordered file-input-lg w-full"
                  accept=".csv"
                />
                <label class="label">
                  <span class="label-text-alt">{{ t('views.importTransactions.importForm.upload.help') }}</span>
                </label>
              </div>

              <div class="alert alert-info">
                <svg
                  class="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z" />
                </svg>
                <div>
                  <h3 class="font-bold">{{ t('views.importTransactions.importForm.tip.title') }}</h3>
                  <div class="text-xs">{{ t('views.importTransactions.importForm.tip.description') }}</div>
                </div>
              </div>

              <button
                class="btn btn-primary btn-lg w-full"
                :disabled="!accountId || !importType"
                @click="importTransactions"
              >
                <svg
                  class="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M5,20H19V18H5M19,9H15L13,7H9V9H5L12,16L19,9Z" />
                </svg>
                {{ t('views.importTransactions.importForm.submit.label') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Draft Transactions Section -->
      <div
        v-if="draftTransactions && draftTransactions.length > 0"
        class="card bg-base-200 shadow-xl"
      >
        <div class="card-body">
          <div class="flex items-center justify-between mb-6">
            <h2 class="card-title text-2xl">
              <svg
                class="w-8 h-8 mr-3"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,5V7H5V5H19M5,19V9H19V19H5M11,11H13V17H11V11M15,11H17V17H15V11M7,11H9V17H7V11Z" />
              </svg>
              {{ t('views.importTransactions.draftTransactions.title') }}
              <div class="badge badge-warning">{{ draftTransactions.length }}</div>
            </h2>
            
            <div class="flex gap-2">
              <button
                class="btn btn-outline btn-sm"
                @click="selectAll = !selectAll"
              >
                {{ selectAll ? t('views.importTransactions.draftTransactions.deselectAll') : t('views.importTransactions.draftTransactions.selectAll') }}
              </button>
              <button
                class="btn btn-success btn-sm"
                :disabled="!transactions.some(t => t.selected)"
                @click="updateDraft"
              >
                <svg
                  class="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
                </svg>
                {{ t('views.importTransactions.draftTransactions.approve') }} ({{ transactions.filter(t => t.selected).length }})
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th>
                    <label>
                      <input
                        v-model="selectAll"
                        type="checkbox"
                        class="checkbox"
                      />
                    </label>
                  </th>
                  <th>{{ t('views.importTransactions.draftTransactions.table.date') }}</th>
                  <th>{{ t('views.importTransactions.draftTransactions.table.description') }}</th>
                  <th>{{ t('views.importTransactions.draftTransactions.table.creditAccount') }}</th>
                  <th>{{ t('views.importTransactions.draftTransactions.table.debitAccount') }}</th>
                  <th>{{ t('views.importTransactions.draftTransactions.table.amount') }}</th>
                  <th>{{ t('views.importTransactions.draftTransactions.table.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="transaction in transactions"
                  :key="transaction.id"
                  :class="{ 'bg-success/10': transaction.selected }"
                >
                  <td>
                    <label>
                      <input
                        v-model="transaction.selected"
                        type="checkbox"
                        class="checkbox"
                      />
                    </label>
                  </td>
                  <td>
                    <span class="text-sm">
                      {{ new Date(transaction.transactionDate).toLocaleDateString() }}
                    </span>
                  </td>
                  <td>
                    <input
                      v-model="transaction.description"
                      type="text"
                      class="input input-sm input-ghost w-full max-w-xs"
                    />
                  </td>
                  <td>
                    <select
                      v-model="transaction.creditAccountId"
                      class="select select-sm select-bordered w-full max-w-xs"
                      @change="onAccountChange(transaction, 'credit')"
                    >
                      <option :value="undefined">
                        {{ t('views.importTransactions.draftTransactions.table.selectAccount') }}
                      </option>
                      <option
                        v-for="account in allAccounts"
                        :key="account.id"
                        :value="account.id"
                      >
                        {{ account.name }}
                      </option>
                    </select>
                  </td>
                  <td>
                    <select
                      v-model="transaction.debitAccountId"
                      class="select select-sm select-bordered w-full max-w-xs"
                      @change="onAccountChange(transaction, 'debit')"
                    >
                      <option :value="undefined">
                        {{ t('views.importTransactions.draftTransactions.table.selectAccount') }}
                      </option>
                      <option
                        v-for="account in allAccounts"
                        :key="account.id"
                        :value="account.id"
                      >
                        {{ account.name }}
                      </option>
                    </select>
                  </td>
                  <td>
                    <div v-if="isEqualCurrency(transaction)">
                      <input
                        v-model="transaction.amount"
                        type="number"
                        step="0.01"
                        class="input input-sm input-bordered w-24"
                      />
                    </div>
                    <div
                      v-else
                      class="flex flex-col gap-1"
                    >
                      <input
                        v-model="transaction.creditAmount"
                        type="number"
                        step="0.01"
                        class="input input-sm input-bordered w-24"
                      />
                      <input
                        v-model="transaction.debitAmount"
                        type="number"
                        step="0.01"
                        class="input input-sm input-bordered w-24"
                      />
                    </div>
                  </td>
                  <td>
                    <button
                      class="btn btn-error btn-sm"
                      @click="deleteTransaction(transaction.id)"
                    >
                      <svg
                        class="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="draftTransactions"
        class="card bg-base-200 shadow-xl"
      >
        <div class="card-body text-center py-16">
          <svg
            class="w-24 h-24 mx-auto text-base-content/30 mb-6"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          </svg>
          <h3 class="text-2xl font-bold mb-4">{{ t('views.importTransactions.emptyState.title') }}</h3>
          <p class="text-base-content/60 mb-6">{{ t('views.importTransactions.emptyState.description') }}</p>
          <div class="flex flex-wrap justify-center gap-4">
            <div class="card bg-base-100 shadow p-4">
              <h4 class="font-semibold mb-2">{{ t('views.importTransactions.emptyState.step1.title') }}</h4>
              <p class="text-sm text-base-content/60">{{ t('views.importTransactions.emptyState.step1.description') }}</p>
            </div>
            <div class="card bg-base-100 shadow p-4">
              <h4 class="font-semibold mb-2">{{ t('views.importTransactions.emptyState.step2.title') }}</h4>
              <p class="text-sm text-base-content/60">{{ t('views.importTransactions.emptyState.step2.description') }}</p>
            </div>
            <div class="card bg-base-100 shadow p-4">
              <h4 class="font-semibold mb-2">{{ t('views.importTransactions.emptyState.step3.title') }}</h4>
              <p class="text-sm text-base-content/60">{{ t('views.importTransactions.emptyState.step3.description') }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div
        v-else
        class="card bg-base-200 shadow-xl"
      >
        <div class="card-body">
          <div class="flex items-center justify-between mb-6">
            <div class="skeleton h-8 w-64"></div>
            <div class="skeleton h-8 w-32"></div>
          </div>
          <div class="space-y-4">
            <div class="skeleton h-12 w-full"></div>
            <div class="skeleton h-12 w-full"></div>
            <div class="skeleton h-12 w-full"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { useFetch } from '@vueuse/core';
import { computed, ref, watch, watchEffect } from 'vue';
import { useAccounts } from '../composables/useAccounts';
import { useAuth } from '../composables/useAuth';
import { useConstant } from '../composables/useConstant';
import { useLanguage } from '../composables/useLanguage';

const { t } = useLanguage();
const { URI } = useConstant();
const { getAccessToken } = useAuth();
const queryClient = useQueryClient();

const accountId = ref('');
const importType = ref('');
const selectAll = ref(false);

const { mutate } = useMutation({
  mutationFn: async (data: FormData) => {
    const response = await fetch(`${URI.API}/v1/statements/import`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: data,
    });
    return response.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  },
});

const { mutateAsync: deleteTransactionMutation } = useMutation({
  mutationFn: async (id: string) => {
    return await fetch(`${URI.API}/v1/transactions/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  },
});

const { data: draftTransactions } = useQuery({
  queryKey: ['transactions', { filter: 'draft' }],
  staleTime: 1000 * 60 * 1,
  queryFn: async (): Promise<any[]> =>
    await fetch(`${URI.API}/v1/transactions?filter=draft`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    }).then((response) => response.json()),
});

const transactions = ref([]);

watchEffect(() => {
  if (transactions.value?.length === 0 && draftTransactions.value) {
    transactions.value = draftTransactions?.value
      ?.map((transaction) => {
        return {
          id: transaction.id,
          description: transaction.description,
          creditAccountId: transaction.creditAccountId || undefined,
          debitAccountId: transaction.debitAccountId || undefined,
          creditAmount: transaction.creditAmount,
          debitAmount: transaction.debitAmount,
          amount: transaction.creditAmount,
          selected: selectAll,
          transactionDate: transaction.transactionDate,
        };
      })
      .sort((a, b) => a.transactionDate.localeCompare(b.transactionDate));
  }
});

watch(
  () => selectAll.value,
  () => {
    transactions.value = transactions.value?.map((transaction) => {
      return {
        ...transaction,
        selected: selectAll.value,
      };
    });
  },
);

const importTransactions = async () => {
  const input = document.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
  if (!input.files?.[0]) return;
  
  const data = new FormData();
  data.append('file', input.files[0]);
  data.append('accountId', accountId.value);
  data.append('statementIssuer', importType.value);

  mutate(data);
};

const deleteTransaction = (id: string) => {
  deleteTransactionMutation(id);
};

const { accounts } = useAccounts();

const assetsAccounts = computed(() => accounts?.value?.assets?.accounts || []);
const allAccounts = computed(() => [
  ...(accounts?.value?.assets?.accounts || []),
  ...(accounts?.value?.liabilities?.accounts || []),
  ...(accounts?.value?.income?.accounts || []),
  ...(accounts?.value?.expense?.accounts || []),
]);

const isEqualCurrency = (transaction) => {
  const debitCurrency = allAccounts.value.find(
    (account) => account.id === transaction.debitAccountId,
  )?.currency;
  const creditCurrency = allAccounts.value.find(
    (account) => account.id === transaction.creditAccountId,
  )?.currency;

  if (!debitCurrency || !creditCurrency) return true;

  return debitCurrency === creditCurrency;
};

const getCurrencyAmount = async (
  amount: number,
  from: string,
  to: string,
  date: string,
) => {
  const { data } = await useFetch<any>(
    `${URI.API}/v1/currency/convert?from=${from}&to=${to}&amount=${amount}&date=${date}`,
    {
      beforeFetch({ options }) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${getAccessToken()}`,
        };

        return {
          options,
        };
      },
    },
  ).json();

  return data.value;
};

const onAccountChange = async (transaction, type: 'credit' | 'debit') => {
  const isEqual = isEqualCurrency(transaction);

  if (isEqual) {
    return;
  }

  if (type === 'credit') {
    transaction.creditAmount = await getCurrencyAmount(
      transaction.debitAmount,
      allAccounts.value.find(
        (account) => account.id === transaction.debitAccountId,
      )?.currency,
      allAccounts.value.find(
        (account) => account.id === transaction.creditAccountId,
      )?.currency,
      transaction.transactionDate,
    );
  } else {
    transaction.debitAmount = await getCurrencyAmount(
      transaction.creditAmount,
      allAccounts.value.find(
        (account) => account.id === transaction.creditAccountId,
      )?.currency,
      allAccounts.value.find(
        (account) => account.id === transaction.debitAccountId,
      )?.currency,
      transaction.transactionDate,
    );
  }
};

const { mutateAsync: updateDraftMutate } = useMutation({
  mutationFn: async (transaction: any) => {
    const getAmount = (transaction) => {
      const debitCurrency = allAccounts.value.find(
        (account) => account.id === transaction.debitAccountId,
      )?.currency;
      const creditCurrency = allAccounts.value.find(
        (account) => account.id === transaction.creditAccountId,
      )?.currency;

      if (debitCurrency === creditCurrency) {
        return {
          creditAmount: parseFloat(transaction.amount),
          debitAmount: parseFloat(transaction.amount),
        };
      } else {
        return {
          creditAmount: parseFloat(transaction.creditAmount),
          debitAmount: parseFloat(transaction.debitAmount),
        };
      }
    };

    return await useFetch(`${URI.API}/v1/transactions/${transaction.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify({
        description: transaction.description,
        creditAccountId: transaction.creditAccountId,
        debitAccountId: transaction.debitAccountId,
        ...getAmount(transaction),
        draft: false,
      }),
    });
  },
});

const updateDraft = async () => {
  const selectedTransactions = transactions.value?.filter(
    (transaction) => transaction.selected,
  );

  if (!selectedTransactions || selectedTransactions.length === 0) return;

  try {
    await Promise.all(
      selectedTransactions.map((transaction) =>
        updateDraftMutate(transaction),
      ),
    );
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  } catch (error) {
    console.error('Failed to update transactions:', error);
  }
};
</script>
