<template>
  <div class="p-8">
    <div v-if="!isFetching">
      <div>
        <h2 class="text-2xl font-semibold pb-4">
          {{ t('views.account.title', { accountName: account.name }) }}
          <span
            :class="`badge badge-sm ${
              account.balance >= 0 ? 'badge-success' : 'badge-error'
            }`"
          >
            {{ formatCurrency(account.balance, account.currency) }}
          </span>
        </h2>
      </div>
      <div class="divider"></div>
      <div>
        <h3 class="text-lg">{{ t('views.account.transactions.title') }}</h3>
        <div class="overflow-x-auto">
          <table class="table table-zebra w-full">
            <thead>
              <tr>
                <th>{{ t('views.account.transactions.table.date') }}</th>
                <th style="width: 4rem">
                  {{ t('views.account.transactions.table.description') }}
                </th>
                <th>
                  {{ t('views.account.transactions.table.otherAccount') }}
                </th>
                <th>{{ t('views.account.transactions.table.amount') }}</th>
              </tr>
            </thead>
            <tbody>
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
                  >
                    {{ formatCurrency(transaction.amount, account.currency) }}
                  </span>
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
import { useRoute } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import { useConstant } from '../composables/useConstant';
import { useCurrency } from '../composables/useCurrency';
import { useLanguage } from '../composables/useLanguage';

const { URI } = useConstant();

const { t } = useLanguage();

const { formatCurrency } = useCurrency();

const route = useRoute();

const { getAccessToken } = useAuth();

const accountId = route.params.id;

const { isFetching, data: account } = useQuery({
  queryKey: ['accounts', accountId],
  staleTime: 1000 * 60 * 1,
  queryFn: async (): Promise<any> =>
    await fetch(`${URI.API}/v1/accounts/${accountId}`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    }).then((response) => response.json()),
});
</script>
