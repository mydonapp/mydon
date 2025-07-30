<template>
  <div class="min-h-screen bg-base-100">
    <div v-if="!isFetching && account">
      <!-- Header Section -->
      <div
        class="bg-gradient-to-r from-primary to-secondary text-primary-content"
      >
        <div class="container mx-auto px-6 py-8">
          <div
            class="flex flex-col lg:flex-row lg:items-center justify-between gap-6"
          >
            <div class="flex-1">
              <div class="flex items-center gap-4 mb-4">
                <button
                  class="btn btn-circle btn-ghost btn-sm"
                  @click="$router.back()"
                >
                  <svg
                    class="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"
                    />
                  </svg>
                </button>
                <h1 class="text-3xl font-bold">{{ account.name }}</h1>
                <div
                  class="badge badge-lg"
                  :class="getAccountTypeBadgeClass()"
                >
                  {{ getAccountTypeLabel() }}
                </div>
              </div>
              <p class="text-primary-content/80">
                {{ t('views.account.subtitle') }}
              </p>
            </div>

            <!-- Account Balance Card -->
            <div class="card bg-base-100 text-base-content shadow-xl min-w-64">
              <div class="card-body p-6">
                <h3 class="text-sm font-semibold text-base-content/60 mb-2">
                  {{ t('views.account.currentBalance') }}
                </h3>
                <div class="flex items-center justify-between">
                  <span
                    class="text-3xl font-bold"
                    :class="accountBalance >= 0 ? 'text-success' : 'text-error'"
                  >
                    {{
                      formatCurrency(accountBalance, account.currency || 'CHF')
                    }}
                  </span>
                  <div class="text-right">
                    <p class="text-xs text-base-content/60">
                      {{ account.currency || 'CHF' }}
                    </p>
                    <div
                      v-if="account.retirementAccount"
                      class="badge badge-info badge-xs mt-1"
                    >
                      {{ t('views.accounts.retirement') }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="container mx-auto px-6 py-8">
        <!-- Quick Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div
            class="card bg-gradient-to-br from-info/10 to-info/5 border border-info/20 shadow-lg"
          >
            <div class="card-body p-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-semibold text-info">
                    {{ t('views.account.totalTransactions') }}
                  </h3>
                  <p class="text-2xl font-bold text-info">
                    {{ account.transactions?.length || 0 }}
                  </p>
                </div>
                <svg
                  class="w-8 h-8 text-info/60"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M3,3H21V5H3V3M3,7H21V9H3V7M3,11H21V13H3V11M3,15H21V17H3V15M3,19H21V21H3V19Z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div
            class="card bg-gradient-to-br from-success/10 to-success/5 border border-success/20 shadow-lg"
          >
            <div class="card-body p-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-semibold text-success">
                    {{ t('views.account.totalIncome') }}
                  </h3>
                  <p class="text-2xl font-bold text-success">
                    {{ formatCurrency(totalIncome, account.currency || 'CHF') }}
                  </p>
                </div>
                <svg
                  class="w-8 h-8 text-success/60"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div
            class="card bg-gradient-to-br from-error/10 to-error/5 border border-error/20 shadow-lg"
          >
            <div class="card-body p-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-semibold text-error">
                    {{ t('views.account.totalExpenses') }}
                  </h3>
                  <p class="text-2xl font-bold text-error">
                    {{
                      formatCurrency(
                        Math.abs(totalExpenses),
                        account.currency || 'CHF',
                      )
                    }}
                  </p>
                </div>
                <svg
                  class="w-8 h-8 text-error/60"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Transactions Section -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body p-0">
            <!-- Transactions Header with Filters -->
            <div class="p-6 border-b border-base-300">
              <div
                class="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <h2 class="text-xl font-bold flex items-center">
                  <svg
                    class="w-6 h-6 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M3,3H21V5H3V3M3,7H21V9H3V7M3,11H21V13H3V11M3,15H21V17H3V15M3,19H21V21H3V19Z"
                    />
                  </svg>
                  {{ t('views.account.transactions.title') }}
                </h2>

                <div class="flex flex-wrap items-center gap-4">
                  <!-- Search -->
                  <div class="form-control">
                    <div class="input-group">
                      <input
                        v-model="searchQuery"
                        type="text"
                        placeholder="Search transactions..."
                        class="input input-bordered input-sm w-64"
                      />
                      <button class="btn btn-square btn-sm">
                        <svg
                          class="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <!-- Amount Filter -->
                  <div class="form-control">
                    <select
                      v-model="amountFilter"
                      class="select select-bordered select-sm"
                    >
                      <option value="all">All Amounts</option>
                      <option value="positive">Income Only</option>
                      <option value="negative">Expenses Only</option>
                    </select>
                  </div>

                  <!-- Sort Options -->
                  <div class="form-control">
                    <select
                      v-model="sortBy"
                      class="select select-bordered select-sm"
                    >
                      <option value="date-desc">Date (Newest)</option>
                      <option value="date-asc">Date (Oldest)</option>
                      <option value="amount-desc">Amount (High to Low)</option>
                      <option value="amount-asc">Amount (Low to High)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- Transactions List -->
            <div
              v-if="filteredTransactions.length > 0"
              class="p-6"
            >
              <div class="space-y-3">
                <div
                  v-for="transaction in paginatedTransactions"
                  :key="transaction.id"
                  class="card bg-base-100 hover:bg-base-300 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                  @click="selectTransaction(transaction)"
                >
                  <div class="card-body p-4">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center space-x-4 flex-1 min-w-0">
                        <!-- Transaction Type Icon -->
                        <div class="flex-shrink-0">
                          <div
                            class="w-10 h-10 rounded-full flex items-center justify-center text-white"
                            :class="
                              (parseFloat(transaction.amount) || 0) >= 0
                                ? 'bg-success'
                                : 'bg-error'
                            "
                          >
                            <svg
                              class="w-5 h-5"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                v-if="
                                  (parseFloat(transaction.amount) || 0) >= 0
                                "
                                d="M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z"
                              />
                              <path
                                v-else
                                d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"
                              />
                            </svg>
                          </div>
                        </div>

                        <!-- Transaction Details -->
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center justify-between mb-1">
                            <h4 class="font-semibold text-sm truncate">
                              {{ transaction.description || 'No description' }}
                            </h4>
                            <span class="text-xs text-base-content/60 ml-2">
                              {{ formatDate(transaction.transactionDate) }}
                            </span>
                          </div>
                          <div
                            class="flex items-center text-xs text-base-content/60"
                          >
                            <svg
                              class="w-3 h-3 mr-1"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                d="M19,7H5A2,2 0 0,0 3,9V17A2,2 0 0,0 5,19H19A2,2 0 0,0 21,17V9A2,2 0 0,0 19,7M19,17H5V9H19V17Z"
                              />
                            </svg>
                            <span class="truncate">{{
                              transaction.counterAccount?.name ||
                              'Unknown account'
                            }}</span>
                          </div>
                        </div>

                        <!-- Amount -->
                        <div class="text-right flex-shrink-0">
                          <span
                            class="text-lg font-bold"
                            :class="
                              (parseFloat(transaction.amount) || 0) >= 0
                                ? 'text-success'
                                : 'text-error'
                            "
                          >
                            {{
                              formatCurrency(
                                parseFloat(transaction.amount) || 0,
                                account.currency || 'CHF',
                              )
                            }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Pagination -->
              <div
                v-if="totalPages > 1"
                class="flex justify-center mt-8"
              >
                <div class="join">
                  <button
                    class="join-item btn btn-sm"
                    :disabled="currentPage === 1"
                    @click="currentPage = 1"
                  >
                    «
                  </button>
                  <button
                    class="join-item btn btn-sm"
                    :disabled="currentPage === 1"
                    @click="currentPage--"
                  >
                    ‹
                  </button>
                  <button class="join-item btn btn-sm btn-active">
                    {{ currentPage }}
                  </button>
                  <button
                    class="join-item btn btn-sm"
                    :disabled="currentPage === totalPages"
                    @click="currentPage++"
                  >
                    ›
                  </button>
                  <button
                    class="join-item btn btn-sm"
                    :disabled="currentPage === totalPages"
                    @click="currentPage = totalPages"
                  >
                    »
                  </button>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div
              v-else
              class="p-12 text-center"
            >
              <svg
                class="w-16 h-16 mx-auto text-base-content/20 mb-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M3,3H21V5H3V3M3,7H21V9H3V7M3,11H21V13H3V11M3,15H21V17H3V15M3,19H21V21H3V19Z"
                />
              </svg>
              <h3 class="text-lg font-semibold text-base-content/60 mb-2">
                {{ t('views.account.noTransactions') }}
              </h3>
              <p class="text-base-content/40 mb-4">
                {{ t('views.account.noTransactionsDescription') }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-else
      class="min-h-screen flex items-center justify-center"
    >
      <div class="text-center">
        <div class="loading loading-spinner loading-lg text-primary mb-4"></div>
        <p class="text-base-content/60">{{ t('common.loading') }}</p>
      </div>
    </div>

    <!-- Transaction Detail Modal -->
    <dialog
      ref="transactionModal"
      class="modal"
    >
      <div
        class="modal-box w-11/12 max-w-2xl"
        v-if="selectedTransaction"
      >
        <div class="flex justify-between items-center mb-6">
          <h3 class="font-bold text-lg">
            {{ t('views.account.transactionDetails') }}
          </h3>
          <button
            class="btn btn-sm btn-circle btn-ghost"
            @click="closeTransactionModal"
          >
            ✕
          </button>
        </div>

        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-semibold text-base-content/60">{{
                t('views.account.transactions.table.date')
              }}</label>
              <p class="text-lg">
                {{ formatDate(selectedTransaction.transactionDate) }}
              </p>
            </div>
            <div>
              <label class="text-sm font-semibold text-base-content/60">{{
                t('views.account.transactions.table.amount')
              }}</label>
              <p
                class="text-lg font-bold"
                :class="
                  (parseFloat(selectedTransaction.amount) || 0) >= 0
                    ? 'text-success'
                    : 'text-error'
                "
              >
                {{
                  formatCurrency(
                    parseFloat(selectedTransaction.amount) || 0,
                    account.currency || 'CHF',
                  )
                }}
              </p>
            </div>
          </div>

          <div>
            <label class="text-sm font-semibold text-base-content/60">{{
              t('views.account.transactions.table.description')
            }}</label>
            <p class="text-lg">
              {{ selectedTransaction.description || 'No description' }}
            </p>
          </div>

          <div>
            <label class="text-sm font-semibold text-base-content/60">{{
              t('views.account.transactions.table.otherAccount')
            }}</label>
            <p class="text-lg">
              {{
                selectedTransaction.counterAccount?.name || 'Unknown account'
              }}
            </p>
          </div>
        </div>

        <div class="modal-action">
          <button
            class="btn btn-ghost"
            @click="closeTransactionModal"
          >
            {{ t('common.close') }}
          </button>
        </div>
      </div>
      <form
        method="dialog"
        class="modal-backdrop"
      >
        <button @click="closeTransactionModal">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { computed, ref } from 'vue';
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

// UI State
const searchQuery = ref('');
const amountFilter = ref('all');
const sortBy = ref('date-desc');
const currentPage = ref(1);
const itemsPerPage = 20;
const transactionModal = ref<HTMLDialogElement>();
const selectedTransaction = ref<any>(null);

// API Query
const { isFetching, data: account } = useQuery({
  queryKey: ['accounts', accountId],
  staleTime: 1000 * 60 * 1,
  queryFn: async (): Promise<any> => {
    const response = await fetch(`${URI.API}/v1/accounts/${accountId}`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    }).then((response) => response.json());

    // Debug logging to understand the data structure
    console.log('=== ACCOUNT API RESPONSE ===');
    console.log('Full response:', response);
    console.log('Response keys:', Object.keys(response || {}));
    console.log('Balance field:', response?.balance);
    console.log('Balance type:', typeof response?.balance);
    console.log('Opening balance field:', response?.openingBalance);
    console.log('Opening balance type:', typeof response?.openingBalance);
    console.log('Retirement account:', response?.retirementAccount);
    console.log('Transactions field:', response?.transactions);
    console.log('Transactions type:', typeof response?.transactions);
    console.log('Transactions length:', response?.transactions?.length);
    console.log('============================');

    return response;
  },
});

