<template>
  <div class="min-h-screen bg-primary">
    <!-- Header Section -->
    <PageHeader
      :title="t('views.importTransactions.title')"
      :subtitle="t('views.importTransactions.subtitle')"
    >
      <template #extra>
        <div class="flex items-center gap-4">
          <div class="stats stats-horizontal bg-primary-600/10">
            <div class="stat">
              <div class="stat-title text-muted">
                {{ t('views.importTransactions.pendingTransactions') }}
              </div>
              <div class="stat-value text-primary-400">
                {{ draftTransactions?.length || 0 }}
              </div>
            </div>
          </div>
        </div>
      </template>
    </PageHeader>

    <div
      class="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-none xl:max-w-screen-2xl"
    >
      <!-- Import Form Card -->
      <div class="card bg-secondary shadow-xl mb-6 sm:mb-8">
        <div class="p-1.5 sm:p-2">
          <h2 class="card-title text-2xl mb-6">
            <RiFileTextLine class="w-8 h-8 mr-3" />
            {{ t('views.importTransactions.importForm.title') }}
          </h2>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Configuration Section -->
            <div class="space-y-6">
              <div>
                <BaseSelect
                  v-model="accountId"
                  :label="
                    t('views.importTransactions.importForm.account.label')
                  "
                  :placeholder="
                    t('views.importTransactions.importForm.account.placeholder')
                  "
                  :help-text="
                    t('views.importTransactions.importForm.account.help')
                  "
                  size="lg"
                  variant="bordered"
                >
                  <template #options>
                    <option
                      v-for="account in assetsAccounts"
                      :key="account.id"
                      :value="account.id"
                    >
                      {{ account.name }} ({{ account.currency }})
                    </option>
                  </template>
                </BaseSelect>
              </div>

              <div>
                <BaseSelect
                  v-model="importType"
                  :label="t('views.importTransactions.importForm.issuer.label')"
                  :placeholder="
                    t('views.importTransactions.importForm.issuer.placeholder')
                  "
                  size="lg"
                  variant="bordered"
                >
                  <template #options>
                    <option value="SWISSCARD">Swisscard - Credit Cards</option>
                    <option value="YUH">Yuh - Banking & Investment</option>
                    <option value="POSTFINANCE">
                      PostFinance - Swiss Bank
                    </option>
                    <option value="WISE">Wise - International Transfers</option>
                  </template>
                </BaseSelect>
                <p class="text-xs text-muted mt-1">
                  <i18n-t
                    tag="span"
                    keypath="views.importTransactions.importForm.issuer.footer.text"
                  >
                    <a
                      href="https://github.com/mydonapp/mydon/issues"
                      target="_blank"
                      class="text-primary-600 hover:text-primary-700 underline"
                    >
                      {{
                        t(
                          'views.importTransactions.importForm.issuer.footer.link',
                        )
                      }}
                    </a>
                  </i18n-t>
                </p>
              </div>
            </div>

            <!-- File Upload Section -->
            <div class="space-y-6">
              <BaseFileInput
                :label="t('views.importTransactions.importForm.upload.label')"
                accept=".csv"
                :hint="t('views.importTransactions.importForm.upload.help')"
                size="lg"
                variant="bordered"
                @change="handleFileChange"
              />

              <!-- Button positioned to align with the bottom of the issuer select -->
              <div class="mt-14">
                <BaseButton
                  variant="primary"
                  size="lg"
                  class="w-full"
                  :disabled="
                    !fileContent || !accountId || !importType || isLoading
                  "
                  :loading="isLoading"
                  @click="importTransactions"
                >
                  <RiUploadLine class="w-5 h-5 mr-2" />
                  {{ t('views.importTransactions.importForm.submit.label') }}
                </BaseButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Draft Transactions Section -->
      <div
        v-if="draftTransactions && draftTransactions.length > 0"
        class="card bg-secondary shadow-xl"
      >
        <div class="p-1.5 sm:p-2">
          <div class="flex items-center justify-between mb-6">
            <h2 class="card-title text-2xl">
              <RiFileTextLine class="w-8 h-8 mr-3" />
              {{ t('views.importTransactions.draftTransactions.title') }}
              <div class="badge badge-warning">
                {{ draftTransactions.length }}
              </div>
            </h2>

            <div class="flex gap-2">
              <BaseButton
                variant="secondary"
                size="sm"
                @click="selectAll = !selectAll"
              >
                {{
                  selectAll
                    ? t(
                        'views.importTransactions.draftTransactions.deselectAll',
                      )
                    : t('views.importTransactions.draftTransactions.selectAll')
                }}
              </BaseButton>
              <BaseButton
                variant="success"
                size="sm"
                :disabled="!transactions.some((t) => t.selected)"
                @click="updateDraft"
              >
                <RiSaveLine class="w-4 h-4 mr-2" />
                {{ t('views.importTransactions.draftTransactions.approve') }}
                ({{ transactions.filter((t) => t.selected).length }})
              </BaseButton>
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
                  <th>
                    {{
                      t('views.importTransactions.draftTransactions.table.date')
                    }}
                  </th>
                  <th>
                    {{
                      t(
                        'views.importTransactions.draftTransactions.table.description',
                      )
                    }}
                  </th>
                  <th>
                    {{
                      t(
                        'views.importTransactions.draftTransactions.table.creditAccount',
                      )
                    }}
                  </th>
                  <th>
                    {{
                      t(
                        'views.importTransactions.draftTransactions.table.debitAccount',
                      )
                    }}
                  </th>
                  <th>
                    {{
                      t(
                        'views.importTransactions.draftTransactions.table.amount',
                      )
                    }}
                  </th>
                  <th>
                    {{
                      t(
                        'views.importTransactions.draftTransactions.table.actions',
                      )
                    }}
                  </th>
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
                      {{
                        new Date(
                          transaction.transactionDate,
                        ).toLocaleDateString()
                      }}
                    </span>
                  </td>
                  <td>
                    <BaseTextarea
                      v-model="transaction.description"
                      :rows="2"
                      class="w-full min-w-64 h-16 text-sm"
                      :placeholder="
                        t(
                          'views.importTransactions.draftTransactions.table.descriptionPlaceholder',
                        )
                      "
                    />
                  </td>
                  <td>
                    <BaseSelect
                      v-model="transaction.creditAccountId"
                      :placeholder="
                        t(
                          'views.importTransactions.draftTransactions.table.selectAccount',
                        )
                      "
                      size="sm"
                      @update:model-value="
                        onAccountChange(transaction, 'credit')
                      "
                    >
                      <template #options>
                        <option
                          v-for="account in allAccounts"
                          :key="account.id"
                          :value="account.id"
                        >
                          {{ account.name }}
                        </option>
                      </template>
                    </BaseSelect>
                  </td>
                  <td>
                    <BaseSelect
                      v-model="transaction.debitAccountId"
                      :placeholder="
                        t(
                          'views.importTransactions.draftTransactions.table.selectAccount',
                        )
                      "
                      size="sm"
                      @update:model-value="
                        onAccountChange(transaction, 'debit')
                      "
                    >
                      <template #options>
                        <option
                          v-for="account in allAccounts"
                          :key="account.id"
                          :value="account.id"
                        >
                          {{ account.name }}
                        </option>
                      </template>
                    </BaseSelect>
                  </td>
                  <td>
                    <div v-if="isEqualCurrency(transaction)">
                      <BaseInput
                        v-model="transaction.amount"
                        type="number"
                        step="0.01"
                        size="sm"
                        class="w-24"
                      />
                    </div>
                    <div
                      v-else
                      class="flex flex-col gap-1"
                    >
                      <BaseInput
                        v-model="transaction.creditAmount"
                        type="number"
                        step="0.01"
                        size="sm"
                        class="w-24"
                      />
                      <BaseInput
                        v-model="transaction.debitAmount"
                        type="number"
                        step="0.01"
                        size="sm"
                        class="w-24"
                      />
                    </div>
                  </td>
                  <td>
                    <BaseButton
                      variant="danger"
                      size="sm"
                      @click="deleteTransaction(transaction.id)"
                    >
                      <RiDeleteBinLine class="w-4 h-4" />
                    </BaseButton>
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
        class="card bg-secondary shadow-xl"
      >
        <div class="p-1.5 sm:p-2 text-center py-16">
          <RiFileTextLine class="w-24 h-24 mx-auto text-muted mb-6" />
          <h3 class="text-2xl font-bold mb-4">
            {{ t('views.importTransactions.emptyState.title') }}
          </h3>
          <p class="text-base-content/60 mb-6">
            {{ t('views.importTransactions.emptyState.description') }}
          </p>
          <div class="flex flex-wrap justify-center gap-4">
            <div class="card bg-primary shadow p-1.5 sm:p-2">
              <h4 class="font-semibold mb-2">
                {{ t('views.importTransactions.emptyState.step1.title') }}
              </h4>
              <p class="text-sm text-base-content/60">
                {{ t('views.importTransactions.emptyState.step1.description') }}
              </p>
            </div>
            <div class="card bg-primary shadow p-1.5 sm:p-2">
              <h4 class="font-semibold mb-2">
                {{ t('views.importTransactions.emptyState.step2.title') }}
              </h4>
              <p class="text-sm text-base-content/60">
                {{ t('views.importTransactions.emptyState.step2.description') }}
              </p>
            </div>
            <div class="card bg-primary shadow p-1.5 sm:p-2">
              <h4 class="font-semibold mb-2">
                {{ t('views.importTransactions.emptyState.step3.title') }}
              </h4>
              <p class="text-sm text-base-content/60">
                {{ t('views.importTransactions.emptyState.step3.description') }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div
        v-else
        class="card bg-secondary shadow-xl"
      >
        <div class="p-1.5 sm:p-2">
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
import {
  RiFileTextLine,
  RiUploadLine,
  RiDeleteBinLine,
  RiSaveLine,
  RiCheckLine,
  RiErrorWarningLine,
} from '@remixicon/vue';
import PageHeader from '../components/PageHeader.vue';
import BaseButton from '../components/BaseButton.vue';
import BaseInput from '../components/BaseInput.vue';
import BaseFileInput from '../components/BaseFileInput.vue';
import BaseTextarea from '../components/BaseTextarea.vue';
import BaseSelect from '../components/BaseSelect.vue';
import { useAccounts } from '../composables/useAccounts';
import { useAuth } from '../composables/useAuth';
import { useConstant } from '../composables/useConstant';
import { useLanguage } from '../composables/useLanguage';
import { useToast } from '../composables/useToast';

const { t } = useLanguage();
const { URI } = useConstant();
const { getAccessToken } = useAuth();
const { success, error } = useToast();
const queryClient = useQueryClient();

const accountId = ref('');
const importType = ref('');
const selectAll = ref(false);
const fileContent = ref<File | null>(null);
const isLoading = ref(false);

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
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    success('Statement imported successfully!');
  },
  onError: () => {
    error('Failed to import statement. Please try again.');
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
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    success('Transaction deleted successfully!');
  },
  onError: () => {
    error('Failed to delete transaction. Please try again.');
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

const handleFileChange = (files: FileList | null) => {
  if (files && files.length > 0) {
    fileContent.value = files[0];
  } else {
    fileContent.value = null;
  }
};

const importTransactions = async () => {
  if (!fileContent.value) return;

  const data = new FormData();
  data.append('file', fileContent.value);
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
      selectedTransactions.map((transaction) => updateDraftMutate(transaction)),
    );
    // Invalidate both transactions and accounts queries to update all related views
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['accounts'] });

    success(
      `${selectedTransactions.length} transaction(s) approved successfully!`,
    );
  } catch (err) {
    console.error('Failed to update transactions:', err);
    error('Failed to update transactions. Please try again.');
  }
};
</script>
