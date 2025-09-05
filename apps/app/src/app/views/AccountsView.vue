<template>
  <div class="min-h-screen bg-primary">
    <!-- Header Section -->
    <PageHeader
      :title="t('views.accounts.title')"
      :subtitle="t('views.accounts.subtitle')"
    />

    <div
      class="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-none xl:max-w-screen-2xl"
    >
      <div v-if="accounts">
        <!-- Time Filter Section -->
        <div class="mb-6">
          <div class="flex items-center gap-2">
            <BaseButton
              :variant="timeFilter === 'all' ? 'primary' : 'ghost'"
              size="sm"
              @click="timeFilter = 'all'"
            >
              All
            </BaseButton>
            <BaseButton
              :variant="timeFilter === '2024' ? 'primary' : 'ghost'"
              size="sm"
              @click="timeFilter = '2024'"
            >
              2024
            </BaseButton>
            <BaseButton
              :variant="timeFilter === '2025' ? 'primary' : 'ghost'"
              size="sm"
              @click="timeFilter = '2025'"
            >
              2025
            </BaseButton>
          </div>
        </div>
        <!-- Overview Cards -->
        <div
          class="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8"
        >
          <!-- Assets Card -->
          <div class="card hover:card-elevated transition-shadow">
            <div class="p-1.5 sm:p-2">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-semibold text-success">
                  {{ t('words.assets') }}
                </h3>
                <div
                  class="bg-success text-white text-xs px-2 py-1 rounded-full"
                >
                  {{ accounts.assets.accounts.length }}
                </div>
              </div>
              <p class="text-2xl font-bold text-success">
                {{ formatCurrency(accounts.assets.total, 'CHF') }}
              </p>
            </div>
          </div>

          <!-- Income Card -->
          <div class="card hover:card-elevated transition-shadow">
            <div class="p-1.5 sm:p-2">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-semibold text-info">
                  {{ t('words.income') }}
                </h3>
                <div class="bg-info text-white text-xs px-2 py-1 rounded-full">
                  {{ accounts.income.accounts.length }}
                </div>
              </div>
              <p class="text-2xl font-bold text-info">
                {{ formatCurrency(Math.abs(accounts.income.total), 'CHF') }}
              </p>
            </div>
          </div>

          <!-- Liabilities Card -->
          <div class="card hover:card-elevated transition-shadow">
            <div class="p-1.5 sm:p-2">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-semibold text-warning">
                  {{ t('words.liabilities') }}
                </h3>
                <div
                  class="bg-warning text-white text-xs px-2 py-1 rounded-full"
                >
                  {{ accounts.liabilities.accounts.length }}
                </div>
              </div>
              <p class="text-2xl font-bold text-warning">
                {{
                  formatCurrency(Math.abs(accounts.liabilities.total), 'CHF')
                }}
              </p>
            </div>
          </div>

          <!-- Expenses Card -->
          <div class="card hover:card-elevated transition-shadow">
            <div class="p-1.5 sm:p-2">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-semibold text-error">
                  {{ t('words.expenses') }}
                </h3>
                <div class="bg-error text-white text-xs px-2 py-1 rounded-full">
                  {{ accounts.expense.accounts.length }}
                </div>
              </div>
              <p class="text-2xl font-bold text-error">
                {{ formatCurrency(Math.abs(accounts.expense.total), 'CHF') }}
              </p>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 mb-8">
          <BaseButton
            variant="primary"
            class="flex-1 sm:flex-none"
            @click="openAddAccountModal()"
          >
            <RiAddLine class="w-5 h-5 mr-2" />
            {{ t('views.accounts.addAccount') }}
          </BaseButton>
          <BaseButton
            variant="secondary"
            class="flex-1 sm:flex-none"
            @click="openTransactionModal()"
          >
            <RiExchangeFundsLine class="w-5 h-5 mr-2" />
            {{ t('views.accounts.addTransaction') }}
          </BaseButton>
        </div>

        <!-- Balance Sheet Style Account Lists -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Assets & Liabilities (Left Column) -->
          <div class="space-y-8">
            <!-- Assets -->
            <div class="card shadow-xl">
              <div class="p-1.5 sm:p-2">
                <div class="flex items-center justify-between mb-6">
                  <h2 class="text-xl font-bold text-success flex items-center">
                    <RiCheckLine class="w-6 h-6 mr-2" />
                    {{ t('words.assets') }}
                  </h2>
                  <BaseButton
                    variant="success"
                    size="sm"
                    @click="openAddAccountModal('ASSETS')"
                  >
                    <RiAddLine class="w-4 h-4 mr-1" />
                    {{ t('views.accounts.addAccount') }}
                  </BaseButton>
                </div>

                <div
                  v-if="accounts?.assets?.accounts?.length"
                  class="space-y-2"
                >
                  <div
                    v-for="account in accounts.assets.accounts"
                    :key="account.id"
                    class="flex items-center justify-between p-3 bg-primary rounded-lg hover:bg-tertiary transition-colors cursor-pointer border-l-4 border-success"
                    @click="
                      $router.push({
                        name: 'Account',
                        params: { id: account.id },
                      })
                    "
                  >
                    <div class="flex items-center flex-1 min-w-0">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center">
                          <h4 class="font-semibold text-sm truncate mr-2">
                            {{ account.name }}
                          </h4>
                          <div
                            v-if="account.retirementAccount"
                            class="bg-info text-white text-xs px-1.5 py-0.5 rounded-full"
                          >
                            {{ t('views.accounts.retirement') }}
                          </div>
                        </div>
                        <p class="text-xs text-muted">
                          {{ account.currency || 'CHF' }}
                        </p>
                      </div>
                    </div>
                    <div class="text-right ml-4">
                      <span
                        class="font-bold text-sm"
                        :class="
                          account.balance >= 0
                            ? 'amount-positive'
                            : 'amount-negative'
                        "
                      >
                        {{ formatCurrency(account.balance, account.currency) }}
                      </span>
                    </div>
                  </div>

                  <!-- Assets Total -->
                  <div class="border-t-2 border-success pt-3 mt-4">
                    <div
                      class="flex justify-between items-center font-bold text-success"
                    >
                      <span
                        >{{ t('views.accounts.total') }}
                        {{ t('words.assets') }}</span
                      >
                      <span class="text-lg">{{
                        formatCurrency(accounts.assets.total, 'CHF')
                      }}</span>
                    </div>
                  </div>
                </div>

                <div
                  v-else
                  class="text-center py-8"
                >
                  <RiCheckLine class="w-12 h-12 mx-auto text-muted mb-4" />
                  <p class="text-muted mb-4">
                    {{ t('views.accounts.noAssets') }}
                  </p>
                  <BaseButton
                    variant="success"
                    size="sm"
                    @click="openAddAccountModal('ASSETS')"
                  >
                    {{ t('views.accounts.addFirstAccount') }}
                  </BaseButton>
                </div>
              </div>
            </div>

            <!-- Liabilities -->
            <div class="card shadow-xl">
              <div class="p-1.5 sm:p-2">
                <div class="flex items-center justify-between mb-6">
                  <h2 class="text-xl font-bold text-warning flex items-center">
                    <RiErrorWarningLine class="w-6 h-6 mr-2" />
                    {{ t('words.liabilities') }}
                  </h2>
                  <BaseButton
                    variant="warning"
                    size="sm"
                    @click="openAddAccountModal('LIABILITIES')"
                  >
                    <RiAddLine class="w-4 h-4 mr-1" />
                    {{ t('views.accounts.addAccount') }}
                  </BaseButton>
                </div>

                <div
                  v-if="accounts?.liabilities?.accounts?.length"
                  class="space-y-2"
                >
                  <div
                    v-for="account in accounts.liabilities.accounts"
                    :key="account.id"
                    class="flex items-center justify-between p-3 bg-primary rounded-lg hover:bg-tertiary transition-colors cursor-pointer border-l-4 border-warning"
                    @click="
                      $router.push({
                        name: 'Account',
                        params: { id: account.id },
                      })
                    "
                  >
                    <div class="flex items-center flex-1 min-w-0">
                      <div class="flex-1 min-w-0">
                        <h4 class="font-semibold text-sm truncate">
                          {{ account.name }}
                        </h4>
                        <p class="text-xs text-muted">
                          {{ account.currency || 'CHF' }}
                        </p>
                      </div>
                    </div>
                    <div class="text-right ml-4">
                      <span class="font-bold text-sm text-warning">
                        {{
                          formatCurrency(
                            Math.abs(account.balance),
                            account.currency,
                          )
                        }}
                      </span>
                    </div>
                  </div>

                  <!-- Liabilities Total -->
                  <div class="border-t-2 border-warning pt-3 mt-4">
                    <div
                      class="flex justify-between items-center font-bold text-warning"
                    >
                      <span
                        >{{ t('views.accounts.total') }}
                        {{ t('words.liabilities') }}</span
                      >
                      <span class="text-lg">{{
                        formatCurrency(
                          Math.abs(accounts.liabilities.total),
                          'CHF',
                        )
                      }}</span>
                    </div>
                  </div>
                </div>

                <div
                  v-else
                  class="text-center py-8"
                >
                  <RiErrorWarningLine
                    class="w-12 h-12 mx-auto text-muted mb-4"
                  />
                  <p class="text-muted mb-4">
                    {{ t('views.accounts.noLiabilities') }}
                  </p>
                  <BaseButton
                    variant="warning"
                    size="sm"
                    @click="openAddAccountModal('LIABILITIES')"
                  >
                    {{ t('views.accounts.addFirstAccount') }}
                  </BaseButton>
                </div>
              </div>
            </div>
          </div>

          <!-- Income & Expenses (Right Column) -->
          <div class="space-y-8">
            <!-- Income -->
            <div class="card shadow-xl">
              <div class="p-1.5 sm:p-2">
                <div class="flex items-center justify-between mb-6">
                  <h2 class="text-xl font-bold text-info flex items-center">
                    <RiArrowUpLine class="w-6 h-6 mr-2" />
                    {{ t('words.income') }}
                  </h2>
                  <BaseButton
                    variant="info"
                    size="sm"
                    @click="openAddAccountModal('INCOME')"
                  >
                    <RiAddLine class="w-4 h-4 mr-1" />
                    {{ t('views.accounts.addAccount') }}
                  </BaseButton>
                </div>

                <div
                  v-if="accounts?.income?.accounts?.length"
                  class="space-y-2"
                >
                  <div
                    v-for="account in accounts.income.accounts"
                    :key="account.id"
                    class="flex items-center justify-between p-3 bg-primary rounded-lg hover:bg-tertiary transition-colors cursor-pointer border-l-4 border-info"
                    @click="
                      $router.push({
                        name: 'Account',
                        params: { id: account.id },
                      })
                    "
                  >
                    <div class="flex items-center flex-1 min-w-0">
                      <div class="flex-1 min-w-0">
                        <h4 class="font-semibold text-sm truncate">
                          {{ account.name }}
                        </h4>
                        <p class="text-xs text-muted">
                          {{ account.currency || 'CHF' }}
                        </p>
                      </div>
                    </div>
                    <div class="text-right ml-4">
                      <span class="font-bold text-sm text-info">
                        {{
                          formatCurrency(
                            Math.abs(account.balance),
                            account.currency,
                          )
                        }}
                      </span>
                    </div>
                  </div>

                  <!-- Income Total -->
                  <div class="border-t-2 border-info pt-3 mt-4">
                    <div
                      class="flex justify-between items-center font-bold text-info"
                    >
                      <span
                        >{{ t('views.accounts.total') }}
                        {{ t('words.income') }}</span
                      >
                      <span class="text-lg">{{
                        formatCurrency(Math.abs(accounts.income.total), 'CHF')
                      }}</span>
                    </div>
                  </div>
                </div>

                <div
                  v-else
                  class="text-center py-8"
                >
                  <RiArrowUpLine class="w-12 h-12 mx-auto text-muted mb-4" />
                  <p class="text-muted mb-4">
                    {{ t('views.accounts.noIncome') }}
                  </p>
                  <BaseButton
                    variant="info"
                    size="sm"
                    @click="openAddAccountModal('INCOME')"
                  >
                    {{ t('views.accounts.addFirstAccount') }}
                  </BaseButton>
                </div>
              </div>
            </div>

            <!-- Expenses -->
            <div class="card shadow-xl">
              <div class="p-1.5 sm:p-2">
                <div class="flex items-center justify-between mb-6">
                  <h2 class="text-xl font-bold text-error flex items-center">
                    <RiArrowDownLine class="w-6 h-6 mr-2" />
                    {{ t('words.expenses') }}
                  </h2>
                  <BaseButton
                    variant="danger"
                    size="sm"
                    @click="openAddAccountModal('EXPENSE')"
                  >
                    <RiAddLine class="w-4 h-4 mr-1" />
                    {{ t('views.accounts.addAccount') }}
                  </BaseButton>
                </div>

                <div
                  v-if="accounts?.expense?.accounts?.length"
                  class="space-y-2"
                >
                  <div
                    v-for="account in accounts.expense.accounts"
                    :key="account.id"
                    class="flex items-center justify-between p-3 bg-primary rounded-lg hover:bg-tertiary transition-colors cursor-pointer border-l-4 border-error"
                    @click="
                      $router.push({
                        name: 'Account',
                        params: { id: account.id },
                      })
                    "
                  >
                    <div class="flex items-center flex-1 min-w-0">
                      <div class="flex-1 min-w-0">
                        <h4 class="font-semibold text-sm truncate">
                          {{ account.name }}
                        </h4>
                        <p class="text-xs text-muted">
                          {{ account.currency || 'CHF' }}
                        </p>
                      </div>
                    </div>
                    <div class="text-right ml-4">
                      <span class="font-bold text-sm text-error">
                        {{
                          formatCurrency(
                            Math.abs(account.balance),
                            account.currency,
                          )
                        }}
                      </span>
                    </div>
                  </div>

                  <!-- Expenses Total -->
                  <div class="border-t-2 border-error pt-3 mt-4">
                    <div
                      class="flex justify-between items-center font-bold text-error"
                    >
                      <span
                        >{{ t('views.accounts.total') }}
                        {{ t('words.expenses') }}</span
                      >
                      <span class="text-lg">{{
                        formatCurrency(Math.abs(accounts.expense.total), 'CHF')
                      }}</span>
                    </div>
                  </div>
                </div>

                <div
                  v-else
                  class="text-center py-8"
                >
                  <RiArrowDownLine class="w-12 h-12 mx-auto text-muted mb-4" />
                  <p class="text-muted mb-4">
                    {{ t('views.accounts.noExpenses') }}
                  </p>
                  <BaseButton
                    variant="danger"
                    size="sm"
                    @click="openAddAccountModal('EXPENSE')"
                  >
                    {{ t('views.accounts.addFirstAccount') }}
                  </BaseButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Loading State -->
      <div
        v-else
        class="space-y-8"
      >
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          <div
            v-for="i in 4"
            :key="i"
            class="card shadow-lg"
          >
            <div class="p-1.5 sm:p-2 space-y-4">
              <div class="skeleton h-4 w-3/4"></div>
              <div class="skeleton h-8 w-full"></div>
            </div>
          </div>
        </div>
        <div class="card shadow-xl">
          <div class="p-1.5 sm:p-2 space-y-4">
            <div class="skeleton h-8 w-1/2"></div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="i in 6"
                :key="i"
                class="skeleton h-24 w-full"
              ></div>
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
        class="modal-box bg-elevated p-6 rounded-lg w-11/12 max-w-2xl"
        @click.stop
      >
        <div class="flex justify-between items-center mb-6">
          <h3 class="font-bold text-lg text-white">
            <RiAddLine class="w-6 h-6 inline mr-2" />
            {{ t('views.accounts.addAccountForm.title') }}
          </h3>
          <BaseButton
            variant="ghost"
            size="sm"
            class="h-8 w-8 p-0 rounded-full"
            @click="closeAddAccountModal"
          >
            ✕
          </BaseButton>
        </div>

        <form
          class="space-y-4"
          @submit.prevent="addAccount"
        >
          <div class="mb-4">
            <BaseInput
              v-model="name"
              type="text"
              :label="t('views.accounts.addAccountForm.accountName.label')"
              :placeholder="
                t('views.accounts.addAccountForm.accountName.placeholder')
              "
              required
            >
              <template #leftIcon>
                <RiAccountCircleLine class="w-5 h-5" />
              </template>
            </BaseInput>
          </div>

          <div class="mb-4">
            <label class="label">
              <span class="label font-semibold">{{
                t('views.accounts.addAccountForm.accountType.label')
              }}</span>
            </label>
            <select
              v-model="accountType"
              class="select w-full"
              required
            >
              <option value="ASSETS">{{ t('words.assets') }}</option>
              <option value="LIABILITIES">{{ t('words.liabilities') }}</option>
              <option value="INCOME">{{ t('words.income') }}</option>
              <option value="EXPENSE">{{ t('words.expenses') }}</option>
            </select>
          </div>

          <div class="mb-4">
            <BaseInput
              v-model="openingBalance"
              type="number"
              step="0.01"
              :label="t('views.accounts.addAccountForm.openingBalance.label')"
              placeholder="0.00"
            >
              <template #leftIcon>
                <RiMoneyDollarCircleLine class="w-5 h-5" />
              </template>
            </BaseInput>
          </div>

          <div class="flex justify-end gap-2 mt-6">
            <BaseButton
              variant="ghost"
              @click="closeAddAccountModal"
            >
              {{ t('words.cancel') }}
            </BaseButton>
            <BaseButton
              variant="primary"
              type="submit"
            >
              {{ t('views.accounts.addAccountForm.submit.label') }}
            </BaseButton>
          </div>
        </form>
      </div>
    </dialog>

    <!-- Create Transaction Modal -->
    <dialog
      ref="transactionModal"
      class="modal"
      @click="closeTransactionModal"
    >
      <div
        class="modal-box bg-elevated p-6 rounded-lg w-11/12 max-w-3xl"
        @click.stop
      >
        <div class="flex justify-between items-center mb-6">
          <h3 class="font-bold text-lg text-white">
            <RiExchangeFundsLine class="w-6 h-6 inline mr-2" />
            {{ t('views.accounts.createTransactionForm.title') }}
          </h3>
          <BaseButton
            variant="ghost"
            size="sm"
            class="h-8 w-8 p-0 rounded-full"
            @click="closeTransactionModal"
          >
            ✕
          </BaseButton>
        </div>

        <form
          class="space-y-4"
          @submit.prevent="createTransaction"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="mb-4">
              <BaseInput
                v-model="transactionDate"
                type="date"
                :label="t('views.accounts.createTransactionForm.date.label')"
                required
              >
                <template #leftIcon>
                  <RiCalendarLine class="w-5 h-5" />
                </template>
              </BaseInput>
            </div>

            <div class="mb-4">
              <BaseInput
                v-model="transactionAmount"
                type="number"
                step="0.01"
                :label="t('views.accounts.createTransactionForm.amount.label')"
                placeholder="0.00"
                required
              >
                <template #leftIcon>
                  <RiMoneyDollarCircleLine class="w-5 h-5" />
                </template>
              </BaseInput>
            </div>
          </div>

          <div class="mb-4">
            <BaseInput
              v-model="transactionDescription"
              type="text"
              :label="
                t('views.accounts.createTransactionForm.description.label')
              "
              :placeholder="
                t(
                  'views.accounts.createTransactionForm.description.placeholder',
                )
              "
              required
            >
              <template #leftIcon>
                <RiFileTextLine class="w-5 h-5" />
              </template>
            </BaseInput>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="mb-4">
              <label class="label">
                <span class="label font-semibold">{{
                  t('views.accounts.createTransactionForm.creditAccount.label')
                }}</span>
              </label>
              <select
                v-model="creditAccountId"
                class="select w-full"
                required
              >
                <option
                  value=""
                  disabled
                >
                  {{
                    t(
                      'views.accounts.createTransactionForm.creditAccount.placeholder',
                    )
                  }}
                </option>
                <option
                  v-for="account in allAccounts"
                  :key="account.id"
                  :value="account.id"
                >
                  {{ account.name }} ({{ account.currency || 'CHF' }})
                </option>
              </select>
            </div>

            <div class="mb-4">
              <label class="label">
                <span class="label font-semibold">{{
                  t('views.accounts.createTransactionForm.debitAccount.label')
                }}</span>
              </label>
              <select
                v-model="debitAccountId"
                class="select w-full"
                required
              >
                <option
                  value=""
                  disabled
                >
                  {{
                    t(
                      'views.accounts.createTransactionForm.debitAccount.placeholder',
                    )
                  }}
                </option>
                <option
                  v-for="account in allAccounts"
                  :key="account.id"
                  :value="account.id"
                >
                  {{ account.name }} ({{ account.currency || 'CHF' }})
                </option>
              </select>
            </div>
          </div>

          <div class="flex justify-end gap-2 mt-6">
            <BaseButton
              variant="ghost"
              @click="closeTransactionModal"
            >
              {{ t('words.cancel') }}
            </BaseButton>
            <BaseButton
              variant="primary"
              type="submit"
            >
              {{ t('views.accounts.createTransactionForm.submit.label') }}
            </BaseButton>
          </div>
        </form>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { computed, ref } from 'vue';
