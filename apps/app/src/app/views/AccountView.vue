<template>
  <div class="p-8">
    <div v-if="!isFetching">
      <div>
        <h2 class="text-2xl font-semibold pb-4">
          Account: {{ account.name }}
          <span
            :class="`badge badge-sm ${
              account.balance >= 0 ? 'badge-success' : 'badge-error'
            }`"
            >{{ formatCurrency(account.balance, account.currency) }}</span
          >
        </h2>
      </div>
      <div class="divider"></div>
      <div>
        <h3 class="text-lg">All Transactions</h3>
        <div class="overflow-x-auto">
          <table class="table table-zebra w-full">
            <!-- head -->
            <thead>
              <tr>
                <th>Transaction Date</th>
                <th style="width: 4rem">Description</th>
                <th>Opposite Account</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <!-- row 1 -->
              <tr
                v-for="transaction in account.transactions"
                :key="transaction.id"
                class="hover"
              >
                <th>
                  {{
                    new Date(transaction.transactionDate).toLocaleDateString()
                  }}
                </th>
                <td
                  class="max-w-[70rem]"
                  style="
                    overflow: hidden;
                    text-overflow: ellipsis;
                    text-wrap: nowrap;
                  "
                >
                  {{ transaction.description }}
                </td>
                <td>{{ transaction.counterAccount.name }}</td>
                <td>
                  <span
                    :class="`badge badge-sm ${
                      transaction.amount >= 0 ? 'badge-success' : 'badge-error'
                    }`"
                    >{{
                      formatCurrency(transaction.amount, account.currency)
                    }}</span
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useCurrency } from '../composables/useCurrency';
import { useAuth } from '../composables/useAuth';

const { formatCurrency } = useCurrency();

const route = useRoute();

const { getAccessToken } = useAuth();

const accountId = route.params.id;

// watch(
//   () => accountId,
//   () => {
//     refetch();
//   }
// );

const {
  isPending,
  isError,
  isFetching,
  data: account,
  error,
  refetch,
} = useQuery({
  queryKey: ['accounts', accountId],
  staleTime: 1000 * 60 * 1,
  queryFn: async (): Promise<any> =>
    await fetch(`http://localhost:3000/v1/accounts/${accountId}`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    }).then((response) => response.json()),
});
</script>
