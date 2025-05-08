export default {
  views: {
    login: {
      title: 'Melden Sie sich bei Ihrem Konto an',
      loginForm: {
        email: {
          label: 'Email',
          placeholder: 'Email',
        },
        password: {
          label: 'Passwort',
          placeholder: 'Passwort',
        },
        submit: {
          label: 'Anmelden',
        },
      },
      signupPrompt: {
        text: 'Kein Mitglied?',
        link: 'Erstellen Sie jetzt ein Konto',
      },
    },
    signup: {
      title: 'Ein Konto erstellen',
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
          label: 'Passwort',
          placeholder: 'Passwort',
        },
        submit: {
          label: 'Konto erstellen',
        },
      },
      loginPrompt: {
        text: 'Bereits Mitglied?',
        link: 'Melden Sie sich jetzt an',
      },
    },
    accounts: {
      addAccountForm: {
        title: 'Konto hinzufügen',
        accountName: {
          label: 'Kontoname',
        },
        openingBalance: {
          label: 'Anfangsbestand',
        },
        accountType: {
          label: 'Kontotyp',
        },
        submit: {
          label: 'Konto hinzufügen',
        },
      },
      createTransactionForm: {
        title: 'Transaktion erstellen',
        date: {
          label: 'Datum',
        },
        description: {
          label: 'Beschreibung',
        },
        creditAccount: {
          label: 'Kreditkonto',
          placeholder: 'Kreditkonto auswählen',
        },
        debitAccount: {
          label: 'Debitkonto',
          placeholder: 'Debitkonto auswählen',
        },
        amount: {
          label: 'Betrag',
        },
        submit: {
          label: 'Transaktion erstellen',
        },
      },
    },
    account: {
      title: 'Konto: {accountName}',
      transactions: {
        title: 'Transaktionen',
        table: {
          date: 'Transaktionsdatum',
          description: 'Beschreibung',
          otherAccount: 'Gegenseitiges Konto',
          amount: 'Betrag',
        },
      },
    },
    importTransactions: {
      importForm: {
        title: 'Transaktionen importieren',
        account: {
          label: 'Importkonto',
        },
        issuer: {
          label: 'Herausgeber',
          footer: {
            text: 'Sie können neue Herausgeber {0} anfordern',
            link: 'hier',
          },
        },
        upload: {
          label: 'Datei hochladen',
          placeholder: 'Keine Datei ausgewählt',
          button: 'Datei auswählen',
        },
        submit: {
          label: 'Importieren',
        },
      },
      draftTransactions: {
        title: 'Entwurfstransaktionen',
        table: {
          date: 'Transaktionsdatum',
          description: 'Beschreibung',
          creditAccount: 'Kreditkonto',
          debitAccount: 'Debitkonto',
          amount: 'Betrag',
          delete: 'Löschen',
          selectAccount: 'Konto auswählen',
        },
      },
    },
  },
  components: {
    sidebar: {
      menu: {
        dashboard: 'Dashboard',
        accounts: 'Konten',
        importTransactions: 'Transaktionen importieren',
        logout: 'Abmelden',
      },
    },
  },
  words: {
    assets: 'Vermögenswerte',
    liabilities: 'Verbindlichkeiten',
    equity: 'Eigenkapital',
    income: 'Einkommen',
    expenses: 'Ausgaben',
  },
};
