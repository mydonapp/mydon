export default {
  views: {
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
      addAccountForm: {
        title: 'Add Account',
        accountName: {
          label: 'Account Name',
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
      title: 'Account: {{accountName}}',
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
      importForm: {
        title: 'Import Transactions',
        account: {
          label: 'Import Account',
        },
        issuer: {
          label: 'Import Statement Issuer',
          footer: {
            text: 'You can request new issuers {0}',
            link: 'here',
          },
        },
        upload: {
          label: 'Select CSV File',
          placeholder: 'No file chosen',
          button: 'Choose File',
        },
        submit: {
          label: 'Import',
        },
      },
      draftTransactions: {
        title: 'Draft Transactions',
        table: {
          date: 'Date',
          description: 'Description',
          creditAccount: 'Credit Account',
          debitAccount: 'Debit Account',
          amount: 'Amount',
          delete: 'Delete',
          selectAccount: 'Select Account',
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
  },
};
