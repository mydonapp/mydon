<template>
  <div class="p-4">
    <div>
      <h1 class="text-2xl">
        {{ t('views.importTransactions.importForm.title') }}
      </h1>
      <div>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            {{ t('views.importTransactions.importForm.account.label') }}
          </legend>
          <select
            v-model="accountId"
            class="select select-bordered w-full max-w-xs"
          >
            <option
              v-for="account in assetsAccounts"
              :key="account.id"
              :value="account.id"
            >
              {{ account.name }}
            </option>
          </select>
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            {{ t('views.importTransactions.importForm.account.label') }}
          </legend>
          <select
            v-model="importType"
            class="select select-bordered w-full max-w-xs"
          >
            <option value="SWISSCARD">Swisscard</option>
            <option value="YUH">Yuh</option>
            <option value="POSTFINANCE">Postfinance</option>
            <option value="WISE">Wise</option>
          </select>
          <i18n-t
            tag="p"
            class="label"
            keypath="views.importTransactions.importForm.issuer.footer.text"
          >
            <a
              href="https://github.com/mydonapp/mydon/issues"
              target="_blank"
              class="link"
            >
              {{ t('views.importTransactions.importForm.issuer.footer.link') }}
            </a>
          </i18n-t>
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            {{ t('views.importTransactions.importForm.upload.label') }}
          </legend>
          <input
            type="file"
            class="file-input"
            accept=".csv"
          />
        </fieldset>

        <button
          class="btn btn-primary max-w-xs mt-6"
          @click="importTransactions"
        >
          {{ t('views.importTransactions.importForm.submit.label') }}
        </button>
      </div>
    </div>
    <div class="divider"></div>
    <div>
      <h1 class="text-2xl">
        {{ t('views.importTransactions.draftTransactions.title') }}
      </h1>
      <button
        class="btn btn-primary max-w-xs mt-6"
        @click="updateDraft"
      >
        Update
      </button>
      <div class="overflow-x-auto">
        <table class="table">
          <!-- head -->
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
                {{ t('views.importTransactions.draftTransactions.table.date') }}
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
                  t('views.importTransactions.draftTransactions.table.amount')
                }}
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="transaction in transactions"
              :key="transaction.id"
            >
              <th>
                <label>
                  <input
                    v-model="transaction.selected"
                    type="checkbox"
                    class="checkbox"
                  />
                </label>
              </th>
              <td>
                {{ new Date(transaction.transactionDate).toLocaleDateString() }}
              </td>
              <td>
                <textarea
                  v-model="transaction.description"
                  type="text"
                  placeholder="Enter a description"
                  class="input w-full select-bordered"
                />
              </td>
              <td>
                <select
                  v-model="transaction.creditAccountId"
                  class="select select-bordered w-full max-w-xs"
                  @change="onAccountChange(transaction, 'credit')"
                >
                  <option :value="undefined">
                    {{
                      t(
                        'views.importTransactions.draftTransactions.table.selectAccount',
                      )
                    }}
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
                  class="select select-bordered w-full max-w-xs"
                >
                  <option :value="undefined">
                    {{
                      t(
                        'views.importTransactions.draftTransactions.table.selectAccount',
                      )
                    }}
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
                    placeholder="Enter an amount"
                    class="input w-full select-bordered"
                  />
                </div>
                <div
                  v-else
                  class="flex flex-row gap-4"
                >
                  <input
                    v-model="transaction.creditAmount"
                    type="number"
                    placeholder="Enter an amount"
                    class="input w-full select-bordered"
                  />
                  <input
                    v-model="transaction.debitAmount"
                    type="number"
                    placeholder="Enter an amount"
                    class="input w-full select-bordered"
                  />
                </div>
              </td>
              <td>
                <label @click="deleteTransaction(transaction.id)">{{
                  t('views.importTransactions.draftTransactions.table.delete')
                }}</label>
              </td>
            </tr>
          </tbody>
        </table>
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

const { URI } = useConstant();

const { t } = useLanguage();

const { getAccessToken } = useAuth();

const importType = ref('');
const accountId = ref('');

const selectAll = ref(true);

const queryClient = useQueryClient();

const { mutate } = useMutation({
  mutationFn: async (data: any) =>
    await useFetch(`${URI.API}/v1/statements/import`, {
      method: 'POST',
      body: data,
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    }).json(),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  },
});

const { mutate: deleteTransactionMutation } = useMutation({
  mutationFn: async (id: string) =>
    await useFetch(`${URI.API}/v1/transactions/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    }).json(),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  },
});

const importTransactions = async () => {
  const input = document.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
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
  await Promise.all(
    selectedTransactions?.map(async (transaction) => {
      await updateDraftMutate(transaction);
    }),
  );

  await queryClient.invalidateQueries({ queryKey: ['transactions'] });
  transactions.value = [];
};
</script>
