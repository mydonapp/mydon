<template>
  <div class="min-h-screen bg-primary">
    <!-- Header Section -->
    <PageHeader
      :title="t('views.dashboard.title')"
      :subtitle="t('views.dashboard.subtitle')"
    />

    <div
      class="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-none xl:max-w-screen-2xl"
    >
      <!-- Quick Actions -->
      <div class="card">
        <div class="p-1.5 sm:p-2">
          <h2 class="card-title mb-4 text-lg sm:text-xl">
            {{ t('views.dashboard.quickActions') }}
          </h2>
          <div class="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
            <BaseButton
              tag="router-link"
              :to="{ name: 'Import' }"
              variant="primary"
              size="md"
              class="flex-1 sm:flex-none"
            >
              <template #icon>
                <RiFileTextLine class="w-4 h-4 sm:w-5 sm:h-5" />
              </template>
              <span class="truncate">{{
                t('views.dashboard.importTransactions')
              }}</span>
            </BaseButton>
            <BaseButton
              tag="router-link"
              :to="{ name: 'Accounts' }"
              variant="secondary"
              size="md"
              class="flex-1 sm:flex-none"
            >
              <template #icon>
                <RiWalletLine class="w-4 h-4 sm:w-5 sm:h-5" />
              </template>
              <span class="truncate">{{
                t('views.dashboard.manageAccounts')
              }}</span>
            </BaseButton>
            <BaseButton
              variant="ghost"
              class="flex-1 sm:flex-none"
              @click="refreshData"
            >
              <RiRefreshLine class="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span class="truncate">{{ t('views.dashboard.refresh') }}</span>
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div
        class="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8 mt-8"
      >
        <!-- Account Balance Overview -->
        <div class="card">
          <div class="p-1.5 sm:p-2">
            <h2 class="card-title mb-4 text-lg sm:text-xl">
              {{ t('views.dashboard.accountBalances') }}
            </h2>
            <div
              v-if="accounts"
              class="space-y-4"
            >
              <!-- Assets Breakdown -->
              <div>
                <div class="flex justify-between items-center mb-2">
                  <span class="font-semibold text-sm sm:text-base truncate">{{
                    t('words.assets')
                  }}</span>
                  <span
                    class="amount-positive font-bold text-sm sm:text-base truncate ml-2"
                    >{{ formatCurrency(totalAssets, 'CHF') }}</span
                  >
                </div>
                <div class="space-y-2">
                  <div
                    v-for="account in accounts.assets.accounts.slice(0, 5)"
                    :key="account.id"
                    class="flex justify-between items-center text-xs sm:text-sm pl-4"
                  >
                    <span class="flex items-center min-w-0 flex-1">
                      <div
                        class="w-2 h-2 rounded-full mr-2 flex-shrink-0"
                        style="background-color: var(--color-primary-400)"
                      ></div>
                      <span class="truncate">{{ account.name }}</span>
                    </span>
                    <span
                      :class="
                        account.balance >= 0
                          ? 'amount-positive'
                          : 'amount-negative'
                      "
                      class="ml-2 flex-shrink-0"
                    >
                      {{ formatCurrency(account.balance, account.currency) }}
                    </span>
                  </div>
                  <div
                    v-if="accounts.assets.accounts.length > 5"
                    class="text-xs text-muted pl-4"
                  >
                    +{{ accounts.assets.accounts.length - 5 }}
                    {{ t('views.dashboard.moreAccounts') }}
                  </div>
                </div>
              </div>

              <!-- Liabilities Breakdown -->
              <div v-if="accounts.liabilities.accounts.length > 0">
                <div class="flex justify-between items-center mb-2">
                  <span class="font-semibold text-sm sm:text-base truncate">{{
                    t('words.liabilities')
                  }}</span>
                  <span
                    class="text-warning font-bold text-sm sm:text-base truncate ml-2"
                    >{{
                      formatCurrency(Math.abs(totalLiabilities), 'CHF')
                    }}</span
                  >
                </div>
                <div class="space-y-2">
                  <div
                    v-for="account in accounts.liabilities.accounts.slice(0, 3)"
                    :key="account.id"
                    class="flex justify-between items-center text-xs sm:text-sm pl-4"
                  >
                    <span class="flex items-center min-w-0 flex-1">
                      <div
                        class="w-2 h-2 bg-warning rounded-full mr-2 flex-shrink-0"
                      ></div>
                      <span class="truncate">{{ account.name }}</span>
                    </span>
                    <span class="text-warning ml-2 flex-shrink-0">
                      {{
                        formatCurrency(
                          Math.abs(account.balance),
                          account.currency,
                        )
                      }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div
              v-else
              class="space-y-4"
            >
              <div class="bg-tertiary animate-pulse h-6 w-full rounded"></div>
              <div class="bg-tertiary animate-pulse h-4 w-3/4 rounded"></div>
              <div class="bg-tertiary animate-pulse h-4 w-1/2 rounded"></div>
            </div>
          </div>
        </div>

        <!-- Recent Transactions -->
        <div class="card">
          <div class="p-1.5 sm:p-2">
            <div
              class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2"
            >
              <h2 class="card-title text-lg sm:text-xl">
                {{ t('views.dashboard.recentTransactions') }}
              </h2>
              <router-link
                :to="{ name: 'Import' }"
                class="btn btn-primary btn-sm flex-shrink-0"
              >
                {{ t('views.dashboard.importMore') }}
              </router-link>
            </div>
            <div
              v-if="recentTransactions && recentTransactions.length > 0"
              class="space-y-3"
            >
              <div
                v-for="transaction in recentTransactions.slice(0, 6)"
                :key="transaction.id"
                class="flex justify-between items-center p-3 bg-primary rounded-lg hover:bg-tertiary transition-colors"
              >
                <div class="flex-1 min-w-0 pr-3">
                  <p
                    class="font-medium text-xs sm:text-sm truncate text-primary"
                  >
                    {{ transaction.description }}
                  </p>
                  <p class="text-xs text-muted">
                    {{
                      new Date(transaction.transactionDate).toLocaleDateString()
                    }}
                  </p>
                </div>
                <div class="text-right flex-shrink-0">
                  <span
                    :class="
                      transaction.amount >= 0
                        ? 'amount-positive'
                        : 'amount-negative'
                    "
                    class="font-semibold text-xs sm:text-sm"
                  >
                    {{ transaction.amount >= 0 ? '+' : ''
                    }}{{ formatCurrency(transaction.amount, 'CHF') }}
                  </span>
                </div>
              </div>
            </div>
            <div v-else-if="recentTransactions">
              <div class="text-center py-8">
                <RiWalletLine class="w-12 h-12 mx-auto text-muted mb-4" />
                <p class="text-muted text-sm mb-4">
                  {{ t('views.dashboard.noTransactions') }}
                </p>
                <router-link
                  :to="{ name: 'Import' }"
                  class="btn btn-primary btn-sm"
                >
                  {{ t('views.dashboard.importFirst') }}
                </router-link>
              </div>
            </div>
            <div
              v-else
              class="space-y-3"
            >
              <div class="bg-tertiary animate-pulse h-12 w-full rounded"></div>
              <div class="bg-tertiary animate-pulse h-12 w-full rounded"></div>
              <div class="bg-tertiary animate-pulse h-12 w-full rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RiFileTextLine, RiRefreshLine, RiWalletLine } from '@remixicon/vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, ref } from 'vue';
import BaseButton from '../components/BaseButton.vue';
import PageHeader from '../components/PageHeader.vue';
import { useAccounts } from '../composables/useAccounts';
import { useAuth } from '../composables/useAuth';
import { useConstant } from '../composables/useConstant';
import { useCurrency } from '../composables/useCurrency';
import { useLanguage } from '../composables/useLanguage';

const { t } = useLanguage();
const { formatCurrency } = useCurrency();
const { URI } = useConstant();
const { getAccessToken } = useAuth();
const queryClient = useQueryClient();

const timeFilter = ref('2025');
const { accounts } = useAccounts(timeFilter);

// Recent transactions query
const { data: recentTransactions } = useQuery({
  queryKey: ['transactions', 'recent'],
  staleTime: 1000 * 60 * 5,
  queryFn: async (): Promise<any[]> =>
    await fetch(`${URI.API}/v1/transactions?limit=10&sort=desc`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    }).then((response) => response.json()),
});

// Computed values for dashboard metrics
const totalAssets = computed(() => accounts?.value?.assets?.total || 0);
const totalLiabilities = computed(
  () => accounts?.value?.liabilities?.total || 0,
);

const refreshData = () => {
  queryClient.invalidateQueries({ queryKey: ['accounts'] });
  queryClient.invalidateQueries({ queryKey: ['transactions'] });
};
</script>
