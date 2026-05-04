<template>
  <div class="min-h-screen bg-primary">
    <PageHeader
      :title="t('views.manage.title')"
      :subtitle="t('views.manage.subtitle')"
    />

    <div class="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-none xl:max-w-screen-xl">
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <!-- ── Categories Panel ── -->
        <div class="xl:col-span-1">
          <div class="card shadow-xl h-full">
            <div class="p-4 sm:p-6">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-bold text-primary flex items-center gap-2">
                  <RiPriceTag3Line class="w-5 h-5 text-muted" />
                  {{ t('views.manage.categories.title') }}
                </h2>
                <BaseButton
                  variant="primary"
                  size="sm"
                  @click="openAddCategory"
                >
                  <RiAddLine class="w-4 h-4 mr-1" />
                  {{ t('common.add') }}
                </BaseButton>
              </div>

              <!-- Add category inline form -->
              <div
                v-if="addingCategory"
                class="flex gap-2 mb-3"
              >
                <input
                  ref="newCategoryInput"
                  v-model="newCategoryName"
                  type="text"
                  class="input input-bordered input-sm flex-1"
                  :placeholder="t('views.manage.categories.namePlaceholder')"
                  @keydown.enter.prevent="saveNewCategory"
                  @keydown.escape="cancelAddCategory"
                />
                <BaseButton
                  variant="primary"
                  size="sm"
                  @click="saveNewCategory"
                >
                  {{ t('common.save') }}
                </BaseButton>
                <BaseButton
                  variant="ghost"
                  size="sm"
                  @click="cancelAddCategory"
                >
                  {{ t('common.cancel') }}
                </BaseButton>
              </div>

              <!-- Categories list -->
              <div
                v-if="categories.length"
                class="space-y-1"
              >
                <div
                  v-for="cat in categories"
                  :key="cat.id"
                  class="flex items-center gap-2 group"
                >
                  <!-- View mode -->
                  <template v-if="editingCategoryId !== cat.id">
                    <span class="flex-1 text-sm text-primary py-2 px-1 truncate">
                      {{ cat.name }}
                    </span>
                    <button
                      class="opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-primary p-1"
                      @click="startEditCategory(cat)"
                    >
                      <RiPencilLine class="w-3.5 h-3.5" />
                    </button>
                  </template>

                  <!-- Edit mode -->
                  <template v-else>
                    <input
                      v-model="editingCategoryName"
                      type="text"
                      class="input input-bordered input-sm flex-1"
                      @keydown.enter.prevent="saveEditCategory(cat.id)"
                      @keydown.escape="cancelEditCategory"
                    />
                    <BaseButton
                      variant="primary"
                      size="sm"
                      class="px-2"
                      @click="saveEditCategory(cat.id)"
                    >
                      <RiCheckLine class="w-3.5 h-3.5" />
                    </BaseButton>
                    <BaseButton
                      variant="ghost"
                      size="sm"
                      class="px-2"
                      @click="cancelEditCategory"
                    >
                      <RiCloseLine class="w-3.5 h-3.5" />
                    </BaseButton>
                  </template>
                </div>
              </div>

              <p
                v-else-if="!categoriesLoading"
                class="text-sm text-muted text-center py-6"
              >
                {{ t('views.manage.categories.empty') }}
              </p>

              <div
                v-else
                class="space-y-2"
              >
                <div
                  v-for="i in 4"
                  :key="i"
                  class="skeleton h-8 w-full"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- ── Accounts Panel ── -->
        <div class="xl:col-span-2">
          <div class="card shadow-xl">
            <div class="p-4 sm:p-6">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-bold text-primary flex items-center gap-2">
                  <RiWallet3Line class="w-5 h-5 text-muted" />
                  {{ t('views.manage.accounts.title') }}
                </h2>
                <div class="flex items-center gap-2">
                  <label class="flex items-center gap-1.5 text-xs text-muted cursor-pointer select-none">
                    <input
                      v-model="showInactive"
                      type="checkbox"
                      class="checkbox checkbox-xs"
                    />
                    {{ t('views.manage.accounts.showInactive') }}
                  </label>
                  <BaseButton
                    variant="primary"
                    size="sm"
                    @click="openAddAccountModal"
                  >
                    <RiAddLine class="w-4 h-4 mr-1" />
                    {{ t('common.add') }}
                  </BaseButton>
                </div>
              </div>

              <!-- Account type tabs -->
              <div class="flex gap-1 flex-wrap mb-4">
                <BaseButton
                  v-for="tab in accountTypeTabs"
                  :key="tab.value"
                  :variant="activeTypeTab === tab.value ? 'primary' : 'ghost'"
                  size="sm"
                  @click="activeTypeTab = tab.value"
                >
                  {{ tab.label }}
                  <span class="ml-1 text-xs opacity-70">{{ accountCountByType(tab.value) }}</span>
                </BaseButton>
              </div>

              <!-- Accounts list -->
              <div
                v-if="!accountsLoading && filteredAccounts.length"
                class="space-y-2"
              >
                <div
                  v-for="account in filteredAccounts"
                  :key="account.id"
                  class="rounded-lg border border-primary p-3"
                  :class="!account.isActive ? 'opacity-50' : ''"
                >
                  <div
                    v-if="editingAccountId !== account.id"
                    class="flex items-center gap-3"
                  >
                    <!-- Account info -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="font-medium text-sm text-primary truncate">
                          {{ account.name }}
                        </span>
                        <span
                          v-if="account.categoryName"
                          class="badge badge-outline text-xs"
                        >
                          {{ account.categoryName }}
                        </span>
                        <span
                          v-if="!account.isActive"
                          class="badge badge-error text-xs"
                        >
                          {{ t('views.manage.accounts.inactive') }}
                        </span>
                      </div>
                      <p class="text-xs text-muted mt-0.5">{{ account.currency }}</p>
                    </div>

                    <!-- Controls -->
                    <div class="flex items-center gap-2 flex-shrink-0">
                      <button
                        :title="account.isActive ? t('views.manage.accounts.deactivate') : t('views.manage.accounts.activate')"
                        class="text-muted hover:text-primary transition-colors p-1"
                        @click="toggleActive(account)"
                      >
                        <RiToggleLine
                          v-if="account.isActive"
                          class="w-5 h-5 text-success"
                        />
                        <RiToggleFill
                          v-else
                          class="w-5 h-5 text-muted"
                        />
                      </button>
                      <button
                        class="text-muted hover:text-primary transition-colors p-1"
                        @click="startEditAccount(account)"
                      >
                        <RiPencilLine class="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <!-- Edit row -->
                  <div
                    v-else
                    class="space-y-3"
                  >
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-medium text-muted mb-1">
                          {{ t('views.manage.accounts.name') }}
                        </label>
                        <input
                          v-model="editAccountForm.name"
                          type="text"
                          class="input input-bordered input-sm w-full"
                        />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-muted mb-1">
                          {{ t('views.accounts.addAccountForm.category.label') }}
                        </label>
                        <select
                          v-model="editAccountForm.categoryId"
                          class="select select-bordered select-sm w-full"
                        >
                          <option value="">—</option>
                          <option
                            v-for="cat in categories"
                            :key="cat.id"
                            :value="cat.id"
                          >
                            {{ cat.name }}
                          </option>
                        </select>
                      </div>
                    </div>
                    <div class="flex gap-2 justify-end">
                      <BaseButton
                        variant="ghost"
                        size="sm"
                        @click="cancelEditAccount"
                      >
                        {{ t('common.cancel') }}
                      </BaseButton>
                      <BaseButton
                        variant="primary"
                        size="sm"
                        :disabled="savingAccount"
                        @click="saveEditAccount(account.id)"
                      >
                        {{ t('common.save') }}
                      </BaseButton>
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-else-if="!accountsLoading && !filteredAccounts.length"
                class="text-center py-8"
              >
                <RiWallet3Line class="w-10 h-10 mx-auto text-muted mb-2" />
                <p class="text-sm text-muted">{{ t('views.manage.accounts.empty') }}</p>
              </div>

              <div
                v-else
                class="space-y-2"
              >
                <div
                  v-for="i in 5"
                  :key="i"
                  class="skeleton h-14 w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Account Modal -->
    <dialog
      ref="addAccountModal"
      class="modal"
      @click="closeAddAccountModal"
    >
      <div
        class="modal-box w-11/12 max-w-lg"
        @click.stop
      >
        <div class="modal-header">
          <h3 class="modal-title">
            <RiAddLine class="w-6 h-6" />
            {{ t('views.accounts.addAccountForm.title') }}
          </h3>
          <BaseButton
            variant="ghost"
            size="sm"
            class="h-8 w-8 p-0 rounded-full"
            @click="closeAddAccountModal"
          >
            <RiCloseLine class="w-4 h-4" />
          </BaseButton>
        </div>

        <div class="modal-content">
          <form
            class="space-y-4"
            @submit.prevent="submitAddAccount"
          >
            <div>
              <label class="block text-sm font-medium text-secondary mb-1">
                {{ t('views.accounts.addAccountForm.accountName.label') }}
              </label>
              <input
                v-model="addAccountForm.name"
                type="text"
                class="input input-bordered w-full"
                :placeholder="t('views.accounts.addAccountForm.accountName.placeholder')"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary mb-1">
                {{ t('views.accounts.addAccountForm.accountType.label') }}
              </label>
              <select
                v-model="addAccountForm.type"
                class="select select-bordered w-full"
                required
              >
                <option value="ASSETS">{{ t('words.assets') }}</option>
                <option value="LIABILITIES">{{ t('words.liabilities') }}</option>
                <option value="EQUITY">{{ t('words.equity') }}</option>
                <option value="INCOME">{{ t('words.income') }}</option>
                <option value="EXPENSE">{{ t('words.expenses') }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary mb-1">
                {{ t('views.accounts.addAccountForm.category.label') }}
              </label>
              <select
                v-model="addAccountForm.categoryId"
                class="select select-bordered w-full"
              >
                <option value="">—</option>
                <option
                  v-for="cat in categories"
                  :key="cat.id"
                  :value="cat.id"
                >
                  {{ cat.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary mb-1">
                {{ t('views.accounts.addAccountForm.currency.label') }}
              </label>
              <select
                v-model="addAccountForm.currency"
                class="select select-bordered w-full"
              >
                <option value="CHF">{{ t('words.currencies.CHF') }}</option>
                <option value="EUR">{{ t('words.currencies.EUR') }}</option>
                <option value="USD">{{ t('words.currencies.USD') }}</option>
                <option value="GBP">{{ t('words.currencies.GBP') }}</option>
                <option value="KRW">{{ t('words.currencies.KRW') }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary mb-1">
                {{ t('views.accounts.addAccountForm.openingBalance.label') }}
              </label>
              <input
                v-model.number="addAccountForm.openingBalance"
                type="number"
                step="0.01"
                class="input input-bordered w-full"
                placeholder="0.00"
              />
            </div>
          </form>
        </div>

        <div class="modal-footer">
          <BaseButton
            variant="ghost"
            @click="closeAddAccountModal"
          >
            {{ t('words.cancel') }}
          </BaseButton>
          <BaseButton
            variant="primary"
            :disabled="submittingAccount"
            @click="submitAddAccount"
          >
            {{ t('views.accounts.addAccountForm.submit.label') }}
          </BaseButton>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import {
  RiAddLine,
  RiCheckLine,
  RiCloseLine,
  RiPencilLine,
  RiPriceTag3Line,
  RiToggleFill,
  RiToggleLine,
  RiWallet3Line,
} from '@remixicon/vue';
import PageHeader from '../components/PageHeader.vue';
import BaseButton from '../components/BaseButton.vue';
import { type AccountSimple, useAccounts } from '../composables/useAccounts';
import { type Category, useCategories } from '../composables/useCategories/useCategories';
import { useLanguage } from '../composables/useLanguage';
import { useToast } from '../composables/useToast';

const { t } = useLanguage();
const { success, error } = useToast();
const { fetchSimple, updateAccount, createAccount } = useAccounts();
const { categories, loading: categoriesLoading, createCategory, updateCategory } = useCategories();

// ── Categories state ──
const addingCategory = ref(false);
const newCategoryName = ref('');
const newCategoryInput = ref<HTMLInputElement>();
const editingCategoryId = ref<string | null>(null);
const editingCategoryName = ref('');

const openAddCategory = async () => {
  addingCategory.value = true;
  await nextTick();
  newCategoryInput.value?.focus();
};

const cancelAddCategory = () => {
  addingCategory.value = false;
  newCategoryName.value = '';
};

const saveNewCategory = async () => {
  const name = newCategoryName.value.trim();
  if (!name) return;
  try {
    await createCategory(name);
    success(t('views.manage.categories.createSuccess'));
    cancelAddCategory();
  } catch {
    error(t('views.manage.categories.createError'));
  }
};

const startEditCategory = (cat: Category) => {
  editingCategoryId.value = cat.id;
  editingCategoryName.value = cat.name;
};

const cancelEditCategory = () => {
  editingCategoryId.value = null;
  editingCategoryName.value = '';
};

const saveEditCategory = async (id: string) => {
  const name = editingCategoryName.value.trim();
  if (!name) return;
  try {
    await updateCategory(id, name);
    success(t('views.manage.categories.updateSuccess'));
    cancelEditCategory();
  } catch {
    error(t('views.manage.categories.updateError'));
  }
};

// ── Accounts state ──
const allAccounts = ref<AccountSimple[]>([]);
const accountsLoading = ref(true);
const showInactive = ref(false);
const activeTypeTab = ref('ALL');
const editingAccountId = ref<string | null>(null);
const editAccountForm = ref({ name: '', categoryId: '' });
const savingAccount = ref(false);

const accountTypeTabs = computed(() => [
  { value: 'ALL', label: t('views.manage.accounts.all') },
  { value: 'ASSETS', label: t('words.assets') },
  { value: 'LIABILITIES', label: t('words.liabilities') },
  { value: 'EQUITY', label: t('words.equity') },
  { value: 'INCOME', label: t('words.income') },
  { value: 'EXPENSE', label: t('words.expenses') },
]);

const accountCountByType = (type: string) => {
  if (type === 'ALL') return allAccounts.value.filter((a) => showInactive.value || a.isActive).length;
  return allAccounts.value.filter(
    (a) => a.type === type && (showInactive.value || a.isActive),
  ).length;
};

const filteredAccounts = computed(() => {
  return allAccounts.value.filter((a) => {
    if (!showInactive.value && !a.isActive) return false;
    if (activeTypeTab.value !== 'ALL' && a.type !== activeTypeTab.value) return false;
    return true;
  });
});

const loadAccounts = async () => {
  accountsLoading.value = true;
  try {
    allAccounts.value = await fetchSimple();
  } finally {
    accountsLoading.value = false;
  }
};

onMounted(loadAccounts);

const startEditAccount = (account: AccountSimple) => {
  editingAccountId.value = account.id;
  editAccountForm.value = {
    name: account.name,
    categoryId: account.categoryId ?? '',
  };
};

const cancelEditAccount = () => {
  editingAccountId.value = null;
};

const saveEditAccount = async (id: string) => {
  savingAccount.value = true;
  try {
    const updated = await updateAccount(id, {
      name: editAccountForm.value.name,
      categoryId: editAccountForm.value.categoryId || null,
    });
    const idx = allAccounts.value.findIndex((a) => a.id === id);
    if (idx !== -1) {
      allAccounts.value[idx] = {
        ...allAccounts.value[idx],
        name: updated.name ?? allAccounts.value[idx].name,
        categoryId: updated.category?.id ?? null,
        categoryName: updated.category?.name ?? null,
      };
    }
    cancelEditAccount();
    success(t('views.manage.accounts.updateSuccess'));
  } catch {
    error(t('views.manage.accounts.updateError'));
  } finally {
    savingAccount.value = false;
  }
};

const toggleActive = async (account: AccountSimple) => {
  try {
    await updateAccount(account.id, { isActive: !account.isActive });
    const idx = allAccounts.value.findIndex((a) => a.id === account.id);
    if (idx !== -1) allAccounts.value[idx].isActive = !account.isActive;
    success(
      account.isActive
        ? t('views.manage.accounts.deactivateSuccess')
        : t('views.manage.accounts.activateSuccess'),
    );
  } catch {
    error(t('views.manage.accounts.updateError'));
  }
};

// ── Add Account modal ──
const addAccountModal = ref<HTMLDialogElement>();
const submittingAccount = ref(false);
const addAccountForm = ref({
  name: '',
  type: 'EXPENSE',
  currency: 'CHF',
  categoryId: '',
  openingBalance: 0,
});

const openAddAccountModal = () => {
  addAccountForm.value = { name: '', type: activeTypeTab.value === 'ALL' ? 'EXPENSE' : activeTypeTab.value, currency: 'CHF', categoryId: '', openingBalance: 0 };
  addAccountModal.value?.showModal();
};

const closeAddAccountModal = () => addAccountModal.value?.close();

const submitAddAccount = async () => {
  if (!addAccountForm.value.name) return;
  submittingAccount.value = true;
  try {
    await createAccount({
      name: addAccountForm.value.name,
      type: addAccountForm.value.type,
      currency: addAccountForm.value.currency,
      categoryId: addAccountForm.value.categoryId || undefined,
      openingBalance: addAccountForm.value.openingBalance,
    });
    closeAddAccountModal();
    await loadAccounts();
    success(t('views.accounts.addAccountForm.success'));
  } catch {
    error(t('views.accounts.addAccountForm.error'));
  } finally {
    submittingAccount.value = false;
  }
};
</script>