// Computed Properties
const totalIncome = computed(() => {
  if (
    !account.value?.transactions ||
    !Array.isArray(account.value.transactions)
  ) {
    console.log('No transactions array found:', account.value);
    return 0;
  }

  const income = account.value.transactions
    .filter((t: any) => {
      const amount = parseFloat(t.amount) || 0;
      return amount > 0;
    })
    .reduce((sum: number, t: any) => {
      const amount = parseFloat(t.amount) || 0;
      return sum + amount;
    }, 0);

  console.log('Calculated total income:', income);
  return income;
});

const totalExpenses = computed(() => {
  if (
    !account.value?.transactions ||
    !Array.isArray(account.value.transactions)
  ) {
    console.log('No transactions array found for expenses:', account.value);
    return 0;
  }

  const expenses = account.value.transactions
    .filter((t: any) => {
      const amount = parseFloat(t.amount) || 0;
      return amount < 0;
    })
    .reduce((sum: number, t: any) => {
      const amount = parseFloat(t.amount) || 0;
      return sum + amount;
    }, 0);

  console.log('Calculated total expenses:', expenses);
  return expenses;
});

// Add computed property for account balance with proper parsing
const accountBalance = computed(() => {
  if (!account.value) {
    console.log('No account data available');
    return 0;
  }

  console.log('Full account object:', account.value);
  console.log('Account balance raw:', account.value.balance);
  console.log('Account balance type:', typeof account.value.balance);

  // The backend balance field may not be properly calculated due to select: false on creditBalance/debitBalance
  // So we calculate the balance from transactions which are properly loaded
  if (
    !account.value.transactions ||
    !Array.isArray(account.value.transactions)
  ) {
    console.log('No transactions array found, trying to use API balance field');
    // Fallback to API balance field if available
    if (account.value.balance !== undefined && account.value.balance !== null) {
      const balance = parseFloat(account.value.balance) || 0;
      console.log('Using API balance field as fallback, parsed:', balance);
      return balance;
    }
    console.log('No balance data available, returning 0');
    return 0;
  }

  // Calculate balance from transactions (most reliable method)
  const calculatedBalance = account.value.transactions.reduce(
    (sum: number, transaction: any) => {
      const amount = parseFloat(transaction.amount) || 0;
      return sum + amount;
    },
    0,
  );

  console.log('Calculated balance from transactions:', calculatedBalance);
  console.log(
    'Number of transactions used:',
    account.value.transactions.length,
  );

  // Add opening balance if available
  const openingBalance = parseFloat(account.value.openingBalance) || 0;
  const finalBalance = calculatedBalance + openingBalance;

  console.log('Opening balance:', openingBalance);
  console.log('Final balance (transactions + opening):', finalBalance);

  return finalBalance;
});

