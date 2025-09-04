<template>
  <div class="min-h-screen bg-primary">
    <div v-if="!isFetching && account">
      <!-- Header Section -->
      <PageHeader
        :title="account.name"
        :subtitle="t('views.account.subtitle')"
      >
        <template #extra>
          <div class="flex items-center gap-4">
            <BaseButton
              variant="ghost"
              size="sm"
              @click="$router.back()"
            >
              <template #icon>
                <RiArrowLeftLine class="w-5 h-5" />
              </template>
              {{ t('common.back') }}
            </BaseButton>
            <div
              class="badge badge-lg"
              :class="getAccountTypeBadgeClass()"
            >
              {{ getAccountTypeLabel() }}
            </div>
          </div>
        </template>
      </PageHeader>

      <div
        class="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-none xl:max-w-screen-2xl"
      >
        <!-- Account Balance Card -->
        <div class="card shadow-xl mb-6 sm:mb-8">
          <div class="p-1.5 sm:p-2">
            <h3 class="text-sm font-semibold text-muted mb-2">
              {{ t('views.account.currentBalance') }}
            </h3>
            <div class="flex items-center justify-between">
              <span
                class="text-2xl sm:text-3xl font-bold"
                :class="getBalanceColorClass(accountBalance)"
              >
                {{ formatCurrency(accountBalance, account.currency || 'CHF') }}
              </span>
              <div class="text-right">
                <p class="text-xs text-muted">
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

        <!-- Quick Stats -->
        <div
          class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8"
        >
          <div
            class="card bg-gradient-to-br from-info/10 to-info/5 border border-info/20 shadow-lg"
          >
            <div class="p-1.5 sm:p-2">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-semibold text-info">
                    {{ t('views.account.totalTransactions') }}
                  </h3>
                  <p class="text-2xl font-bold text-info">
                    {{ account.transactions?.length || 0 }}
                  </p>
                </div>
                <RiFileTextLine class="w-8 h-8 text-info/60" />
              </div>
            </div>
          </div>

          <div
            class="card bg-gradient-to-br from-success/10 to-success/5 border border-success/20 shadow-lg"
          >
            <div class="p-1.5 sm:p-2">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-semibold text-success">
                    {{ t('views.account.totalCredit') }}
                  </h3>
                  <p class="text-2xl font-bold text-success">
                    {{ formatCurrency(totalCredit, account.currency || 'CHF') }}
                  </p>
                </div>
                <RiArrowUpLine class="w-8 h-8 text-success/60" />
              </div>
            </div>
          </div>

          <div
            class="card bg-gradient-to-br from-error/10 to-error/5 border border-error/20 shadow-lg"
          >
            <div class="p-1.5 sm:p-2">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-semibold text-error">
                    {{ t('views.account.totalDebit') }}
                  </h3>
                  <p class="text-2xl font-bold text-error">
                    {{
                      formatCurrency(
                        Math.abs(totalDebit),
                        account.currency || 'CHF',
                      )
                    }}
                  </p>
                </div>
                <RiArrowDownLine class="w-8 h-8 text-error/60" />
              </div>
            </div>
          </div>
        </div>

        <!-- Transactions Section -->
        <div class="card bg-secondary shadow-xl">
          <div class="card-body p-0">
            <!-- Transactions Header with Filters -->
            <div class="p-1.5 sm:p-2 border-b border-primary">
              <div
                class="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <h2 class="text-xl font-bold flex items-center">
                  <RiFileTextLine class="w-6 h-6 mr-2" />
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
                      <BaseButton
                        variant="ghost"
                        size="sm"
                        class="h-10 w-10 p-0"
                      >
                        <RiSearchLine class="w-4 h-4" />
                      </BaseButton>
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
              class="p-1.5 sm:p-2"
            >
              <div class="space-y-3">
                <div
                  v-for="transaction in paginatedTransactions"
                  :key="transaction.id"
                  class="card bg-primary hover:bg-tertiary shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                  @click="selectTransaction(transaction)"
                >
                  <div class="p-1.5 sm:p-2">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center space-x-4 flex-1 min-w-0">
                        <!-- Transaction Type Icon -->
                        <div class="flex-shrink-0">
                          <div
                            class="w-10 h-10 rounded-full flex items-center justify-center text-white"
                            :class="
                              getTransactionColorClass(
                                transaction.amount,
                              ).replace('text-', 'bg-')
                            "
                          >
                            <RiArrowUpLine
                              v-if="
                                getTransactionIconDirection(transaction.amount)
                              "
                              class="w-5 h-5"
                            />
                            <RiArrowDownLine
                              v-else
                              class="w-5 h-5"
                            />
                          </div>
                        </div>

                        <!-- Transaction Details -->
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center justify-between mb-1">
                            <h4 class="font-semibold text-sm truncate">
                              {{ transaction.description || 'No description' }}
                            </h4>
                            <span class="text-xs text-muted ml-2">
                              {{ formatDate(transaction.transactionDate) }}
                            </span>
                          </div>
                          <div class="flex items-center text-xs text-muted">
                            <RiWalletLine class="w-3 h-3 mr-1" />
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
                              getTransactionColorClass(transaction.amount)
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
                  <BaseButton
                    variant="ghost"
                    size="sm"
                    class="join-item"
                    :disabled="currentPage === 1"
                    @click="currentPage = 1"
                  >
                    «
                  </BaseButton>
                  <BaseButton
                    variant="ghost"
                    size="sm"
                    class="join-item"
                    :disabled="currentPage === 1"
                    @click="currentPage--"
                  >
                    ‹
                  </BaseButton>
                  <BaseButton
                    variant="primary"
                    size="sm"
                    class="join-item"
                  >
                    {{ currentPage }}
                  </BaseButton>
                  <BaseButton
                    variant="ghost"
                    size="sm"
                    class="join-item"
                    :disabled="currentPage === totalPages"
                    @click="currentPage++"
                  >
                    ›
                  </BaseButton>
                  <BaseButton
                    variant="ghost"
                    size="sm"
                    class="join-item"
                    :disabled="currentPage === totalPages"
                    @click="currentPage = totalPages"
                  >
                    »
                  </BaseButton>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div
              v-else
              class="p-12 text-center"
            >
              <RiFileTextLine class="w-16 h-16 mx-auto text-muted mb-4" />
              <h3 class="text-lg font-semibold text-muted mb-2">
                {{ t('views.account.noTransactions') }}
              </h3>
              <p class="text-muted mb-4">
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
        <p class="text-muted">{{ t('common.loading') }}</p>
      </div>
    </div>

    <!-- Transaction Detail Modal -->
    <dialog
      ref="transactionModal"
      class="modal"
    >
      <div
        v-if="selectedTransaction"
        class="modal-box w-11/12 max-w-2xl"
      >
        <div class="flex justify-between items-center mb-6">
          <h3 class="font-bold text-lg">
            {{ t('views.account.transactionDetails') }}
          </h3>
          <BaseButton
            variant="ghost"
            size="sm"
            class="h-8 w-8 p-0 rounded-full"
            @click="closeTransactionModal"
          >
            <RiCloseLine class="w-4 h-4" />
          </BaseButton>
        </div>

        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-semibold text-muted">{{
                t('views.account.transactions.table.date')
              }}</label>
              <p class="text-lg">
                {{ formatDate(selectedTransaction.transactionDate) }}
              </p>
            </div>
            <div>
              <label class="text-sm font-semibold text-muted">{{
                t('views.account.transactions.table.amount')
              }}</label>
              <p
                class="text-lg font-bold"
                :class="getTransactionColorClass(selectedTransaction.amount)"
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
            <label class="text-sm font-semibold text-muted">{{
              t('views.account.transactions.table.description')
            }}</label>
            <p class="text-lg">
              {{ selectedTransaction.description || 'No description' }}
            </p>
          </div>

          <div>
            <label class="text-sm font-semibold text-muted">{{
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
          <BaseButton
            variant="ghost"
            @click="closeTransactionModal"
          >
            {{ t('common.close') }}
          </BaseButton>
        </div>
      </div>
      <form
        method="dialog"
        class="modal-backdrop"
      >
        <BaseButton
          variant="ghost"
          class="opacity-0"
          @click="closeTransactionModal"
        >
          close
        </BaseButton>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import {
  RiArrowLeftLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiSearchLine,
  RiPencilLine,
  RiDeleteBinLine,
  RiSaveLine,
  RiCloseLine,
  RiWalletLine,
} from '@remixicon/vue';
import PageHeader from '../components/PageHeader.vue';
import BaseButton from '../components/BaseButton.vue';
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

    return response;
  },
});

