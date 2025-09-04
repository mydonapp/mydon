export default {
  common: {
    loading: 'Caricamento...',
    close: 'Chiudi',
    cancel: 'Annulla',
    save: 'Salva',
    delete: 'Elimina',
    edit: 'Modifica',
    add: 'Aggiungi',
    search: 'Cerca',
    filter: 'Filtra',
    sort: 'Ordina',
  },
  app: {
    subtitle: 'Tracker Finanziario',
    user: 'Account Utente',
    userEmail: "utente{'@'}esempio.com",
  },
  views: {
    dashboard: {
      title: 'Dashboard Finanziaria',
      subtitle: 'Benvenuto su myDon - Il Tuo Tracker Finanziario Personale',
      lastUpdated: 'Ultimo Aggiornamento',
      netWorth: 'Patrimonio Netto',
      totalAssets: 'Totale Attività',
      assets: 'Attività',
      liabilities: 'Passività',
      monthlyFlow: 'Flusso di Cassa Mensile',
      thisMonth: 'Questo mese',
      accounts: 'conti',
      accountBalances: 'Saldi dei Conti',
      moreAccounts: 'altri conti',
      recentTransactions: 'Transazioni Recenti',
      noTransactions: 'Nessuna transazione recente trovata',
      importMore: 'Importa Altro',
      importFirst: 'Importa le Tue Prime Transazioni',
      quickActions: 'Azioni Rapide',
      importTransactions: 'Importa Transazioni',
      manageAccounts: 'Gestisci Conti',
      refresh: 'Aggiorna Dati',
    },
    login: {
      title: 'Accedi al tuo account',
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
          label: 'Accedi',
        },
      },
      signupPrompt: {
        text: 'Non sei ancora membro?',
        link: 'Crea un account ora',
      },
    },
    signup: {
      title: 'Crea un account',
      signupForm: {
        name: {
          label: 'Nome',
          placeholder: 'Nome',
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
          label: 'Crea Account',
        },
      },
      loginPrompt: {
        text: 'Sei già membro?',
        link: 'Accedi ora',
      },
    },
    accounts: {
      title: 'Panoramica Conti',
      subtitle: 'Gestisci i tuoi conti finanziari e traccia i saldi',
      privacy: 'Modalità Privacy',
      total: 'Totale',
      moreAccounts: 'altri conti',
      noLiabilities: 'Nessuna passività trovata',
      noAssets: 'Nessuna attività trovata',
      noIncome: 'Nessun conto entrate trovato',
      noExpenses: 'Nessun conto spese trovato',
      addFirstAccount: 'Aggiungi il tuo primo conto',
      addAccount: 'Aggiungi Conto',
      addTransaction: 'Aggiungi Transazione',
      retirement: 'Pensione',
      addAccountForm: {
        title: 'Aggiungi Conto',
        accountName: {
          label: 'Nome del Conto',
          placeholder: 'Inserisci il nome del conto',
        },
        openingBalance: {
          label: 'Saldo di Apertura',
        },
        accountType: {
          label: 'Tipo di Conto',
        },
        submit: {
          label: 'Aggiungi Conto',
        },
      },
      createTransactionForm: {
        title: 'Crea Transazione',
        date: {
          label: 'Data',
        },
        description: {
          label: 'Descrizione',
          placeholder: 'Inserisci la descrizione della transazione',
        },
        creditAccount: {
          label: 'Conto Creditore',
          placeholder: 'Seleziona Conto Creditore',
        },
        debitAccount: {
          label: 'Conto Debitore',
          placeholder: 'Seleziona Conto Debitore',
        },
        amount: {
          label: 'Importo',
        },
        submit: {
          label: 'Crea Transazione',
        },
      },
    },
    account: {
      title: 'Conto: {accountName}',
      subtitle: 'Vista dettagliata delle transazioni e del saldo del conto',
      currentBalance: 'Saldo Attuale',
      totalTransactions: 'Totale Transazioni',
      totalCredit: 'Totale Credito',
      totalDebit: 'Totale Debito',
      totalIncome: 'Totale Entrate',
      totalExpenses: 'Totale Spese',
      noTransactions: 'Nessuna transazione trovata',
      noTransactionsDescription: 'Questo conto non ha ancora transazioni.',
      transactionDetails: 'Dettagli Transazione',
      transactions: {
        title: 'Transazioni',
        table: {
          date: 'Data Transazione',
          description: 'Descrizione',
          otherAccount: 'Conto Opposto',
          amount: 'Importo',
        },
      },
    },
    importTransactions: {
      title: 'Importa Transazioni',
      subtitle: 'Importa i tuoi estratti conto e file CSV',
      pendingTransactions: 'In sospeso',
      importForm: {
        title: 'Importa Estratto Conto',
        account: {
          label: 'Conto di Importazione',
          placeholder: 'Seleziona il conto in cui importare',
          help: 'Scegli il conto che corrisponde al tuo estratto conto',
        },
        issuer: {
          label: 'Banca/Provider',
          placeholder: 'Seleziona la tua banca o provider finanziario',
          footer: {
            text: 'Hai bisogno di supporto per un nuovo provider? Richiedilo {0}',
            link: 'qui',
          },
        },
        upload: {
          label: 'File CSV',
          help: 'Carica il tuo estratto conto in formato CSV',
        },
        tip: {
          title: 'Suggerimento: Contabilità a Partita Doppia',
          description:
            'Ogni transazione sarà automaticamente abbinata ai conti spese/entrate basati sui pattern di descrizione.',
        },
        submit: {
          label: 'Importa Transazioni',
        },
      },
      draftTransactions: {
        title: 'Rivedi Transazioni Bozza',
        selectAll: 'Seleziona Tutto',
        deselectAll: 'Deseleziona Tutto',
        approve: 'Approva Selezionate',
        table: {
          date: 'Data',
          description: 'Descrizione',
          descriptionPlaceholder: 'Modifica descrizione transazione',
          creditAccount: 'Conto Creditore',
          debitAccount: 'Conto Debitore',
          amount: 'Importo',
          actions: 'Azioni',
          selectAccount: 'Seleziona Conto',
        },
      },
      emptyState: {
        title: 'Nessuna Transazione da Rivedere',
        description:
          'Importa il tuo primo estratto conto per iniziare con la gestione delle transazioni.',
        step1: {
          title: '1. Seleziona Conto',
          description: 'Scegli il conto in cui importare',
        },
        step2: {
          title: '2. Scegli Provider',
          description: 'Seleziona la tua banca o provider finanziario',
        },
        step3: {
          title: '3. Carica CSV',
          description: 'Importa il tuo file estratto conto',
        },
      },
    },
    settings: {
      title: 'Impostazioni',
      subtitle:
        "Gestisci le preferenze del tuo account e le impostazioni dell'applicazione",
      sections: {
        profile: {
          title: 'Informazioni Profilo',
          name: 'Nome Completo',
          namePlaceholder: 'Inserisci il tuo nome completo',
          email: 'Indirizzo Email',
          emailPlaceholder: 'Inserisci il tuo indirizzo email',
          updateButton: 'Aggiorna Profilo',
        },
        language: {
          title: 'Lingua e Regione',
          currentLanguage: 'Lingua di Visualizzazione',
          description:
            "Seleziona la tua lingua preferita per l'interfaccia dell'applicazione",
        },
        privacy: {
          title: 'Impostazioni Privacy',
          privacyMode: 'Modalità Privacy',
          privacyModeDescription:
            'Nascondi informazioni finanziarie sensibili quando abilitato',
        },
        about: {
          title: 'Info su myDon',
          version: 'Versione',
          buildDate: 'Data di Compilazione',
        },
      },
    },
  },
  components: {
    sidebar: {
      menu: {
        dashboard: 'Dashboard',
        accounts: 'Conti',
        importTransactions: 'Importa Transazioni',
        settings: 'Impostazioni',
        logout: 'Disconnetti',
      },
    },
  },
  words: {
    assets: 'Attività',
    liabilities: 'Passività',
    equity: 'Patrimonio Netto',
    income: 'Entrate',
    expenses: 'Spese',
    cancel: 'Annulla',
  },
};