import {
  RiStarFill,
  RiArrowUpLine,
  RiArrowDownLine,
  RiAddLine,
  RiCheckLine,
  RiPencilLine,
  RiDeleteBinLine,
  RiCloseLine,
  RiMoneyDollarCircleLine,
  RiWalletLine,
  RiExchangeFundsLine,
  RiErrorWarningLine,
  RiLineChartLine,
  RiAccountCircleLine,
  RiCalendarLine,
  RiFileTextLine,
} from '@remixicon/vue';
import PageHeader from '../components/PageHeader.vue';
import BaseButton from '../components/BaseButton.vue';
import BaseInput from '../components/BaseInput.vue';
import { useAccounts } from '../composables/useAccounts';
import { useAuth } from '../composables/useAuth';
import { useConstant } from '../composables/useConstant';
import { useCurrency } from '../composables/useCurrency';
import { useLanguage } from '../composables/useLanguage';
import { useToast } from '../composables/useToast';

const { t } = useLanguage();
const { URI } = useConstant();
const { formatCurrency } = useCurrency();
const { getAccessToken } = useAuth();
const queryClient = useQueryClient();
const { success, error } = useToast();
const timeFilter = ref('2025');
const { accounts, createAccount, refetchAccounts } = useAccounts(timeFilter);

