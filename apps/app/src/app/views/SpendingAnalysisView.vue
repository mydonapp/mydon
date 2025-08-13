<template>
  <div class="min-h-screen bg-base-100">
    <!-- Header Section -->
    <div class="bg-gradient-to-r from-accent to-secondary text-accent-content">
      <div class="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div
          class="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div class="min-w-0 flex-1">
            <h1 class="text-2xl sm:text-3xl font-bold mb-2 truncate">
              {{ t('views.spendingAnalysis.title') }}
            </h1>
            <p class="text-accent-content/80 text-sm sm:text-base truncate">
              {{ t('views.spendingAnalysis.subtitle') }}
            </p>
          </div>
          <div class="flex items-center gap-4 flex-shrink-0">
            <!-- Account Filter -->
            <div class="form-control">
              <select
                v-model="selectedAccountId"
                class="select select-bordered select-sm bg-base-100 text-base-content"
              >
                <option value="">
                  {{ t('views.spendingAnalysis.allAccounts') }}
                </option>
                <option
                  v-for="account in expenseAccounts"
                  :key="account.id"
                  :value="account.id"
                >
                  {{ account.name }}
                </option>
              </select>
            </div>
            <!-- Period Filter -->
            <div class="form-control">
              <select
                v-model="selectedPeriod"
                class="select select-bordered select-sm bg-base-100 text-base-content"
              >
                <option value="monthly">
                  {{ t('views.spendingAnalysis.monthly') }}
                </option>
                <option value="quarterly">
                  {{ t('views.spendingAnalysis.quarterly') }}
                </option>
                <option value="yearly">
                  {{ t('views.spendingAnalysis.yearly') }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <!-- Loading State -->
      <div
        v-if="isLoading"
        class="flex justify-center items-center py-12"
      >
        <div class="loading loading-spinner loading-lg text-primary"></div>
      </div>

      <!-- Content -->
      <div
        v-else
        class="space-y-6 sm:space-y-8"
      >
        <!-- Summary Cards -->
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          <!-- Current Period -->
          <div
            class="card bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-lg"
          >
            <div class="card-body p-4 sm:p-6">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-semibold text-primary">
                  {{ getCurrentPeriodLabel() }}
                </h3>
                <svg
                  class="w-5 h-5 text-primary"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M9,10V12H7V10H9M13,10V12H11V10H13M17,10V12H15V10H17M19,3A2,2 0 0,1 21,5V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5A2,2 0 0,1 5,3H6V1H8V3H16V1H18V3H19M19,19V8H5V19H19M9,14V16H7V14H9M13,14V16H11V14H13M17,14V16H15V14H17Z"
                  />
                </svg>
              </div>
              <p class="text-2xl font-bold text-primary">
                {{ formatCurrency(currentPeriodSpending, 'CHF') }}
              </p>
            </div>
          </div>

          <!-- Previous Period -->
          <div
            class="card bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20 shadow-lg"
          >
            <div class="card-body p-4 sm:p-6">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-semibold text-secondary">
                  {{ getPreviousPeriodLabel() }}
                </h3>
                <svg
                  class="w-5 h-5 text-secondary"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M11.5,1L2,6V8H21V6M16,10V12H14V10M12,10V12H10V10M16,14V16H14V14M16,18V20H14V18M12,14V16H10V14M12,18V20H10V18M4,22H20V24H4V22Z"
                  />
                </svg>
              </div>
              <p class="text-2xl font-bold text-secondary">
                {{ formatCurrency(previousPeriodSpending, 'CHF') }}
              </p>
            </div>
          </div>

          <!-- Change -->
          <div
            class="card bg-gradient-to-br from-info/10 to-info/5 border border-info/20 shadow-lg"
          >
            <div class="card-body p-4 sm:p-6">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-semibold text-info">
                  {{ t('views.spendingAnalysis.change') }}
                </h3>
                <svg
                  class="w-5 h-5"
                  :class="spendingChange >= 0 ? 'text-error' : 'text-success'"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    v-if="spendingChange >= 0"
                    d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"
                  />
                  <path
                    v-else
                    d="M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z"
                  />
                </svg>
              </div>
              <p
                class="text-2xl font-bold"
                :class="spendingChange >= 0 ? 'text-error' : 'text-success'"
              >
                {{ spendingChange >= 0 ? '+' : ''
                }}{{ formatCurrency(spendingChange, 'CHF') }}
              </p>
            </div>
          </div>

          <!-- Percentage Change -->
          <div
            class="card bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 shadow-lg"
          >
            <div class="card-body p-4 sm:p-6">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-semibold text-accent">
                  {{ t('views.spendingAnalysis.percentageChange') }}
                </h3>
                <svg
                  class="w-5 h-5"
                  :class="
                    spendingChangePercentage >= 0
                      ? 'text-error'
                      : 'text-success'
                  "
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M19,3H5C3.9,3 3,3.9 3,5V19C3,20.1 3.9,21 5,21H19C20.1,21 21,20.1 21,19V5C21,3.9 20.1,3 19,3Z"
                  />
                </svg>
              </div>
              <p
                class="text-2xl font-bold"
                :class="
                  spendingChangePercentage >= 0 ? 'text-error' : 'text-success'
                "
              >
                {{ spendingChangePercentage >= 0 ? '+' : ''
                }}{{ Math.abs(spendingChangePercentage).toFixed(1) }}%
              </p>
            </div>
          </div>
        </div>

        <!-- Chart Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <!-- Spending Trend Chart -->
          <div class="card bg-base-200 shadow-lg">
            <div class="card-body p-4 sm:p-6">
              <h2 class="card-title mb-4 text-lg sm:text-xl">
                {{ t('views.spendingAnalysis.spendingTrend') }}
              </h2>
              <div
                class="h-64 bg-base-100 rounded-lg flex items-center justify-center"
              >
                <div
                  v-if="historicalSpending.length === 0"
                  class="text-center"
                >
                  <svg
                    class="w-12 h-12 mx-auto text-base-content/20 mb-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M2,2V4H4V2H2M20,2V4H22V2H20M10,4V2H14V4H10M7,6V8H9V6H7M15,6V8H17V6H15Z"
                    />
                  </svg>
                  <p class="text-base-content/60">
                    {{ t('views.spendingAnalysis.noData') }}
                  </p>
                </div>
                <div
                  v-else
                  class="w-full h-full"
                >
                  <!-- Simple bar chart visualization -->
                  <div
                    class="flex items-end justify-between h-full p-4 space-x-2"
                  >
                    <div
                      v-for="(period, index) in historicalSpending.slice(-6)"
                      :key="index"
                      class="flex-1 flex flex-col items-center"
                    >
                      <div
                        class="w-full bg-primary rounded-t transition-all duration-300 hover:bg-primary/80"
                        :style="{
                          height: `${
                            (Math.abs(period.amount) / maxSpending) * 100
                          }%`,
                        }"
                        :title="formatCurrency(period.amount, 'CHF')"
                      ></div>
                      <span class="text-xs mt-2 text-center">{{
                        period.label
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Account Breakdown -->
          <div class="card bg-base-200 shadow-lg">
            <div class="card-body p-4 sm:p-6">
              <h2 class="card-title mb-4 text-lg sm:text-xl">
                {{ t('views.spendingAnalysis.accountBreakdown') }}
              </h2>
              <div
                v-if="currentPeriodAccountBreakdown.length === 0"
                class="text-center py-8"
              >
                <svg
                  class="w-12 h-12 mx-auto text-base-content/20 mb-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M19,7H5A2,2 0 0,0 3,9V17A2,2 0 0,0 5,19H19A2,2 0 0,0 21,17V9A2,2 0 0,0 19,7M19,17H5V9H19V17Z"
                  />
                </svg>
                <p class="text-base-content/60">
                  {{ t('views.spendingAnalysis.noAccountData') }}
                </p>
              </div>
              <div
                v-else
                class="space-y-3"
              >
                <div
                  v-for="account in currentPeriodAccountBreakdown"
                  :key="account.id"
                  class="flex items-center justify-between p-3 bg-base-100 rounded-lg"
                >
                  <div class="flex items-center flex-1 min-w-0">
                    <div
                      class="w-3 h-3 bg-error rounded-full mr-3 flex-shrink-0"
                    ></div>
                    <div class="flex-1 min-w-0">
                      <h4 class="font-semibold text-sm truncate">
                        {{ account.name }}
                      </h4>
                      <p class="text-xs text-base-content/60">
                        {{
                          (
                            (Math.abs(account.amount) /
                              totalCurrentPeriodSpending) *
                            100
                          ).toFixed(1)
                        }}%
                      </p>
                    </div>
                  </div>
                  <span class="font-bold text-sm text-error">
                    {{ formatCurrency(Math.abs(account.amount), 'CHF') }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Budget Section (Placeholder for future budget feature) -->
        <div
          class="card bg-gradient-to-r from-warning/10 to-warning/5 border border-warning/20 shadow-lg"
        >
          <div class="card-body p-4 sm:p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="card-title text-lg sm:text-xl text-warning">
                {{ t('views.spendingAnalysis.budgetComparison') }}
              </h2>
              <div class="badge badge-warning">
                {{ t('views.spendingAnalysis.comingSoon') }}
              </div>
            </div>
            <div class="text-center py-8">
              <svg
                class="w-16 h-16 mx-auto text-warning/60 mb-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"
                />
              </svg>
              <h3 class="text-lg font-semibold text-warning mb-2">
                {{ t('views.spendingAnalysis.budgetFeature') }}
              </h3>
              <p class="text-warning/80 text-sm">
                {{ t('views.spendingAnalysis.budgetDescription') }}
              </p>
            </div>
          </div>
        </div>

        <!-- Detailed Transactions -->
        <div class="card bg-base-200 shadow-lg">
          <div class="card-body p-0">
            <div class="p-4 sm:p-6 border-b border-base-300">
              <h2 class="card-title text-lg sm:text-xl">
                {{ t('views.spendingAnalysis.detailedTransactions') }}
              </h2>
            </div>
            <div
              v-if="currentPeriodTransactions.length === 0"
              class="text-center py-8"
            >
              <svg
                class="w-12 h-12 mx-auto text-base-content/20 mb-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M3,3H21V5H3V3M3,7H21V9H3V7M3,11H21V13H3V11M3,15H21V17H3V15M3,19H21V21H3V19Z"
                />
              </svg>
              <p class="text-base-content/60">
                {{ t('views.spendingAnalysis.noTransactions') }}
              </p>
            </div>
            <div
              v-else
              class="p-4 sm:p-6"
            >
              <div class="space-y-3">
                <div
                  v-for="transaction in currentPeriodTransactions.slice(0, 10)"
                  :key="transaction.id"
                  class="flex items-center justify-between p-3 bg-base-100 rounded-lg hover:bg-base-300 transition-colors"
                >
                  <div class="flex-1 min-w-0">
                    <h4 class="font-semibold text-sm truncate">
                      {{ transaction.description || 'No description' }}
                    </h4>
                    <p class="text-xs text-base-content/60">
                      {{ formatDate(transaction.transactionDate) }} •
                      {{ transaction.accountName }}
                    </p>
                  </div>
                  <span class="font-bold text-sm text-error">
                    {{ formatCurrency(Math.abs(transaction.amount), 'CHF') }}
                  </span>
                </div>
              </div>
              <div
                v-if="currentPeriodTransactions.length > 10"
                class="text-center mt-4"
              >
                <p class="text-sm text-base-content/60">
                  {{
                    t('views.spendingAnalysis.showingTransactions', {
                      shown: 10,
                      total: currentPeriodTransactions.length,
                    })
                  }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { computed, ref } from 'vue';
import { useAccounts } from '../composables/useAccounts';
import { useAuth } from '../composables/useAuth';
import { useConstant } from '../composables/useConstant';
import { useCurrency } from '../composables/useCurrency';
import { useLanguage } from '../composables/useLanguage';

const { t } = useLanguage();
const { URI } = useConstant();
const { formatCurrency } = useCurrency();
const { getAccessToken } = useAuth();

// Reactive state
const selectedAccountId = ref('');
const selectedPeriod = ref('monthly');

// Get all accounts
const timeFilter = ref('2025');
const { accounts } = useAccounts(timeFilter);

// Computed properties for expense accounts
const expenseAccounts = computed(
  () => accounts?.value?.expense?.accounts || [],
);

// Mock spending data for demonstration (will be replaced with real API later)
const spendingData = ref({
  currentPeriod: {
    total: -2500,
    accountBreakdown: [
      { id: '1', name: 'Food & Dining', amount: -1200 },
      { id: '2', name: 'Transportation', amount: -600 },
      { id: '3', name: 'Shopping', amount: -400 },
      { id: '4', name: 'Entertainment', amount: -300 },
    ],
    transactions: [
      {
        id: '1',
        description: 'Grocery Store',
        amount: -85.5,
        transactionDate: '2025-01-15',
        accountName: 'Food & Dining',
      },
      {
        id: '2',
        description: 'Gas Station',
        amount: -45.0,
        transactionDate: '2025-01-14',
        accountName: 'Transportation',
      },
      {
        id: '3',
        description: 'Restaurant Dinner',
        amount: -65.0,
        transactionDate: '2025-01-13',
        accountName: 'Food & Dining',
      },
      {
        id: '4',
        description: 'Movie Theater',
        amount: -25.0,
        transactionDate: '2025-01-12',
        accountName: 'Entertainment',
      },
      {
        id: '5',
        description: 'Online Shopping',
        amount: -120.0,
        transactionDate: '2025-01-11',
        accountName: 'Shopping',
      },
    ],
  },
  previousPeriod: { total: -2200 },
  historical: [
    { label: 'Aug', amount: -1950 },
    { label: 'Sep', amount: -2100 },
    { label: 'Oct', amount: -2300 },
    { label: 'Nov', amount: -2200 },
    { label: 'Dec', amount: -2400 },
    { label: 'Jan', amount: -2500 },
  ],
});

const isLoading = ref(false);

// Computed values for spending analysis
const currentPeriodSpending = computed(() => {
  return Math.abs(spendingData.value?.currentPeriod?.total || 0);
});

const previousPeriodSpending = computed(() => {
  return Math.abs(spendingData.value?.previousPeriod?.total || 0);
});

const spendingChange = computed(() => {
  return currentPeriodSpending.value - previousPeriodSpending.value;
});

const spendingChangePercentage = computed(() => {
  if (previousPeriodSpending.value === 0) return 0;
  return (spendingChange.value / previousPeriodSpending.value) * 100;
});

const historicalSpending = computed(() => {
  return spendingData.value?.historical || [];
});

const maxSpending = computed(() => {
  const amounts = historicalSpending.value.map((h: any) => Math.abs(h.amount));
  return Math.max(...amounts, 1);
});

const currentPeriodAccountBreakdown = computed(() => {
  return spendingData.value?.currentPeriod?.accountBreakdown || [];
});

const totalCurrentPeriodSpending = computed(() => {
  return currentPeriodAccountBreakdown.value.reduce(
    (sum: number, account: any) => sum + Math.abs(account.amount),
    0,
  );
});

const currentPeriodTransactions = computed(() => {
  return spendingData.value?.currentPeriod?.transactions || [];
});

// Helper methods
const getCurrentPeriodLabel = () => {
  switch (selectedPeriod.value) {
    case 'monthly':
      return t('views.spendingAnalysis.thisMonth');
    case 'quarterly':
      return t('views.spendingAnalysis.thisQuarter');
    case 'yearly':
      return t('views.spendingAnalysis.thisYear');
    default:
      return t('views.spendingAnalysis.currentPeriod');
  }
};

const getPreviousPeriodLabel = () => {
  switch (selectedPeriod.value) {
    case 'monthly':
      return t('views.spendingAnalysis.lastMonth');
    case 'quarterly':
      return t('views.spendingAnalysis.lastQuarter');
    case 'yearly':
      return t('views.spendingAnalysis.lastYear');
    default:
      return t('views.spendingAnalysis.previousPeriod');
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
</script>
