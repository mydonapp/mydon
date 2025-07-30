export default {
  common: {
    loading: 'Chargement...',
    close: 'Fermer',
    cancel: 'Annuler',
    save: 'Enregistrer',
    delete: 'Supprimer',
    edit: 'Modifier',
    add: 'Ajouter',
    search: 'Rechercher',
    filter: 'Filtrer',
    sort: 'Trier',
  },
  app: {
    subtitle: 'Suivi Financier',
    user: 'Compte Utilisateur',
    userEmail: 'utilisateur@exemple.com',
  },
  views: {
    dashboard: {
      title: 'Tableau de Bord Financier',
      subtitle:
        'Bienvenue sur myDon - Votre Gestionnaire de Finances Personnel',
      lastUpdated: 'Dernière Mise à Jour',
      netWorth: 'Patrimoine Net',
      totalAssets: 'Total des Actifs',
      assets: 'Actifs',
      liabilities: 'Passifs',
      monthlyFlow: 'Flux de Trésorerie Mensuel',
      thisMonth: 'Ce mois-ci',
      accounts: 'comptes',
      accountBalances: 'Soldes des Comptes',
      moreAccounts: 'autres comptes',
      recentTransactions: 'Transactions Récentes',
      noTransactions: 'Aucune transaction récente trouvée',
      importMore: 'Importer Plus',
      importFirst: 'Importez Vos Premières Transactions',
      quickActions: 'Actions Rapides',
      importTransactions: 'Importer des Transactions',
      manageAccounts: 'Gérer les Comptes',
      refresh: 'Actualiser les Données',
    },
    login: {
      title: 'Connectez-vous à votre compte',
      loginForm: {
        email: {
          label: 'Email',
          placeholder: 'Email',
        },
        password: {
          label: 'Mot de passe',
          placeholder: 'Mot de passe',
        },
        submit: {
          label: 'Se connecter',
        },
      },
      signupPrompt: {
        text: 'Pas encore membre ?',
        link: 'Créer un compte maintenant',
      },
    },
    signup: {
      title: 'Créer un compte',
      signupForm: {
        name: {
          label: 'Nom',
          placeholder: 'Nom',
        },
        email: {
          label: 'Email',
          placeholder: 'Email',
        },
        password: {
          label: 'Mot de passe',
          placeholder: 'Mot de passe',
        },
        submit: {
          label: 'Créer un Compte',
        },
      },
      loginPrompt: {
        text: 'Déjà membre ?',
        link: 'Se connecter maintenant',
      },
    },
    accounts: {
      title: 'Aperçu des Comptes',
      subtitle: 'Gérez vos comptes financiers et suivez les soldes',
      privacy: 'Mode Privé',
      total: 'Total',
      moreAccounts: 'autres comptes',
      noLiabilities: 'Aucun passif trouvé',
      noAssets: 'Aucun actif trouvé',
      noIncome: 'Aucun compte de revenus trouvé',
      noExpenses: 'Aucun compte de dépenses trouvé',
      addFirstAccount: 'Ajoutez votre premier compte',
      addAccount: 'Ajouter un Compte',
      addTransaction: 'Ajouter une Transaction',
      retirement: 'Retraite',
      addAccountForm: {
        title: 'Ajouter un Compte',
        accountName: {
          label: 'Nom du Compte',
          placeholder: 'Entrez le nom du compte',
        },
        openingBalance: {
          label: "Solde d'Ouverture",
        },
        accountType: {
          label: 'Type de Compte',
        },
        submit: {
          label: 'Ajouter le Compte',
        },
      },
      createTransactionForm: {
        title: 'Créer une Transaction',
        date: {
          label: 'Date',
        },
        description: {
          label: 'Description',
          placeholder: 'Entrez la description de la transaction',
        },
        creditAccount: {
          label: 'Compte Créditeur',
          placeholder: 'Sélectionner le Compte Créditeur',
        },
        debitAccount: {
          label: 'Compte Débiteur',
          placeholder: 'Sélectionner le Compte Débiteur',
        },
        amount: {
          label: 'Montant',
        },
        submit: {
          label: 'Créer la Transaction',
        },
      },
    },
    account: {
      title: 'Compte : {accountName}',
      subtitle: 'Vue détaillée des transactions et du solde du compte',
      currentBalance: 'Solde Actuel',
      totalTransactions: 'Total des Transactions',
      totalIncome: 'Total des Revenus',
      totalExpenses: 'Total des Dépenses',
      noTransactions: 'Aucune transaction trouvée',
      noTransactionsDescription: "Ce compte n'a pas encore de transactions.",
      transactionDetails: 'Détails de la Transaction',
      transactions: {
        title: 'Transactions',
        table: {
          date: 'Date de Transaction',
          description: 'Description',
          otherAccount: 'Compte Opposé',
          amount: 'Montant',
        },
      },
    },
    importTransactions: {
      title: 'Importer des Transactions',
      subtitle: 'Importez vos relevés bancaires et fichiers CSV',
      pendingTransactions: 'En attente',
      importForm: {
        title: 'Importer un Relevé Bancaire',
        account: {
          label: "Compte d'Import",
          placeholder: 'Sélectionnez le compte dans lequel importer',
          help: 'Choisissez le compte qui correspond à votre relevé bancaire',
        },
        issuer: {
          label: 'Banque/Fournisseur',
          placeholder: 'Sélectionnez votre banque ou fournisseur financier',
          footer: {
            text: 'Besoin de support pour un nouveau fournisseur ? Demandez-le {0}',
            link: 'ici',
          },
        },
        upload: {
          label: 'Fichier CSV',
          help: 'Téléchargez votre relevé bancaire au format CSV',
        },
        tip: {
          title: 'Astuce : Comptabilité en Partie Double',
          description:
            'Chaque transaction sera automatiquement associée aux comptes de dépenses/revenus basés sur les modèles de description.',
        },
        submit: {
          label: 'Importer les Transactions',
        },
      },
      draftTransactions: {
        title: 'Réviser les Transactions Brouillon',
        selectAll: 'Tout Sélectionner',
        deselectAll: 'Tout Désélectionner',
        approve: 'Approuver la Sélection',
        table: {
          date: 'Date',
          description: 'Description',
          creditAccount: 'Compte Créditeur',
          debitAccount: 'Compte Débiteur',
          amount: 'Montant',
          actions: 'Actions',
          selectAccount: 'Sélectionner le Compte',
        },
      },
      emptyState: {
        title: 'Aucune Transaction à Réviser',
        description:
          'Importez votre premier relevé bancaire pour commencer la gestion des transactions.',
        step1: {
          title: '1. Sélectionner le Compte',
          description: 'Choisissez le compte dans lequel importer',
        },
        step2: {
          title: '2. Choisir le Fournisseur',
          description: 'Sélectionnez votre banque ou fournisseur financier',
        },
        step3: {
          title: '3. Télécharger le CSV',
          description: 'Importez votre fichier de relevé bancaire',
        },
      },
    },
    settings: {
      title: 'Paramètres',
      subtitle:
        "Gérez vos préférences de compte et les paramètres de l'application",
      sections: {
        profile: {
          title: 'Informations du Profil',
          name: 'Nom Complet',
          namePlaceholder: 'Entrez votre nom complet',
          email: 'Adresse Email',
          emailPlaceholder: 'Entrez votre adresse email',
          updateButton: 'Mettre à Jour le Profil',
        },
        language: {
          title: 'Langue et Région',
          currentLanguage: "Langue d'Affichage",
          description:
            "Sélectionnez votre langue préférée pour l'interface de l'application",
        },
        privacy: {
          title: 'Paramètres de Confidentialité',
          privacyMode: 'Mode Privé',
          privacyModeDescription:
            'Masquer les informations financières sensibles lorsque activé',
        },
        about: {
          title: 'À propos de myDon',
          version: 'Version',
          buildDate: 'Date de Compilation',
        },
      },
    },
  },
  components: {
    sidebar: {
      menu: {
        dashboard: 'Tableau de Bord',
        accounts: 'Comptes',
        importTransactions: 'Importer des Transactions',
        settings: 'Paramètres',
        logout: 'Déconnexion',
      },
    },
  },
  words: {
    assets: 'Actifs',
    liabilities: 'Passifs',
    equity: 'Capitaux Propres',
    income: 'Revenus',
    expenses: 'Dépenses',
    cancel: 'Annuler',
  },
};