const filteredTransactions = computed(() => {
  if (
    !account.value?.transactions ||
    !Array.isArray(account.value.transactions)
  ) {
    console.log('No transactions to filter');
    return [];
  }

  let transactions = [...account.value.transactions];

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    transactions = transactions.filter(
      (t: any) =>
        (t.description || '').toLowerCase().includes(query) ||
        (t.counterAccount?.name || '').toLowerCase().includes(query),
    );
  }

  // Apply amount filter
  if (amountFilter.value === 'positive') {
    transactions = transactions.filter((t: any) => {
      const amount = parseFloat(t.amount) || 0;
      return amount > 0;
    });
  } else if (amountFilter.value === 'negative') {
    transactions = transactions.filter((t: any) => {
      const amount = parseFloat(t.amount) || 0;
      return amount < 0;
    });
  }

  // Apply sorting
  transactions.sort((a: any, b: any) => {
    switch (sortBy.value) {
      case 'date-desc':
        return (
          new Date(b.transactionDate).getTime() -
          new Date(a.transactionDate).getTime()
        );
      case 'date-asc':
        return (
          new Date(a.transactionDate).getTime() -
          new Date(b.transactionDate).getTime()
        );
      case 'amount-desc':
        return (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0);
      case 'amount-asc':
        return (parseFloat(a.amount) || 0) - (parseFloat(b.amount) || 0);
      default:
        return 0;
    }
  });

  return transactions;
});

