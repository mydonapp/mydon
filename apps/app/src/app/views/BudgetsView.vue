<template>
  <div class="min-h-screen bg-primary">
    <PageHeader
      :title="t('views.budgets.title')"
      :subtitle="t('views.budgets.subtitle')"
    />

    <div class="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-none xl:max-w-screen-xl">
      <!-- Header Actions -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-semibold text-primary">
          {{ budgets.length }} {{ t('views.budgets.budgetCount') }}
        </h2>
        <BaseButton
          variant="primary"
          @click="openCreateModal"
        >
          <RiAddLine class="w-5 h-5 mr-2" />
          {{ t('views.budgets.addBudget') }}
        </BaseButton>
      </div>

      <!-- Budget Cards -->
      <div
        v-if="!loading && budgets.length"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <div
          v-for="budget in budgets"
          :key="budget.id"
          class="card hover:card-elevated transition-shadow cursor-pointer"
          @click="$router.push({ name: 'BudgetDetail', params: { id: budget.id } })"
        >
          <div class="p-4">
            <div class="flex items-start justify-between mb-3">
              <div class="min-w-0 flex-1">
                <h3 class="font-bold text-primary truncate">{{ budget.name }}</h3>
                <p class="text-sm text-muted">{{ budget.year }}</p>
              </div>
              <div class="flex items-center gap-2 ml-3 flex-shrink-0">
                <span class="badge badge-outline text-xs">
                  {{ budget.itemCount }} {{ t('views.budgets.items') }}
                </span>
                <button
                  class="text-muted hover:text-error transition-colors p-1"
                  @click.stop="confirmDelete(budget)"
                >
                  <RiDeleteBinLine class="w-4 h-4" />
                </button>
              </div>
            </div>
            <div class="flex items-center text-sm text-muted">
              <RiCalendarLine class="w-4 h-4 mr-1 flex-shrink-0" />
              {{ t('views.budgets.fiscalYear') }} {{ budget.year }}
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!loading"
        class="card shadow-xl"
      >
        <div class="p-12 text-center">
          <RiMoneyDollarCircleLine class="w-16 h-16 mx-auto text-muted mb-4" />
          <h3 class="text-lg font-semibold text-primary mb-2">
            {{ t('views.budgets.noBudgets') }}
          </h3>
          <p class="text-muted mb-6">{{ t('views.budgets.noBudgetsDescription') }}</p>
          <BaseButton
            variant="primary"
            @click="openCreateModal"
          >
            <RiAddLine class="w-5 h-5 mr-2" />
            {{ t('views.budgets.addFirstBudget') }}
          </BaseButton>
        </div>
      </div>

      <!-- Loading -->
      <div
        v-else
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <div
          v-for="i in 3"
          :key="i"
          class="card"
        >
          <div class="p-4 space-y-3">
            <div class="skeleton h-5 w-3/4"></div>
            <div class="skeleton h-4 w-1/4"></div>
            <div class="skeleton h-4 w-1/2"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Budget Modal -->
    <dialog
      ref="createModal"
      class="modal"
      @click="closeCreateModal"
    >
      <div
        class="modal-box w-11/12 max-w-md"
        @click.stop
      >
        <div class="modal-header">
          <h3 class="modal-title">
            <RiAddLine class="w-6 h-6" />
            {{ t('views.budgets.addBudgetForm.title') }}
          </h3>
          <BaseButton
            variant="ghost"
            size="sm"
            class="h-8 w-8 p-0 rounded-full"
            @click="closeCreateModal"
          >
            <RiCloseLine class="w-4 h-4" />
          </BaseButton>
        </div>

        <div class="modal-content">
          <form
            class="space-y-4"
            @submit.prevent="submitCreate"
          >
            <BaseInput
              v-model="form.name"
              type="text"
              :label="t('views.budgets.addBudgetForm.name.label')"
              :placeholder="t('views.budgets.addBudgetForm.name.placeholder')"
              required
            />
            <BaseInput
              v-model.number="form.year"
              type="number"
              :label="t('views.budgets.addBudgetForm.year.label')"
              :placeholder="String(currentYear)"
              required
            />
          </form>
        </div>

        <div class="modal-footer">
          <BaseButton
            variant="ghost"
            @click="closeCreateModal"
          >
            {{ t('words.cancel') }}
          </BaseButton>
          <BaseButton
            variant="primary"
            :disabled="submitting"
            @click="submitCreate"
          >
            {{ t('views.budgets.addBudgetForm.submit.label') }}
          </BaseButton>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import {
  RiAddLine,
  RiCalendarLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiMoneyDollarCircleLine,
} from '@remixicon/vue';
import { useRouter } from 'vue-router';
import PageHeader from '../components/PageHeader.vue';
import BaseButton from '../components/BaseButton.vue';
import BaseInput from '../components/BaseInput.vue';
import { useBudgets, type BudgetSummary } from '../composables/useBudgets/useBudgets';
import { useLanguage } from '../composables/useLanguage';
import { useToast } from '../composables/useToast';

const { t } = useLanguage();
const { success, error } = useToast();
const { fetchBudgets, createBudget, deleteBudget } = useBudgets();
const router = useRouter();

const budgets = ref<BudgetSummary[]>([]);
const loading = ref(true);
const submitting = ref(false);
const createModal = ref<HTMLDialogElement>();
const currentYear = new Date().getFullYear();

const form = ref({ name: '', year: currentYear });

const load = async () => {
  loading.value = true;
  try {
    budgets.value = await fetchBudgets();
  } finally {
    loading.value = false;
  }
};

onMounted(load);

const openCreateModal = () => {
  form.value = { name: '', year: currentYear };
  createModal.value?.showModal();
};

const closeCreateModal = () => createModal.value?.close();

const submitCreate = async () => {
  if (!form.value.name || !form.value.year) return;
  submitting.value = true;
  try {
    const budget = await createBudget(form.value.name, form.value.year);
    closeCreateModal();
    success(t('views.budgets.addBudgetForm.success'));
    router.push({ name: 'BudgetDetail', params: { id: budget.id } });
  } catch {
    error(t('views.budgets.addBudgetForm.error'));
  } finally {
    submitting.value = false;
  }
};

const confirmDelete = async (budget: BudgetSummary) => {
  if (!confirm(t('views.budgets.confirmDelete', { name: budget.name }))) return;
  try {
    await deleteBudget(budget.id);
    budgets.value = budgets.value.filter((b) => b.id !== budget.id);
    success(t('views.budgets.deleteSuccess'));
  } catch {
    error(t('views.budgets.deleteError'));
  }
};
</script>