// UI State
const addAccountModal = ref<HTMLDialogElement>();
const transactionModal = ref<HTMLDialogElement>();

// Form Data
const name = ref('');
const openingBalance = ref(0);
const accountType = ref('ASSETS');

const transactionDescription = ref('');
const creditAccountId = ref('');
const debitAccountId = ref('');
const transactionDate = ref(
  new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString().split('T')[0],
);
const transactionAmount = ref(0);

// Computed Properties
const allAccounts = computed(() => [
  ...(accounts?.value?.assets?.accounts || []),
  ...(accounts?.value?.liabilities?.accounts || []),
  ...(accounts?.value?.income?.accounts || []),
  ...(accounts?.value?.expense?.accounts || []),
]);

// Modal Functions
const openAddAccountModal = (type?: string) => {
  if (type) {
    accountType.value = type;
  }
  addAccountModal.value?.showModal();
};

const closeAddAccountModal = () => {
  addAccountModal.value?.close();
  // Reset form
  name.value = '';
  openingBalance.value = 0;
  accountType.value = 'ASSETS';
};

const openTransactionModal = () => {
  transactionModal.value?.showModal();
};

const closeTransactionModal = () => {
  transactionModal.value?.close();
  // Reset form
  transactionDescription.value = '';
  creditAccountId.value = '';
  debitAccountId.value = '';
  transactionDate.value = new Date(new Date().setUTCHours(0, 0, 0, 0))
    .toISOString()
    .split('T')[0];
  transactionAmount.value = 0;
};

