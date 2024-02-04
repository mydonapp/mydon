import { ref } from 'vue';
import { usePrivacy } from './usePrivacy';

export const useCurrency = () => {
  const getCurrency = (currency: string) => {
    switch (currency) {
      case 'CHF':
        return 'CHF';
      case 'EUR':
        return 'EUR';
      case 'USD':
        return 'USD';
      case 'KRW':
        return 'KRW';
      default:
        return 'CHF';
    }
  };

  const formatCurrency = (value: number, currency: string): string => {
    const { isPrivate } = usePrivacy();
    const result = ref('');

    if (isPrivate.value) {
      result.value = '***';
      // return result;
    } else {
      result.value = new Intl.NumberFormat('CH', {
        style: 'currency',
        currency: getCurrency(currency),
      }).format(value);
    }

    return result.value;
  };

  return { formatCurrency };
};
