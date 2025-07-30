<template>
  <div class="min-h-screen bg-base-100">
    <!-- Header Section -->
    <div
      class="bg-gradient-to-r from-secondary to-accent text-secondary-content"
    >
      <div class="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div
          class="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div class="min-w-0 flex-1">
            <h1 class="text-2xl sm:text-3xl font-bold mb-2 truncate">
              {{ t('views.accounts.title') }}
            </h1>
            <p class="text-secondary-content/80 text-sm sm:text-base truncate">
              {{ t('views.accounts.subtitle') }}
            </p>
          </div>
          <div class="flex items-center gap-4 flex-shrink-0">
            <!-- Time Filter -->
            <div class="join">
              <input
                class="join-item btn btn-sm"
                type="radio"
                name="timeFilter"
                aria-label="All"
                :checked="timeFilter === 'all'"
                @click="timeFilter = 'all'"
              />
              <input
                class="join-item btn btn-sm"
                type="radio"
                name="timeFilter"
                aria-label="2024"
                :checked="timeFilter === '2024'"
                @click="timeFilter = '2024'"
              />
              <input
                class="join-item btn btn-sm"
                type="radio"
                name="timeFilter"
                aria-label="2025"
                :checked="timeFilter === '2025'"
                @click="timeFilter = '2025'"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
      <div v-if="accounts">
        <!-- Overview Cards -->
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8"
        >
          <!-- Net Worth Card -->
          <div
            class="card bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-lg"
          >
            <div class="card-body p-4 sm:p-6">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-semibold text-primary">
                  {{ t('views.dashboard.netWorth') }}
                </h3>
                <svg
                  class="w-5 h-5 text-primary"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"
                  />
                </svg>
              </div>
              <p
                class="text-2xl font-bold"
                :class="netWorth >= 0 ? 'text-success' : 'text-error'"
              >
                {{ formatCurrency(netWorth, 'CHF') }}
              </p>
            </div>
          </div>

          <!-- Assets Card -->
          <div
            class="card bg-gradient-to-br from-success/10 to-success/5 border border-success/20 shadow-lg"
          >
            <div class="card-body p-4 sm:p-6">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-semibold text-success">
                  {{ t('words.assets') }}
                </h3>
                <div class="badge badge-success badge-sm">
                  {{ accounts.assets.accounts.length }}
                </div>
              </div>
              <p class="text-2xl font-bold text-success">
                {{ formatCurrency(accounts.assets.total, 'CHF') }}
              </p>
            </div>
          </div>

          <!-- Liabilities Card -->
          <div
            class="card bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20 shadow-lg"
          >
            <div class="card-body p-4 sm:p-6">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-semibold text-warning">
                  {{ t('words.liabilities') }}
                </h3>
                <div class="badge badge-warning badge-sm">
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

          <!-- Monthly Flow Card -->
          <div
            class="card bg-gradient-to-br from-info/10 to-info/5 border border-info/20 shadow-lg"
          >
            <div class="card-body p-4 sm:p-6">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-semibold text-info">
                  {{ t('views.dashboard.monthlyFlow') }}
                </h3>
                <svg
                  class="w-5 h-5 text-info"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z"
                  />
                </svg>
              </div>
              <p
                class="text-2xl font-bold"
                :class="monthlyFlow >= 0 ? 'text-success' : 'text-error'"
              >
                {{ formatCurrency(monthlyFlow, 'CHF') }}
              </p>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 mb-8">
          <button
            class="btn btn-primary flex-1 sm:flex-none"
            @click="openAddAccountModal()"
          >
            <svg
              class="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
            </svg>
            {{ t('views.accounts.addAccount') }}
          </button>
          <button
            class="btn btn-secondary flex-1 sm:flex-none"
            @click="openTransactionModal()"
          >
            <svg
              class="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12,20C16.4,20 20,16.4 20,12C20,7.6 16.4,4 12,4C7.6,4 4,7.6 4,12C4,16.4 7.6,20 12,20M12,2C17.5,2 22,6.5 22,12C22,17.5 17.5,22 12,22C6.5,22 2,17.5 2,12C2,6.5 6.5,2 12,2M13,7H11V11H7V13H11V17H13V13H17V11H13V7Z"
              />
            </svg>
            {{ t('views.accounts.addTransaction') }}
          </button>
        </div>

        <!-- Balance Sheet Style Account Lists -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Assets & Liabilities (Left Column) -->
          <div class="space-y-8">
            <!-- Assets -->
            <div class="card bg-base-200 shadow-xl">
              <div class="card-body p-6">
                <div class="flex items-center justify-between mb-6">
                  <h2 class="text-xl font-bold text-success flex items-center">
                    <svg
                      class="w-6 h-6 mr-2"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"
                      />
                    </svg>
                    {{ t('words.assets') }}
                  </h2>
                  <button
                    class="btn btn-success btn-sm"
                    @click="openAddAccountModal('ASSETS')"
                  >
                    <svg
                      class="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                    </svg>
                    {{ t('views.accounts.addAccount') }}
                  </button>
                </div>

                <div
                  v-if="accounts?.assets?.accounts?.length"
                  class="space-y-2"
                >
                  <div
                    v-for="account in accounts.assets.accounts"
                    :key="account.id"
                    class="flex items-center justify-between p-3 bg-base-100 rounded-lg hover:bg-base-300 transition-colors cursor-pointer border-l-4 border-success"
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
                            class="badge badge-info badge-xs"
                          >
                            {{ t('views.accounts.retirement') }}
                          </div>
                        </div>
                        <p class="text-xs text-base-content/60">
                          {{ account.currency || 'CHF' }}
                        </p>
                      </div>
                    </div>
                    <div class="text-right ml-4">
                      <span
                        class="font-bold text-sm"
                        :class="
                          account.balance >= 0 ? 'text-success' : 'text-error'
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
                  <svg
                    class="w-12 h-12 mx-auto text-base-content/20 mb-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"
                    />
                  </svg>
                  <p class="text-base-content/60 mb-4">
                    {{ t('views.accounts.noAssets') }}
                  </p>
                  <button
                    class="btn btn-success btn-sm"
                    @click="openAddAccountModal('ASSETS')"
                  >
                    {{ t('views.accounts.addFirstAccount') }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Liabilities -->
            <div class="card bg-base-200 shadow-xl">
              <div class="card-body p-6">
                <div class="flex items-center justify-between mb-6">
                  <h2 class="text-xl font-bold text-warning flex items-center">
                    <svg
                      class="w-6 h-6 mr-2"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z"
                      />
                    </svg>
                    {{ t('words.liabilities') }}
                  </h2>
                  <button
                    class="btn btn-warning btn-sm"
                    @click="openAddAccountModal('LIABILITIES')"
                  >
                    <svg
                      class="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                    </svg>
                    {{ t('views.accounts.addAccount') }}
                  </button>
                </div>

                <div
                  v-if="accounts?.liabilities?.accounts?.length"
                  class="space-y-2"
                >
                  <div
                    v-for="account in accounts.liabilities.accounts"
                    :key="account.id"
                    class="flex items-center justify-between p-3 bg-base-100 rounded-lg hover:bg-base-300 transition-colors cursor-pointer border-l-4 border-warning"
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
                        <p class="text-xs text-base-content/60">
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
                  <svg
                    class="w-12 h-12 mx-auto text-base-content/20 mb-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z"
                    />
                  </svg>
                  <p class="text-base-content/60 mb-4">
                    {{ t('views.accounts.noLiabilities') }}
                  </p>
                  <button
                    class="btn btn-warning btn-sm"
                    @click="openAddAccountModal('LIABILITIES')"
                  >
                    {{ t('views.accounts.addFirstAccount') }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Income & Expenses (Right Column) -->
          <div class="space-y-8">
            <!-- Income -->
            <div class="card bg-base-200 shadow-xl">
              <div class="card-body p-6">
                <div class="flex items-center justify-between mb-6">
                  <h2 class="text-xl font-bold text-info flex items-center">
                    <svg
                      class="w-6 h-6 mr-2"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z"
                      />
                    </svg>
                    {{ t('words.income') }}
                  </h2>
                  <button
                    class="btn btn-info btn-sm"
                    @click="openAddAccountModal('INCOME')"
                  >
                    <svg
                      class="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                    </svg>
                    {{ t('views.accounts.addAccount') }}
                  </button>
                </div>

                <div
                  v-if="accounts?.income?.accounts?.length"
                  class="space-y-2"
                >
                  <div
                    v-for="account in accounts.income.accounts"
                    :key="account.id"
                    class="flex items-center justify-between p-3 bg-base-100 rounded-lg hover:bg-base-300 transition-colors cursor-pointer border-l-4 border-info"
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
                        <p class="text-xs text-base-content/60">
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
                  <svg
                    class="w-12 h-12 mx-auto text-base-content/20 mb-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z"
                    />
                  </svg>
                  <p class="text-base-content/60 mb-4">
                    {{ t('views.accounts.noIncome') }}
                  </p>
                  <button
                    class="btn btn-info btn-sm"
                    @click="openAddAccountModal('INCOME')"
                  >
                    {{ t('views.accounts.addFirstAccount') }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Expenses -->
            <div class="card bg-base-200 shadow-xl">
              <div class="card-body p-6">
                <div class="flex items-center justify-between mb-6">
                  <h2 class="text-xl font-bold text-error flex items-center">
                    <svg
                      class="w-6 h-6 mr-2"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"
                      />
                    </svg>
                    {{ t('words.expenses') }}
                  </h2>
                  <button
                    class="btn btn-error btn-sm"
                    @click="openAddAccountModal('EXPENSE')"
                  >
                    <svg
                      class="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                    </svg>
                    {{ t('views.accounts.addAccount') }}
                  </button>
                </div>

                <div
                  v-if="accounts?.expense?.accounts?.length"
                  class="space-y-2"
                >
                  <div
                    v-for="account in accounts.expense.accounts"
                    :key="account.id"
                    class="flex items-center justify-between p-3 bg-base-100 rounded-lg hover:bg-base-300 transition-colors cursor-pointer border-l-4 border-error"
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
                        <p class="text-xs text-base-content/60">
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
                  <svg
                    class="w-12 h-12 mx-auto text-base-content/20 mb-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"
                    />
                  </svg>
                  <p class="text-base-content/60 mb-4">
                    {{ t('views.accounts.noExpenses') }}
                  </p>
                  <button
                    class="btn btn-error btn-sm"
                    @click="openAddAccountModal('EXPENSE')"
                  >
                    {{ t('views.accounts.addFirstAccount') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Net Worth Summary -->
        <div
          class="card bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20 shadow-xl mt-8"
        >
          <div class="card-body p-6">
            <div class="flex justify-between items-center">
              <h2 class="text-2xl font-bold text-primary">
                {{ t('views.dashboard.netWorth') }}
              </h2>
              <span
                class="text-3xl font-bold"
                :class="netWorth >= 0 ? 'text-success' : 'text-error'"
              >
                {{ formatCurrency(netWorth, 'CHF') }}
              </span>
            </div>
            <p class="text-sm text-base-content/60 mt-2">
              {{ t('views.accounts.total') }} {{ t('words.assets') }}:
              {{ formatCurrency(accounts?.assets?.total || 0, 'CHF') }} -
              {{ t('views.accounts.total') }} {{ t('words.liabilities') }}:
              {{
                formatCurrency(
                  Math.abs(accounts?.liabilities?.total || 0),
                  'CHF',
                )
              }}
            </p>
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
            class="card bg-base-200 shadow-lg"
          >
            <div class="card-body p-4 sm:p-6 space-y-4">
              <div class="skeleton h-4 w-3/4"></div>
              <div class="skeleton h-8 w-full"></div>
            </div>
          </div>
        </div>
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body p-6 space-y-4">
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
    >
      <div class="modal-box w-11/12 max-w-2xl">
        <div class="flex justify-between items-center mb-6">
          <h3 class="font-bold text-lg">
            <svg
              class="w-6 h-6 inline mr-2"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
            </svg>
            {{ t('views.accounts.addAccountForm.title') }}
          </h3>
          <button
            class="btn btn-sm btn-circle btn-ghost"
            @click="closeAddAccountModal"
          >
            ✕
          </button>
        </div>

        <form
          @submit.prevent="addAccount"
          class="space-y-4"
        >
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">{{
                t('views.accounts.addAccountForm.accountName.label')
              }}</span>
            </label>
            <input
              v-model="name"
              type="text"
              class="input input-bordered w-full"
              :placeholder="
                t('views.accounts.addAccountForm.accountName.placeholder')
              "
              required
            />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">{{
                t('views.accounts.addAccountForm.accountType.label')
              }}</span>
            </label>
            <select
              v-model="accountType"
              class="select select-bordered w-full"
              required
            >
              <option value="ASSETS">{{ t('words.assets') }}</option>
              <option value="LIABILITIES">{{ t('words.liabilities') }}</option>
              <option value="INCOME">{{ t('words.income') }}</option>
              <option value="EXPENSE">{{ t('words.expenses') }}</option>
            </select>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">{{
                t('views.accounts.addAccountForm.openingBalance.label')
              }}</span>
            </label>
            <input
              v-model="openingBalance"
              type="number"
              step="0.01"
              class="input input-bordered w-full"
              placeholder="0.00"
            />
          </div>

          <div class="modal-action">
            <button
              type="button"
              class="btn btn-ghost"
              @click="closeAddAccountModal"
            >
              {{ t('words.cancel') }}
            </button>
            <button
              type="submit"
              class="btn btn-primary"
            >
              {{ t('views.accounts.addAccountForm.submit.label') }}
            </button>
          </div>
        </form>
      </div>
      <form
        method="dialog"
        class="modal-backdrop"
      >
        <button @click="closeAddAccountModal">close</button>
      </form>
    </dialog>

    <!-- Create Transaction Modal -->
    <dialog
      ref="transactionModal"
      class="modal"
    >
      <div class="modal-box w-11/12 max-w-3xl">
        <div class="flex justify-between items-center mb-6">
          <h3 class="font-bold text-lg">
            <svg
              class="w-6 h-6 inline mr-2"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12,20C16.4,20 20,16.4 20,12C20,7.6 16.4,4 12,4C7.6,4 4,7.6 4,12C4,16.4 7.6,20 12,20M12,2C17.5,2 22,6.5 22,12C22,17.5 17.5,22 12,22C6.5,22 2,17.5 2,12C2,6.5 6.5,2 12,2M13,7H11V11H7V13H11V17H13V13H17V11H13V7Z"
              />
            </svg>
            {{ t('views.accounts.createTransactionForm.title') }}
          </h3>
          <button
            class="btn btn-sm btn-circle btn-ghost"
            @click="closeTransactionModal"
          >
            ✕
          </button>
        </div>

        <form
          @submit.prevent="createTransaction"
          class="space-y-4"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">{{
                  t('views.accounts.createTransactionForm.date.label')
                }}</span>
              </label>
              <input
                v-model="transactionDate"
                type="date"
                class="input input-bordered w-full"
                required
              />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">{{
                  t('views.accounts.createTransactionForm.amount.label')
                }}</span>
              </label>
              <input
                v-model="transactionAmount"
                type="number"
                step="0.01"
                class="input input-bordered w-full"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">{{
                t('views.accounts.createTransactionForm.description.label')
              }}</span>
            </label>
            <input
              v-model="transactionDescription"
              type="text"
              class="input input-bordered w-full"
              :placeholder="
                t(
                  'views.accounts.createTransactionForm.description.placeholder',
                )
              "
              required
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">{{
                  t('views.accounts.createTransactionForm.creditAccount.label')
                }}</span>
              </label>
              <select
                v-model="creditAccountId"
                class="select select-bordered w-full"
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

            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">{{
                  t('views.accounts.createTransactionForm.debitAccount.label')
                }}</span>
              </label>
              <select
                v-model="debitAccountId"
                class="select select-bordered w-full"
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

          <div class="modal-action">
            <button
              type="button"
              class="btn btn-ghost"
              @click="closeTransactionModal"
            >
              {{ t('words.cancel') }}
            </button>
            <button
              type="submit"
              class="btn btn-secondary"
            >
              {{ t('views.accounts.createTransactionForm.submit.label') }}
            </button>
          </div>
        </form>
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
import { useMutation } from '@tanstack/vue-query';
import { computed, ref } from 'vue';
import { useAccounts } from '../composables/useAccounts';
import { useAuth } from '../composables/useAuth';
import { useConstant } from '../composables/useConstant';
import { useCurrency } from '../composables/useCurrency';
import { useLanguage } from '../composables/useLanguage';

const { t } = useLanguage();
const { URI } = useConstant();
const { formatCurrency } = useCurrency();
const timeFilter = ref('2025');
const { accounts, createAccount } = useAccounts(timeFilter);
const { getAccessToken } = useAuth();

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

const netWorth = computed(() => {
  if (!accounts?.value) return 0;
  return (
    (accounts.value.assets?.total || 0) +
    (accounts.value.liabilities?.total || 0)
  );
});

const monthlyFlow = computed(() => {
  if (!accounts?.value) return 0;
  const income = Math.abs(accounts.value.income?.total || 0);
  const expenses = Math.abs(accounts.value.expense?.total || 0);
  return income - expenses;
});

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
  } catch (error) {
    console.error('Failed to create account:', error);
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
  } catch (error) {
    console.error('Failed to create transaction:', error);
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
    return response.json();
  },
});
</script>