// Computed Properties
const totalCredit = computed(() => {
  if (
    !account.value?.transactions ||
    !Array.isArray(account.value.transactions)
  ) {
    return 0;
  }

  const credit = account.value.transactions
    .filter((t: any) => {
      const amount = parseFloat(t.amount) || 0;
      return amount > 0;
    })
    .reduce((sum: number, t: any) => {
      const amount = parseFloat(t.amount) || 0;
      return sum + amount;
    }, 0);

  return credit;
});

const totalDebit = computed(() => {
  if (
    !account.value?.transactions ||
    !Array.isArray(account.value.transactions)
  ) {
    return 0;
  }

  const debit = account.value.transactions
    .filter((t: any) => {
      const amount = parseFloat(t.amount) || 0;
      return amount < 0;
    })
    .reduce((sum: number, t: any) => {
      const amount = parseFloat(t.amount) || 0;
      return sum + amount;
    }, 0);

  return debit;
});

// Add computed property for account balance with proper parsing
const accountBalance = computed(() => {
  if (!account.value) {
    return 0;
  }

  if (
    !account.value.transactions ||
    !Array.isArray(account.value.transactions)
  ) {
    // Fallback to API balance field if available
    if (account.value.balance !== undefined && account.value.balance !== null) {
      const balance = parseFloat(account.value.balance) || 0;
      return balance;
    }
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

  // Add opening balance if available
  const openingBalance = parseFloat(account.value.openingBalance) || 0;
  const finalBalance = calculatedBalance + openingBalance;

  return finalBalance;
});

const filteredTransactions = computed(() => {
  if (
    !account.value?.transactions ||
    !Array.isArray(account.value.transactions)
  ) {
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

// Helper methods for handling expense account color inversion
const isNegativeAccount = () => {
  if (!account.value) return false;
  const type = account.value.type || 'ASSETS';
  return type === 'EXPENSE' || type === 'LIABILITIES';
};

const getBalanceColorClass = (balance: number) => {
  const isPositive = balance >= 0;
  if (isNegativeAccount()) {
    // For expense/liability accounts, invert the colors
    return isPositive ? 'text-error' : 'text-success';
  } else {
    // For asset/income accounts, normal colors
    return isPositive ? 'text-success' : 'text-error';
  }
};

const getTransactionColorClass = (amount: string | number) => {
  const numAmount = parseFloat(amount?.toString() || '0') || 0;
  const isPositive = numAmount >= 0;
  if (isNegativeAccount()) {
    // For expense/liability accounts, invert the colors
    return isPositive ? 'text-error' : 'text-success';
  } else {
    // For asset/income accounts, normal colors
    return isPositive ? 'text-success' : 'text-error';
  }
};

const getTransactionIconDirection = (amount: string | number) => {
  const numAmount = parseFloat(amount?.toString() || '0') || 0;
  const isPositive = numAmount >= 0;
  if (isNegativeAccount()) {
    // For expense/liability accounts, invert the icons
    return !isPositive; // negative amounts get up arrow (good)
  } else {
    // For asset/income accounts, normal icons
    return isPositive; // positive amounts get up arrow (good)
  }
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
