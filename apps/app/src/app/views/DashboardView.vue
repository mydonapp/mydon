<template>
  <div class="min-h-screen bg-base-100">
    <!-- Header Section -->
    <div
      class="bg-gradient-to-r from-primary to-secondary text-primary-content"
    >
      <div class="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div class="min-w-0 flex-1">
            <h1 class="text-2xl sm:text-3xl font-bold mb-2 truncate">
              {{ t('views.dashboard.title') }}
            </h1>
            <p class="text-primary-content/80 text-sm sm:text-base truncate">
              {{ t('views.dashboard.subtitle') }}
            </p>
          </div>
          <div class="text-left sm:text-right flex-shrink-0">
            <p class="text-xs sm:text-sm opacity-80">
              {{ t('views.dashboard.lastUpdated') }}
            </p>
            <p class="font-semibold text-sm sm:text-base">
              {{ new Date().toLocaleDateString() }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
      <!-- Quick Stats Cards -->
      <div
        class="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8"
      >
        <!-- Net Worth Card -->
        <div
          class="card bg-base-200 shadow-lg hover:shadow-xl transition-shadow"
        >
          <div class="card-body p-4 sm:p-6">
            <div class="flex items-center justify-between">
              <div class="min-w-0 flex-1">
                <h2 class="card-title text-sm sm:text-lg truncate">
                  {{ t('views.dashboard.netWorth') }}
                </h2>
                <p
                  v-if="accounts"
                  class="text-xl sm:text-3xl font-bold text-success truncate"
                >
                  {{ formatCurrency(netWorth, 'CHF') }}
                </p>
                <div
                  v-else
                  class="skeleton h-6 sm:h-8 w-20 sm:w-24"
                ></div>
              </div>
              <div class="text-success flex-shrink-0 ml-2">
                <svg
                  class="w-6 h-6 sm:w-8 sm:h-8"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"
                  />
                </svg>
              </div>
            </div>
            <div class="text-xs sm:text-sm opacity-70 mt-2 truncate">
              {{ t('views.dashboard.totalAssets') }}:
              {{ formatCurrency(totalAssets, 'CHF') }}
            </div>
          </div>
        </div>

        <!-- Total Assets Card -->
        <div
          class="card bg-base-200 shadow-lg hover:shadow-xl transition-shadow"
        >
          <div class="card-body p-4 sm:p-6">
            <div class="flex items-center justify-between">
              <div class="min-w-0 flex-1">
                <h2 class="card-title text-sm sm:text-lg truncate">
                  {{ t('views.dashboard.assets') }}
                </h2>
                <p
                  v-if="accounts"
                  class="text-xl sm:text-3xl font-bold text-primary truncate"
                >
                  {{ formatCurrency(totalAssets, 'CHF') }}
                </p>
                <div
                  v-else
                  class="skeleton h-6 sm:h-8 w-20 sm:w-24"
                ></div>
              </div>
              <div class="text-primary flex-shrink-0 ml-2">
                <svg
                  class="w-6 h-6 sm:w-8 sm:h-8"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"
                  />
                </svg>
              </div>
            </div>
            <div class="text-xs sm:text-sm opacity-70 mt-2 truncate">
              {{ accounts?.assets?.accounts?.length || 0 }}
              {{ t('views.dashboard.accounts') }}
            </div>
          </div>
        </div>

        <!-- Liabilities Card -->
        <div
          class="card bg-base-200 shadow-lg hover:shadow-xl transition-shadow"
        >
          <div class="card-body p-4 sm:p-6">
            <div class="flex items-center justify-between">
              <div class="min-w-0 flex-1">
                <h2 class="card-title text-sm sm:text-lg truncate">
                  {{ t('views.dashboard.liabilities') }}
                </h2>
                <p
                  v-if="accounts"
                  class="text-xl sm:text-3xl font-bold text-warning truncate"
                >
                  {{ formatCurrency(Math.abs(totalLiabilities), 'CHF') }}
                </p>
                <div
                  v-else
                  class="skeleton h-6 sm:h-8 w-20 sm:w-24"
                ></div>
              </div>
              <div class="text-warning flex-shrink-0 ml-2">
                <svg
                  class="w-6 h-6 sm:w-8 sm:h-8"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z" />
                </svg>
              </div>
            </div>
            <div class="text-xs sm:text-sm opacity-70 mt-2 truncate">
              {{ accounts?.liabilities?.accounts?.length || 0 }}
              {{ t('views.dashboard.accounts') }}
            </div>
          </div>
        </div>

        <!-- Monthly Cash Flow -->
        <div
          class="card bg-base-200 shadow-lg hover:shadow-xl transition-shadow"
        >
          <div class="card-body p-4 sm:p-6">
            <div class="flex items-center justify-between">
              <div class="min-w-0 flex-1">
                <h2 class="card-title text-sm sm:text-lg truncate">
                  {{ t('views.dashboard.monthlyFlow') }}
                </h2>
                <p
                  class="text-xl sm:text-3xl font-bold truncate"
                  :class="monthlyFlow >= 0 ? 'text-success' : 'text-error'"
                >
                  {{ formatCurrency(monthlyFlow, 'CHF') }}
                </p>
              </div>
              <div
                :class="monthlyFlow >= 0 ? 'text-success' : 'text-error'"
                class="flex-shrink-0 ml-2"
              >
                <svg
                  class="w-6 h-6 sm:w-8 sm:h-8"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    v-if="monthlyFlow >= 0"
                    d="M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z"
                  />
                  <path
                    v-else
                    d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"
                  />
                </svg>
              </div>
            </div>
            <div class="text-xs sm:text-sm opacity-70 mt-2 truncate">
              {{ t('views.dashboard.thisMonth') }}
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="card bg-base-200 shadow-lg mb-6 sm:mb-8">
        <div class="card-body p-4 sm:p-6">
          <h2 class="card-title mb-4 text-lg sm:text-xl">
            {{ t('views.dashboard.quickActions') }}
          </h2>
          <div class="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
            <router-link
              :to="{ name: 'Import' }"
              class="btn btn-primary flex-1 sm:flex-none"
            >
              <svg
                class="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"
                />
              </svg>
              <span class="truncate">{{
                t('views.dashboard.importTransactions')
              }}</span>
            </router-link>
            <router-link
              :to="{ name: 'Accounts' }"
              class="btn btn-secondary flex-1 sm:flex-none"
            >
              <svg
                class="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M19,7H5A2,2 0 0,0 3,9V17A2,2 0 0,0 5,19H19A2,2 0 0,0 21,17V9A2,2 0 0,0 19,7M19,17H5V9H19V17Z"
                />
              </svg>
              <span class="truncate">{{
                t('views.dashboard.manageAccounts')
              }}</span>
            </router-link>
            <button
              class="btn btn-outline flex-1 sm:flex-none"
              @click="refreshData"
            >
              <svg
                class="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"
                />
              </svg>
              <span class="truncate">{{ t('views.dashboard.refresh') }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
        <!-- Account Balance Overview -->
        <div class="card bg-base-200 shadow-lg">
          <div class="card-body p-4 sm:p-6">
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
                    class="text-success font-bold text-sm sm:text-base truncate ml-2"
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
                        class="w-2 h-2 bg-primary rounded-full mr-2 flex-shrink-0"
                      ></div>
                      <span class="truncate">{{ account.name }}</span>
                    </span>
                    <span
                      :class="
                        account.balance >= 0 ? 'text-success' : 'text-error'
                      "
                      class="ml-2 flex-shrink-0"
                    >
                      {{ formatCurrency(account.balance, account.currency) }}
                    </span>
                  </div>
                  <div
                    v-if="accounts.assets.accounts.length > 5"
                    class="text-xs text-base-content/60 pl-4"
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
              <div class="skeleton h-6 w-full"></div>
              <div class="skeleton h-4 w-3/4"></div>
              <div class="skeleton h-4 w-1/2"></div>
            </div>
          </div>
        </div>

        <!-- Recent Transactions -->
        <div class="card bg-base-200 shadow-lg">
          <div class="card-body p-4 sm:p-6">
            <div
              class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2"
            >
              <h2 class="card-title text-lg sm:text-xl">
                {{ t('views.dashboard.recentTransactions') }}
              </h2>
              <router-link
                :to="{ name: 'Import' }"
                class="btn btn-sm btn-primary flex-shrink-0"
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
                class="flex justify-between items-center p-3 bg-base-100 rounded-lg hover:bg-base-300 transition-colors"
              >
                <div class="flex-1 min-w-0 pr-3">
                  <p class="font-medium text-xs sm:text-sm truncate">
                    {{ transaction.description }}
                  </p>
                  <p class="text-xs opacity-60">
                    {{
                      new Date(transaction.transactionDate).toLocaleDateString()
                    }}
                  </p>
                </div>
                <div class="text-right flex-shrink-0">
                  <span
                    :class="
                      transaction.amount >= 0 ? 'text-success' : 'text-error'
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
                <svg
                  class="w-12 h-12 mx-auto text-base-content/30 mb-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M19,7H5A2,2 0 0,0 3,9V17A2,2 0 0,0 5,19H19A2,2 0 0,0 21,17V9A2,2 0 0,0 19,7M19,17H5V9H19V17Z"
                  />
                </svg>
                <p class="text-base-content/60 text-sm mb-4">
                  {{ t('views.dashboard.noTransactions') }}
                </p>
                <router-link
                  :to="{ name: 'Import' }"
                  class="btn btn-sm btn-primary"
                >
                  {{ t('views.dashboard.importFirst') }}
                </router-link>
              </div>
            </div>
            <div
              v-else
              class="space-y-3"
            >
              <div class="skeleton h-12 w-full"></div>
              <div class="skeleton h-12 w-full"></div>
              <div class="skeleton h-12 w-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
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
const totalIncome = computed(() => accounts?.value?.income?.total || 0);
const totalExpenses = computed(() => accounts?.value?.expense?.total || 0);

const netWorth = computed(() => totalAssets.value + totalLiabilities.value);
const monthlyFlow = computed(
  () => totalIncome.value - Math.abs(totalExpenses.value),
);

const refreshData = () => {
  queryClient.invalidateQueries({ queryKey: ['accounts'] });
  queryClient.invalidateQueries({ queryKey: ['transactions'] });
};
</script>