// Account Management
const addAccount = async () => {
  try {
    await createAccount({
      name: name.value,
      openingBalance: openingBalance.value,
      type: accountType.value,
    });
    closeAddAccountModal();
    success(
      t('views.accounts.addAccountForm.success') ||
        'Account created successfully!',
    );
  } catch (err) {
    console.error('Failed to create account:', err);
    error(
      t('views.accounts.addAccountForm.error') ||
        'Failed to create account. Please try again.',
    );
  }
};

// Transaction Management
const createTransaction = async () => {
  try {
    await createTransactionMutation({
      creditAmount: transactionAmount.value,
      debitAmount: transactionAmount.value,
      description: transactionDescription.value,
      creditAccountId: creditAccountId.value,
      debitAccountId: debitAccountId.value,
      transactionDate: transactionDate.value,
    });
    closeTransactionModal();

    // Show success feedback to user
    success(
      t('views.accounts.createTransactionForm.success') ||
        'Transaction created successfully!',
    );
  } catch (err) {
    console.error('Failed to create transaction:', err);
    error(
      t('views.accounts.createTransactionForm.error') ||
        'Failed to create transaction. Please try again.',
    );
  }
};

const { mutateAsync: createTransactionMutation } = useMutation({
  mutationFn: async (data: {
    creditAmount: number;
    debitAmount: number;
    description: string;
    creditAccountId: string;
    debitAccountId: string;
    transactionDate: string;
  }) => {
    const response = await fetch(`${URI.API}/v1/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify({
        creditAmount: data.creditAmount,
        debitAmount: data.debitAmount,
        description: data.description,
        creditAccountId: data.creditAccountId,
        debitAccountId: data.debitAccountId,
        transactionDate: data.transactionDate,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
  onSuccess: () => {
    // Invalidate all related queries to update UI
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['accounts'] });

    // Also refetch the accounts data from the composable
    refetchAccounts();
  },
  onError: (error) => {
    console.error('Transaction creation failed:', error);
  },
});
</script>