const totalPages = computed(() => {
  return Math.ceil(filteredTransactions.value.length / itemsPerPage);
});

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredTransactions.value.slice(start, end);
});

// Methods
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getAccountTypeLabel = () => {
  if (!account.value) return '';

  // This is a simple mapping - you might want to extend this based on your account types
  const type = account.value.type || 'ASSETS';
  const labels: Record<string, string> = {
    ASSETS: t('words.assets'),
    LIABILITIES: t('words.liabilities'),
    INCOME: t('words.income'),
    EXPENSE: t('words.expenses'),
  };

  return labels[type] || type;
};

const getAccountTypeBadgeClass = () => {
  if (!account.value) return 'badge-primary';

  const type = account.value.type || 'ASSETS';
  const classes: Record<string, string> = {
    ASSETS: 'badge-success',
    LIABILITIES: 'badge-warning',
    INCOME: 'badge-info',
    EXPENSE: 'badge-error',
  };

  return classes[type] || 'badge-primary';
};

const selectTransaction = (transaction: any) => {
  selectedTransaction.value = transaction;
  transactionModal.value?.showModal();
};

const closeTransactionModal = () => {
  transactionModal.value?.close();
  selectedTransaction.value = null;
};

// Reset pagination when filters change
const resetPagination = () => {
  currentPage.value = 1;
};

// Watch for filter changes to reset pagination
import { watch } from 'vue';
watch([searchQuery, amountFilter, sortBy], resetPagination);
</script>
