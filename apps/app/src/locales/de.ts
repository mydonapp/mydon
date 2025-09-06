export default {
  common: {
    loading: 'Lädt...',
    close: 'Schließen',
    cancel: 'Abbrechen',
    save: 'Speichern',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    add: 'Hinzufügen',
    search: 'Suchen',
    filter: 'Filter',
    sort: 'Sortieren',
  },
  app: {
    subtitle: 'Finanz Tracker',
    user: 'Benutzerkonto',
    userEmail: "benutzer{'@'}beispiel.com",
  },
  views: {
    dashboard: {
      title: 'Finanz-Dashboard',
      subtitle: 'Willkommen bei myDon - Ihr persönlicher Finanztracker',
      lastUpdated: 'Zuletzt aktualisiert',
      netWorth: 'Nettovermögen',
      totalAssets: 'Gesamtvermögen',
      assets: 'Vermögen',
      liabilities: 'Verbindlichkeiten',
      monthlyFlow: 'Monatlicher Cashflow',
      thisMonth: 'Diesen Monat',
      accounts: 'Konten',
      accountBalances: 'Kontostände',
      moreAccounts: 'weitere Konten',
      recentTransactions: 'Letzte Transaktionen',
      noTransactions: 'Keine aktuellen Transaktionen gefunden',
      importMore: 'Mehr importieren',
      importFirst: 'Ihre ersten Transaktionen importieren',
      quickActions: 'Schnellaktionen',
      importTransactions: 'Transaktionen importieren',
      manageAccounts: 'Konten verwalten',
      refresh: 'Daten aktualisieren',
    },
    login: {
      title: 'In Ihr Konto einloggen',
      loginForm: {
        email: {
          label: 'E-Mail',
          placeholder: 'E-Mail',
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
        text: 'Noch kein Mitglied?',
        link: 'Jetzt Konto erstellen',
      },
    },
    signup: {
      title: 'Konto erstellen',
      signupForm: {
        name: {
          label: 'Name',
          placeholder: 'Name',
        },
        email: {
          label: 'E-Mail',
          placeholder: 'E-Mail',
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
        link: 'Jetzt anmelden',
      },
    },
    accounts: {
      title: 'Konten Übersicht',
      subtitle: 'Verwalten Sie Ihre Finanzkonten und verfolgen Sie Salden',
      privacy: 'Privatsphäre Modus',
      total: 'Gesamt',
      moreAccounts: 'weitere Konten',
      noLiabilities: 'Keine Verbindlichkeiten gefunden',
      noAssets: 'Keine Vermögenswerte gefunden',
      noIncome: 'Keine Einkommenskonten gefunden',
      noExpenses: 'Keine Ausgabenkonten gefunden',
      addFirstAccount: 'Erstes Konto hinzufügen',
      addAccount: 'Konto hinzufügen',
      addTransaction: 'Transaktion hinzufügen',
      retirement: 'Rente',
      addAccountForm: {
        title: 'Konto hinzufügen',
        accountName: {
          label: 'Kontoname',
          placeholder: 'Kontoname eingeben',
        },
        openingBalance: {
          label: 'Anfangsbestand',
        },
        accountType: {
          label: 'Kontotyp',
        },
        currency: {
          label: 'Währung',
          placeholder: 'Währung auswählen',
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
          placeholder: 'Transaktionsbeschreibung eingeben',
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
      subtitle: 'Detailansicht der Kontotransaktionen und des Saldos',
      currentBalance: 'Aktueller Saldo',
      totalTransactions: 'Gesamttransaktionen',
      totalCredit: 'Total Kredit',
      totalDebit: 'Total Debit',
      totalIncome: 'Gesamteinkommen',
      totalExpenses: 'Gesamtausgaben',
      noTransactions: 'Keine Transaktionen gefunden',
      noTransactionsDescription: 'Dieses Konto hat noch keine Transaktionen.',
      transactionDetails: 'Transaktionsdetails',
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
      title: 'Transaktionen importieren',
      subtitle: 'Importieren Sie Ihre Kontoauszüge und CSV-Dateien',
      pendingTransactions: 'Ausstehend',
      importForm: {
        title: 'Kontoauszug importieren',
        account: {
          label: 'Importkonto',
          placeholder: 'Wählen Sie das Konto zum Importieren',
          help: 'Wählen Sie das Konto, das zu Ihrem Kontoauszug passt',
        },
        issuer: {
          label: 'Bank/Anbieter',
          placeholder: 'Wählen Sie Ihre Bank oder Ihren Finanzdienstleister',
          footer: {
            text: 'Benötigen Sie Unterstützung für einen neuen Anbieter? Fordern Sie es {0} an',
            link: 'hier',
          },
        },
        upload: {
          label: 'CSV-Datei',
          help: 'Laden Sie Ihren Kontoauszug im CSV-Format hoch',
        },
        submit: {
          label: 'Transaktionen importieren',
        },
      },
      draftTransactions: {
        title: 'Entwurfstransaktionen überprüfen',
        selectAll: 'Alle auswählen',
        deselectAll: 'Alle abwählen',
        approve: 'Ausgewählte genehmigen',
        table: {
          date: 'Datum',
          description: 'Beschreibung',
          descriptionPlaceholder: 'Transaktionsbeschreibung bearbeiten',
          creditAccount: 'Kreditkonto',
          debitAccount: 'Debitkonto',
          amount: 'Betrag',
          actions: 'Aktionen',
          selectAccount: 'Konto auswählen',
        },
      },
      emptyState: {
        title: 'Keine Transaktionen zu überprüfen',
        description:
          'Importieren Sie Ihren ersten Kontoauszug, um mit der Transaktionsverwaltung zu beginnen.',
        step1: {
          title: '1. Konto auswählen',
          description: 'Wählen Sie das Konto zum Importieren',
        },
        step2: {
          title: '2. Anbieter wählen',
          description: 'Wählen Sie Ihre Bank oder Ihren Finanzdienstleister',
        },
        step3: {
          title: '3. CSV hochladen',
          description: 'Importieren Sie Ihre Kontoauszugsdatei',
        },
      },
    },
    settings: {
      title: 'Einstellungen',
      subtitle:
        'Verwalten Sie Ihre Kontopräferenzen und Anwendungseinstellungen',
      sections: {
        profile: {
          title: 'Profilinformationen',
          name: 'Vollständiger Name',
          namePlaceholder: 'Geben Sie Ihren vollständigen Namen ein',
          email: 'E-Mail-Adresse',
          emailPlaceholder: 'Geben Sie Ihre E-Mail-Adresse ein',
          updateButton: 'Profil aktualisieren',
        },
        language: {
          title: 'Sprache & Region',
          currentLanguage: 'Anzeigesprache',
          description:
            'Wählen Sie Ihre bevorzugte Sprache für die Anwendungsoberfläche',
        },
        privacy: {
          title: 'Datenschutzeinstellungen',
          privacyMode: 'Privatsphäre-Modus',
          privacyModeDescription:
            'Versteckt sensible Finanzinformationen wenn aktiviert',
        },
        about: {
          title: 'Über myDon',
          version: 'Version',
          buildDate: 'Build-Datum',
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
        settings: 'Einstellungen',
        logout: 'Abmelden',
      },
    },
  },
  words: {
    assets: 'Vermögen',
    liabilities: 'Verbindlichkeiten',
    equity: 'Eigenkapital',
    income: 'Einkommen',
    expenses: 'Ausgaben',
    cancel: 'Abbrechen',
    currencies: {
      CHF: 'Schweizer Franken (CHF)',
      EUR: 'Euro (EUR)',
      USD: 'US-Dollar (USD)',
      GBP: 'Britisches Pfund (GBP)',
      KRW: 'Südkoreanischer Won (KRW)',
    },
  },
};
