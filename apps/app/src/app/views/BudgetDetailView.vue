<template>
  <div class="min-h-screen bg-primary">
    <PageHeader
      :title="budget?.name ?? t('common.loading')"
      :subtitle="`${t('views.budgets.fiscalYear')} ${budget?.year ?? ''}`"
    />

    <div class="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-none xl:max-w-screen-xl">
      <!-- View Controls -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <!-- Monthly / Yearly toggle -->
        <div class="flex gap-1 bg-secondary rounded-lg p-1">
          <BaseButton
            :variant="viewMode === 'yearly' ? 'primary' : 'ghost'"
            size="sm"
            @click="setViewMode('yearly')"
          >
            {{ t('views.budgets.yearlyView') }}
          </BaseButton>
          <BaseButton
            :variant="viewMode === 'monthly' ? 'primary' : 'ghost'"
            size="sm"
            @click="setViewMode('monthly')"
          >
            {{ t('views.budgets.monthlyView') }}
          </BaseButton>
        </div>

        <!-- Month selector (only in monthly mode) -->
        <div
          v-if="viewMode === 'monthly'"
          class="flex gap-2 flex-wrap"
        >
          <BaseButton
            v-for="m in 12"
            :key="m"
            :variant="selectedMonth === m ? 'primary' : 'ghost'"
            size="sm"
            class="min-w-[2.5rem]"
            @click="selectedMonth = m"
          >
            {{ monthLabel(m) }}
          </BaseButton>
        </div>

        <div class="flex-1" />

        <!-- Edit Items button -->
        <BaseButton
          variant="secondary"
          size="sm"
          @click="openEditModal"
        >
          <RiPencilLine class="w-4 h-4 mr-1" />
          {{ t('views.budgets.editItems') }}
        </BaseButton>
      </div>

      <!-- Progress Items -->
      <div
        v-if="progress && !loadingProgress"
        class="space-y-4"
      >
        <div
          v-if="!progress.items.length"
          class="card"
        >
          <div class="p-10 text-center">
            <RiMoneyDollarCircleLine class="w-12 h-12 mx-auto text-muted mb-3" />
            <p class="text-muted">{{ t('views.budgets.budgetItems.noItems') }}</p>
            <BaseButton
              variant="primary"
              class="mt-4"
              @click="openEditModal"
            >
              {{ t('views.budgets.budgetItems.addItem') }}
            </BaseButton>
          </div>
        </div>

        <div
          v-for="item in progress.items"
          :key="item.id"
          class="card shadow"
        >
          <div class="p-4">
            <!-- Item header -->
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-semibold text-primary">
                    {{ item.categoryName ?? item.accountName }}
                  </span>
                  <span class="badge badge-outline text-xs">
                    {{ item.type === 'category' ? t('views.budgets.budgetItems.type.category') : t('views.budgets.budgetItems.type.account') }}
                  </span>
                  <span
                    v-if="item.recommendation"
                    class="badge badge-error text-xs"
                  >
                    {{ t(`views.budgets.progress.recommendations.${item.recommendation}`) }}
                  </span>
                </div>
                <p class="text-sm text-muted mt-0.5">
                  {{ formatCurrency(item.displayBudget, 'CHF') }}
                  {{ viewMode === 'monthly' ? t('views.budgets.progress.monthlyBudget') : t('views.budgets.progress.yearlyBudget') }}
                </p>
              </div>

              <div class="text-right ml-4 flex-shrink-0">
                <p
                  class="font-bold"
                  :class="item.percentage > 100 ? 'text-error' : item.percentage > 80 ? 'text-warning' : 'text-success'"
                >
                  {{ formatCurrency(item.actual, 'CHF') }}
                </p>
                <p class="text-xs text-muted">{{ item.percentage }}%</p>
              </div>
            </div>

            <!-- Progress bar -->
            <div class="w-full bg-tertiary rounded-full h-2 mb-3">
              <div
                class="h-2 rounded-full transition-all duration-500"
                :class="item.percentage > 100 ? 'bg-error' : item.percentage > 80 ? 'bg-warning' : 'bg-success'"
                :style="{ width: `${Math.min(item.percentage, 100)}%` }"
              />
            </div>

            <!-- Trend info -->
            <div class="flex flex-wrap gap-4 text-xs text-muted">
              <span v-if="item.monthOverMonthChange !== null">
                <span
                  :class="item.monthOverMonthChange > 0 ? 'text-error' : 'text-success'"
                >
                  {{ item.monthOverMonthChange > 0 ? '↑' : '↓' }}
                  {{ Math.abs(item.monthOverMonthChange) }}%
                </span>
                {{ t('views.budgets.progress.vsLastPeriod') }}
              </span>
              <span v-if="item.projectedYearly !== null">
                {{ t('views.budgets.progress.projectedYearly') }}
                <strong>{{ formatCurrency(item.projectedYearly, 'CHF') }}</strong>
                {{ t('views.budgets.progress.of') }}
                <strong>{{ formatCurrency(item.yearlyBudget, 'CHF') }}</strong>
              </span>
            </div>

            <!-- Collapsible account breakdown for category items -->
            <div
              v-if="item.type === 'category' && item.accounts.length"
              class="mt-3"
            >
              <button
                class="flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors"
                @click="toggleExpanded(item.id)"
              >
                <component
                  :is="expandedItems.has(item.id) ? RiArrowDownSLine : RiArrowRightSLine"
                  class="w-4 h-4"
                />
                {{ item.accounts.length }} {{ t('views.budgets.progress.accounts') }}
              </button>

              <div
                v-if="expandedItems.has(item.id)"
                class="mt-2 space-y-1 pl-4 border-l-2 border-primary"
              >
                <div
                  v-for="acc in item.accounts"
                  :key="acc.id"
                  class="flex items-center justify-between text-sm py-1"
                >
                  <span class="text-secondary truncate">{{ acc.name }}</span>
                  <span class="text-muted ml-4 flex-shrink-0">{{ formatCurrency(acc.actual, 'CHF') }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading progress -->
      <div
        v-else-if="loadingProgress"
        class="space-y-4"
      >
        <div
          v-for="i in 4"
          :key="i"
          class="card"
        >
          <div class="p-4 space-y-3">
            <div class="skeleton h-5 w-1/2"></div>
            <div class="skeleton h-2 w-full"></div>
            <div class="skeleton h-4 w-1/3"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Items Modal -->
    <dialog
      ref="editModal"
      class="modal"
      @click="closeEditModal"
    >
      <div
        class="modal-box w-11/12 max-w-2xl"
        @click.stop
      >
        <div class="modal-header">
          <h3 class="modal-title">
            <RiPencilLine class="w-6 h-6" />
            {{ t('views.budgets.budgetItems.title') }}
          </h3>
          <BaseButton
            variant="ghost"
            size="sm"
            class="h-8 w-8 p-0 rounded-full"
            @click="closeEditModal"
          >
            <RiCloseLine class="w-4 h-4" />
          </BaseButton>
        </div>

        <div class="modal-content space-y-4">
          <!-- Existing items -->
          <div
            v-if="editItems.length"
            class="space-y-2"
          >
            <div
              v-for="(item, idx) in editItems"
              :key="idx"
              class="flex items-center gap-3 p-3 bg-primary rounded-lg"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">
                  {{ item.categoryName ?? item.accountName ?? '—' }}
                </p>
                <p class="text-xs text-muted">
                  {{ item.type === 'category' ? t('views.budgets.budgetItems.type.category') : t('views.budgets.budgetItems.type.account') }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="item.amount"
                  type="number"
                  step="0.01"
                  min="0"
                  class="input input-bordered input-sm w-28"
                />
                <select
                  v-model="item.frequency"
                  class="select select-bordered select-sm"
                >
                  <option value="monthly">{{ t('views.budgets.budgetItems.frequency.monthly') }}</option>
                  <option value="yearly">{{ t('views.budgets.budgetItems.frequency.yearly') }}</option>
                </select>
                <button
                  type="button"
                  class="text-muted hover:text-error transition-colors"
                  @click="removeEditItem(idx)"
                >
                  <RiDeleteBinLine class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- Add new item form -->
          <div class="border-t border-primary pt-4">
            <p class="text-sm font-semibold text-secondary mb-3">
              {{ t('views.budgets.budgetItems.addItem') }}
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <!-- Type toggle -->
              <div>
                <label class="block text-xs font-medium text-muted mb-1">
                  {{ t('views.budgets.budgetItems.budgetBy') }}
                </label>
                <div class="flex gap-1 bg-secondary rounded-lg p-1 w-fit">
                  <BaseButton
                    :variant="newItem.type === 'category' ? 'primary' : 'ghost'"
                    size="sm"
                    @click="newItem.type = 'category'"
                  >
                    {{ t('views.budgets.budgetItems.type.category') }}
                  </BaseButton>
                  <BaseButton
                    :variant="newItem.type === 'account' ? 'primary' : 'ghost'"
                    size="sm"
                    @click="newItem.type = 'account'"
                  >
                    {{ t('views.budgets.budgetItems.type.account') }}
                  </BaseButton>
                </div>
              </div>

              <!-- Target (category or account) -->
              <div v-if="newItem.type === 'category'">
                <label class="block text-xs font-medium text-muted mb-1">
                  {{ t('views.budgets.budgetItems.type.category') }}
                </label>
                <select
                  v-model="newItem.categoryId"
                  class="select select-bordered select-sm w-full"
                >
                  <option value="">{{ t('views.budgets.budgetItems.selectCategory') }}</option>
                  <option
                    v-for="cat in categories"
                    :key="cat.id"
                    :value="cat.id"
                  >
                    {{ cat.name }}
                  </option>
                </select>
              </div>

              <div v-else>
                <label class="block text-xs font-medium text-muted mb-1">
                  {{ t('views.budgets.budgetItems.type.account') }}
                </label>
                <select
                  v-model="newItem.accountId"
                  class="select select-bordered select-sm w-full"
                >
                  <option value="">{{ t('views.budgets.budgetItems.selectAccount') }}</option>
                  <option
                    v-for="acc in allAccounts"
                    :key="acc.id"
                    :value="acc.id"
                  >
                    {{ acc.name }}
                  </option>
                </select>
              </div>

              <!-- Amount -->
              <div>
                <label class="block text-xs font-medium text-muted mb-1">
                  {{ t('views.budgets.budgetItems.amount.label') }}
                </label>
                <input
                  v-model.number="newItem.amount"
                  type="number"
                  step="0.01"
                  min="0"
                  class="input input-bordered input-sm w-full"
                  placeholder="0.00"
                />
              </div>

              <!-- Frequency -->
              <div>
                <label class="block text-xs font-medium text-muted mb-1">
                  {{ t('views.budgets.budgetItems.frequency.label') }}
                </label>
                <select
                  v-model="newItem.frequency"
                  class="select select-bordered select-sm w-full"
                >
                  <option value="monthly">{{ t('views.budgets.budgetItems.frequency.monthly') }}</option>
                  <option value="yearly">{{ t('views.budgets.budgetItems.frequency.yearly') }}</option>
                </select>
              </div>
            </div>

            <BaseButton
              variant="secondary"
              size="sm"
              class="mt-3"
              @click="addNewItem"
            >
              <RiAddLine class="w-4 h-4 mr-1" />
              {{ t('views.budgets.budgetItems.addToList') }}
            </BaseButton>
          </div>
        </div>

        <div class="modal-footer">
          <BaseButton
            variant="ghost"
            @click="closeEditModal"
          >
            {{ t('words.cancel') }}
          </BaseButton>
          <BaseButton
            variant="primary"
            :disabled="savingItems"
            @click="saveItems"
          >
            {{ t('views.budgets.budgetItems.saveItems') }}
          </BaseButton>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import {
  RiAddLine,
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiMoneyDollarCircleLine,
  RiPencilLine,
} from '@remixicon/vue';
import PageHeader from '../components/PageHeader.vue';
import BaseButton from '../components/BaseButton.vue';
import { useAccounts } from '../composables/useAccounts';
import { useBudgets, type BudgetDetail, type BudgetProgress } from '../composables/useBudgets/useBudgets';
import { useCategories } from '../composables/useCategories/useCategories';
import { useCurrency } from '../composables/useCurrency';
import { useLanguage } from '../composables/useLanguage';
import { useToast } from '../composables/useToast';

const route = useRoute();
const { t } = useLanguage();
const { formatCurrency } = useCurrency();
const { success, error } = useToast();
const { fetchBudget, upsertBudgetItems, fetchProgress } = useBudgets();
const { categories } = useCategories();
const { accounts: rawAccounts } = useAccounts();

const budgetId = computed(() => route.params.id as string);
const budget = ref<BudgetDetail | null>(null);
const progress = ref<BudgetProgress | null>(null);
const loadingProgress = ref(false);
const viewMode = ref<'yearly' | 'monthly'>('yearly');
const selectedMonth = ref(new Date().getMonth() + 1);
const expandedItems = ref(new Set<string>());
const editModal = ref<HTMLDialogElement>();
const savingItems = ref(false);

const allAccounts = computed(() => [
  ...(rawAccounts.value?.assets?.accounts ?? []),
  ...(rawAccounts.value?.liabilities?.accounts ?? []),
  ...(rawAccounts.value?.income?.accounts ?? []),
  ...(rawAccounts.value?.expense?.accounts ?? []),
  ...(rawAccounts.value?.equity?.accounts ?? []),
]);

interface EditItem {
  type: 'category' | 'account';
  categoryId: string | null;
  categoryName: string | null;
  accountId: string | null;
  accountName: string | null;
  amount: number;
  frequency: 'monthly' | 'yearly';
}

const editItems = ref<EditItem[]>([]);
const newItem = ref<{
  type: 'category' | 'account';
  categoryId: string;
  accountId: string;
  amount: number;
  frequency: 'monthly' | 'yearly';
}>({ type: 'category', categoryId: '', accountId: '', amount: 0, frequency: 'monthly' });

const monthLabel = (m: number) =>
  new Intl.DateTimeFormat('default', { month: 'short' }).format(new Date(2000, m - 1, 1));

const setViewMode = (mode: 'yearly' | 'monthly') => {
  viewMode.value = mode;
};

const toggleExpanded = (id: string) => {
  if (expandedItems.value.has(id)) {
    expandedItems.value.delete(id);
  } else {
    expandedItems.value.add(id);
  }
};

const loadProgress = async () => {
  if (!budget.value) return;
  loadingProgress.value = true;
  try {
    const month = viewMode.value === 'monthly' ? selectedMonth.value : undefined;
    progress.value = await fetchProgress(budgetId.value, budget.value.year, month);
  } finally {
    loadingProgress.value = false;
  }
};

onMounted(async () => {
  budget.value = await fetchBudget(budgetId.value);
  await loadProgress();
});

watch([viewMode, selectedMonth], loadProgress);

const openEditModal = () => {
  editItems.value = (budget.value?.items ?? []).map((item) => ({
    type: item.type,
    categoryId: item.categoryId,
    categoryName: item.categoryName,
    accountId: item.accountId,
    accountName: item.accountName,
    amount: item.amount,
    frequency: item.frequency,
  }));
  newItem.value = { type: 'category', categoryId: '', accountId: '', amount: 0, frequency: 'monthly' };
  editModal.value?.showModal();
};

const closeEditModal = () => editModal.value?.close();

const addNewItem = () => {
  const isCategory = newItem.value.type === 'category';
  const targetId = isCategory ? newItem.value.categoryId : newItem.value.accountId;
  if (!targetId || newItem.value.amount <= 0) return;

  if (isCategory) {
    const cat = categories.value.find((c) => c.id === newItem.value.categoryId);
    editItems.value.push({
      type: 'category',
      categoryId: newItem.value.categoryId,
      categoryName: cat?.name ?? null,
      accountId: null,
      accountName: null,
      amount: newItem.value.amount,
      frequency: newItem.value.frequency,
    });
  } else {
    const acc = allAccounts.value.find((a) => a.id === newItem.value.accountId);
    editItems.value.push({
      type: 'account',
      categoryId: null,
      categoryName: null,
      accountId: newItem.value.accountId,
      accountName: acc?.name ?? null,
      amount: newItem.value.amount,
      frequency: newItem.value.frequency,
    });
  }

  newItem.value = { type: 'category', categoryId: '', accountId: '', amount: 0, frequency: 'monthly' };
};

const removeEditItem = (idx: number) => {
  editItems.value.splice(idx, 1);
};

const saveItems = async () => {
  savingItems.value = true;
  try {
    budget.value = await upsertBudgetItems(
      budgetId.value,
      editItems.value.map((item) => ({
        type: item.type,
        categoryId: item.categoryId ?? undefined,
        accountId: item.accountId ?? undefined,
        amount: item.amount,
        frequency: item.frequency,
      })),
    );
    closeEditModal();
    await loadProgress();
    success(t('views.budgets.budgetItems.saveSuccess'));
  } catch {
    error(t('views.budgets.budgetItems.saveError'));
  } finally {
    savingItems.value = false;
  }
};
</script>
