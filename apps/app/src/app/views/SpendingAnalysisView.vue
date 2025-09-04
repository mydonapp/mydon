<template>
  <div class="min-h-screen bg-primary">
    <!-- Header Section -->
    <PageHeader
      :title="t('views.spendingAnalysis.title')"
      :subtitle="t('views.spendingAnalysis.subtitle')"
    >
      <template #extra>
        <div class="flex items-center gap-4 flex-shrink-0">
          <!-- Account Filter -->
          <div>
            <select
              v-model="selectedAccountId"
              class="select w-full bg-secondary text-white border-gray-600"
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
          <div>
            <select
              v-model="selectedPeriod"
              class="select w-full bg-secondary text-white border-gray-600"
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
      </template>
    </PageHeader>

    <div
      class="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-none xl:max-w-screen-2xl"
    >
      <!-- Loading State -->
      <div
        v-if="isLoading"
        class="flex justify-center items-center py-12"
      >
        <div
          class="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"
        ></div>
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
            <div class="p-4">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-semibold text-primary">
                  {{ getCurrentPeriodLabel() }}
                </h3>
                <RiCalendarLine class="w-5 h-5 text-primary" />
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
            <div class="p-4">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-semibold text-secondary">
                  {{ getPreviousPeriodLabel() }}
                </h3>
                <RiBarChart2Line class="w-5 h-5 text-secondary" />
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
            <div class="p-4">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-semibold text-info">
                  {{ t('views.spendingAnalysis.change') }}
                </h3>
                <RiArrowDownLine
                  v-if="spendingChange >= 0"
                  class="w-5 h-5 text-error"
                />
                <RiArrowUpLine
                  v-else
                  class="w-5 h-5 text-success"
                />
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
            <div class="p-4">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-semibold text-accent">
                  {{ t('views.spendingAnalysis.percentageChange') }}
                </h3>
                <RiPercentLine
                  class="w-5 h-5"
                  :class="
                    spendingChangePercentage >= 0
                      ? 'text-error'
                      : 'text-success'
                  "
                />
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
          <div class="card bg-secondary shadow p-1.5 sm:p-2 rounded-lg">
            <div class="p-4">
              <h2 class="text-xl font-bold text-white mb-4 text-lg sm:text-xl">
                {{ t('views.spendingAnalysis.spendingTrend') }}
              </h2>
              <div
                class="h-64 bg-primary rounded-lg flex items-center justify-center"
              >
                <div
                  v-if="historicalSpending.length === 0"
                  class="text-center"
                >
                  <RiLineChartLine
                    class="w-12 h-12 mx-auto text-gray-400 mb-4"
                  />
                  <p class="text-gray-400">
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
          <div class="card bg-secondary shadow p-1.5 sm:p-2 rounded-lg">
            <div class="p-4">
              <h2 class="text-xl font-bold text-white mb-4 text-lg sm:text-xl">
                {{ t('views.spendingAnalysis.accountBreakdown') }}
              </h2>
              <div
                v-if="currentPeriodAccountBreakdown.length === 0"
                class="text-center py-8"
              >
                <RiWalletLine class="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p class="text-gray-400">
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
                  class="flex items-center justify-between p-3 bg-primary rounded-lg"
                >
                  <div class="flex items-center flex-1 min-w-0">
                    <div
                      class="w-3 h-3 bg-error rounded-full mr-3 flex-shrink-0"
                    ></div>
                    <div class="flex-1 min-w-0">
                      <h4 class="font-semibold text-sm truncate">
                        {{ account.name }}
                      </h4>
                      <p class="text-xs text-gray-400">
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
          <div class="p-4">
            <div class="flex items-center justify-between mb-4">
              <h2
                class="text-xl font-bold text-white text-lg sm:text-xl text-warning"
              >
                {{ t('views.spendingAnalysis.budgetComparison') }}
              </h2>
              <div
                class="bg-warning text-black px-2 py-1 rounded text-sm font-semibold"
              >
                {{ t('views.spendingAnalysis.comingSoon') }}
              </div>
            </div>
            <div class="text-center py-8">
              <RiInformationLine
                class="w-16 h-16 mx-auto text-warning/60 mb-4"
              />
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
        <div class="card bg-secondary shadow p-1.5 sm:p-2 rounded-lg">
          <div class="card-body p-0">
            <div class="p-4 sm:p-6 border-b border-base-300">
              <h2 class="text-xl font-bold text-white text-lg sm:text-xl">
                {{ t('views.spendingAnalysis.detailedTransactions') }}
              </h2>
            </div>
            <div
              v-if="currentPeriodTransactions.length === 0"
              class="text-center py-8"
            >
              <RiFileTextLine class="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p class="text-gray-400">
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
                  class="flex items-center justify-between p-3 bg-primary rounded-lg hover:bg-base-300 transition-colors"
                >
                  <div class="flex-1 min-w-0">
                    <h4 class="font-semibold text-sm truncate">
                      {{ transaction.description || 'No description' }}
                    </h4>
                    <p class="text-xs text-gray-400">
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
                <p class="text-sm text-gray-400">
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
import {
  RiCalendarLine,
  RiBarChart2Line,
  RiArrowDownLine,
  RiArrowUpLine,
  RiPercentLine,
  RiLineChartLine,
  RiWalletLine,
  RiInformationLine,
  RiFileTextLine,
} from '@remixicon/vue';
import PageHeader from '../components/PageHeader.vue';
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
