export default {
  common: {
    loading: 'Loading...',
    close: 'Close',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
  },
  app: {
    subtitle: 'Finance Tracker',
    user: 'User Account',
    userEmail: 'user@example.com',
  },
  views: {
    dashboard: {
      title: 'Financial Dashboard',
      subtitle: 'Welcome to myDon - Your Personal Finance Tracker',
      lastUpdated: 'Last Updated',
      netWorth: 'Net Worth',
      totalAssets: 'Total Assets',
      assets: 'Assets',
      liabilities: 'Liabilities',
      monthlyFlow: 'Monthly Cash Flow',
      thisMonth: 'This month',
      accounts: 'accounts',
      accountBalances: 'Account Balances',
      moreAccounts: 'more accounts',
      recentTransactions: 'Recent Transactions',
      noTransactions: 'No recent transactions found',
      importMore: 'Import More',
      importFirst: 'Import Your First Transactions',
      quickActions: 'Quick Actions',
      importTransactions: 'Import Transactions',
      manageAccounts: 'Manage Accounts',
      refresh: 'Refresh Data',
    },
    login: {
      title: 'Login to your account',
      loginForm: {
        email: {
          label: 'Email',
          placeholder: 'Email',
        },
        password: {
          label: 'Password',
          placeholder: 'Password',
        },
        submit: {
          label: 'Login',
        },
      },
      signupPrompt: {
        text: 'Not a member?',
        link: 'Create an account now',
      },
    },
    signup: {
      title: 'Create an account',
      signupForm: {
        name: {
          label: 'Name',
          placeholder: 'Name',
        },
        email: {
          label: 'Email',
          placeholder: 'Email',
        },
        password: {
          label: 'Password',
          placeholder: 'Password',
        },
        submit: {
          label: 'Create Account',
        },
      },
      loginPrompt: {
        text: 'Already a member?',
        link: 'Login now',
      },
    },
    accounts: {
      title: 'Accounts Overview',
      subtitle: 'Manage your financial accounts and track balances',
      privacy: 'Privacy Mode',
      total: 'Total',
      moreAccounts: 'more accounts',
      noLiabilities: 'No liabilities found',
      noAssets: 'No assets found',
      noIncome: 'No income accounts found',
      noExpenses: 'No expense accounts found',
      addFirstAccount: 'Add your first account',
      addAccount: 'Add Account',
      addTransaction: 'Add Transaction',
      retirement: 'Retirement',
      addAccountForm: {
        title: 'Add Account',
        accountName: {
          label: 'Account Name',
          placeholder: 'Enter account name',
        },
        openingBalance: {
          label: 'Opening Balance',
        },
        accountType: {
          label: 'Account Type',
        },
        submit: {
          label: 'Add Account',
        },
      },
      createTransactionForm: {
        title: 'Create Transaction',
        date: {
          label: 'Date',
        },
        description: {
          label: 'Description',
          placeholder: 'Enter transaction description',
        },
        creditAccount: {
          label: 'Credit Account',
          placeholder: 'Select Credit Account',
        },
        debitAccount: {
          label: 'Debit Account',
          placeholder: 'Select Debit Account',
        },
        amount: {
          label: 'Amount',
        },
        submit: {
          label: 'Create Transaction',
        },
      },
    },
    account: {
      title: 'Account: {accountName}',
      subtitle: 'Detailed view of account transactions and balance',
      currentBalance: 'Current Balance',
      totalTransactions: 'Total Transactions',
      totalIncome: 'Total Income',
      totalExpenses: 'Total Expenses',
      noTransactions: 'No transactions found',
      noTransactionsDescription: 'This account has no transactions yet.',
      transactionDetails: 'Transaction Details',
      transactions: {
        title: 'Transactions',
        table: {
          date: 'Transaction Date',
          description: 'Description',
          otherAccount: 'Opposite Account',
          amount: 'Amount',
        },
      },
    },
    importTransactions: {
      title: 'Import Transactions',
      subtitle: 'Import your bank statements and CSV files',
      pendingTransactions: 'Pending',
      importForm: {
        title: 'Import Bank Statement',
        account: {
          label: 'Import Account',
          placeholder: 'Select the account to import into',
          help: 'Choose the account that matches your bank statement',
        },
        issuer: {
          label: 'Bank/Provider',
          placeholder: 'Select your bank or financial provider',
          footer: {
            text: 'Need support for a new provider? Request it {0}',
            link: 'here',
          },
        },
        upload: {
          label: 'CSV File',
          help: 'Upload your bank statement in CSV format',
        },
        tip: {
          title: 'Tip: Double-entry Bookkeeping',
          description:
            'Each transaction will be automatically matched to expense/income accounts based on description patterns.',
        },
        submit: {
          label: 'Import Transactions',
        },
      },
      draftTransactions: {
        title: 'Review Draft Transactions',
        selectAll: 'Select All',
        deselectAll: 'Deselect All',
        approve: 'Approve Selected',
        table: {
          date: 'Date',
          description: 'Description',
          creditAccount: 'Credit Account',
          debitAccount: 'Debit Account',
          amount: 'Amount',
          actions: 'Actions',
          selectAccount: 'Select Account',
        },
      },
      emptyState: {
        title: 'No Transactions to Review',
        description:
          'Import your first bank statement to get started with transaction management.',
        step1: {
          title: '1. Select Account',
          description: 'Choose the account to import into',
        },
        step2: {
          title: '2. Choose Provider',
          description: 'Select your bank or financial provider',
        },
        step3: {
          title: '3. Upload CSV',
          description: 'Import your bank statement file',
        },
      },
    },
    settings: {
      title: 'Settings',
      subtitle: 'Manage your account preferences and application settings',
      sections: {
        profile: {
          title: 'Profile Information',
          name: 'Full Name',
          namePlaceholder: 'Enter your full name',
          email: 'Email Address',
          emailPlaceholder: 'Enter your email address',
          updateButton: 'Update Profile',
        },
        language: {
          title: 'Language & Region',
          currentLanguage: 'Display Language',
          description:
            'Select your preferred language for the application interface',
        },
        privacy: {
          title: 'Privacy Settings',
          privacyMode: 'Privacy Mode',
          privacyModeDescription:
            'Hide sensitive financial information when enabled',
        },
        about: {
          title: 'About myDon',
          version: 'Version',
          buildDate: 'Build Date',
        },
      },
    },
  },
  components: {
    sidebar: {
      menu: {
        dashboard: 'Dashboard',
        accounts: 'Accounts',
        importTransactions: 'Import Transactions',
        settings: 'Settings',
        logout: 'Logout',
      },
    },
  },
  words: {
    assets: 'Assets',
    liabilities: 'Liabilities',
    equity: 'Equity',
    income: 'Income',
    expenses: 'Expenses',
    cancel: 'Cancel',
  },
};
