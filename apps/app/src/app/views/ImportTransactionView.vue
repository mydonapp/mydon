<template>
  <div class="p-4">
    <div>
      <h1 class="text-2xl">Import Transactions</h1>
      <div>
        <label class="form-control w-full max-w-xs">
          <div class="label">
            <span class="label-text">Import Account</span>
          </div>
          <select
            class="select select-bordered w-full max-w-xs"
            v-model="accountId"
          >
            <option
              v-for="account in assetsAccounts"
              :key="account.id"
              :value="account.id"
            >
              {{ account.name }}
            </option>
          </select>
        </label>
        <label class="form-control w-full max-w-xs">
          <div class="label">
            <span class="label-text">Import Statement Issuer</span>
          </div>
          <select
            class="select select-bordered w-full max-w-xs"
            v-model="importType"
          >
            <option value="SWISSCARD">Swisscard</option>
            <option value="YUH">Yuh</option>
            <option value="POSTFINANCE">Postfinance</option>
            <option value="WISE">Wise</option>
          </select>
        </label>
        <label class="form-control w-full max-w-xs">
          <div class="label">
            <span class="label-text">Select CSV file</span>
          </div>
          <input
            type="file"
            class="file-input file-input-bordered w-full max-w-xs"
            accept=".csv"
          />
        </label>
        <button
          class="btn btn-primary max-w-xs mt-6"
          @click="importTransactions"
        >
          Import
        </button>
      </div>
    </div>
    <div class="divider"></div>
    <div>
      <h1 class="text-2xl">Draft Transactions</h1>
      <button class="btn btn-primary max-w-xs mt-6" @click="updateDraft">
        Update
      </button>
      <div class="overflow-x-auto">
        <table class="table">
          <!-- head -->
          <thead>
            <tr>
              <th>
                <label>
                  <input type="checkbox" class="checkbox" v-model="selectAll" />
                </label>
              </th>
              <th>Transaction Date</th>
              <th>Description</th>
              <th>Credit Account</th>
              <th>Debit Account</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="transaction in transactions" :key="transaction.id">
              <th>
                <label>
                  <input
                    type="checkbox"
                    class="checkbox"
                    v-model="transaction.selected"
                  />
                </label>
              </th>
              <td>
                {{ new Date(transaction.transactionDate).toLocaleDateString() }}
              </td>
              <td>
                <input
                  type="text"
                  placeholder="Enter a description"
                  class="input w-full select-bordered"
                  v-model="transaction.description"
                />
              </td>
              <td>
                <select
                  class="select select-bordered w-full max-w-xs"
                  v-model="transaction.creditAccountId"
                >
                  <option :value="undefined">Select Account</option>
                  <option
                    v-for="account in accounts"
                    :key="account.id"
                    :value="account.id"
                  >
                    {{ account.name }}
                  </option>
                </select>
              </td>
              <td>
                <select
                  class="select select-bordered w-full max-w-xs"
                  v-model="transaction.debitAccountId"
                >
                  <option :value="undefined">Select Account</option>
                  <option
                    v-for="account in accounts"
                    :key="account.id"
                    :value="account.id"
                  >
                    {{ account.name }}
                  </option>
                </select>
              </td>
              <td>
                <input
                  type="number"
                  placeholder="Enter an amount"
                  class="input w-full select-bordered"
                  v-model="transaction.amount"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue';
import { useAccounts } from '../composables/useAccounts';
import { useFetch } from '@vueuse/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';

const importType = ref('');
const accountId = ref('');

const selectAll = ref(true);

const queryClient = useQueryClient();

const { mutate } = useMutation({
  mutationFn: async (data: any) =>
    await useFetch(`http://localhost:3000/v1/statements/import`, {
      method: 'POST',
      body: data,
    }).json(),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  },
});

const importTransactions = async () => {
  var input = document.querySelector('input[type="file"]');
  var data = new FormData();
  // @ts-ignore
  data.append('file', input.files[0]);
  data.append('accountId', accountId.value);
  data.append('statementIssuer', importType.value);

  mutate(data);
};

const { accounts } = useAccounts();

const assetsAccounts = computed(
  () => accounts?.value?.filter((account) => account.type === 'ASSETS') || []
);

const {
  isPending,
  isError,
  isFetching,
  data: draftTransactions,
  error,
  refetch,
} = useQuery({
  queryKey: ['transactions', { filter: 'draft' }],
  staleTime: 1000 * 60 * 1,
  queryFn: async (): Promise<any[]> =>
    await fetch('http://localhost:3000/v1/transactions?filter=draft').then(
      (response) => response.json()
    ),
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
          amount: transaction.amount,
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
  }
);

const { mutateAsync: updateDraftMutate } = useMutation({
  mutationFn: async (transaction: any) =>
    await useFetch(`http://localhost:3000/v1/transactions/${transaction.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: transaction.description,
        creditAccountId: transaction.creditAccountId,
        debitAccountId: transaction.debitAccountId,
        amount: parseFloat(transaction.amount),
        draft: false,
      }),
    }),
});

const updateDraft = async () => {
  const selectedTransactions = transactions.value?.filter(
    (transaction) => transaction.selected
  );
  await Promise.all(
    selectedTransactions?.map(async (transaction) => {
      await updateDraftMutate(transaction);
    })
  );

  await queryClient.invalidateQueries({ queryKey: ['transactions'] });
  transactions.value = [];
};
</script>
