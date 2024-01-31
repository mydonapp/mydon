export const useCurrency = () => {
  const country = 'CH';

  const getCurrency = () => {
    switch (country) {
      case 'CH':
        return 'CHF';
      // case 'DE':
      //   return 'EUR';
      // case 'FR':
      //   return 'EUR';
      default:
        return 'CHF';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(country, {
      style: 'currency',
      currency: getCurrency(),
    }).format(value);
  };

  return { formatCurrency };
};
