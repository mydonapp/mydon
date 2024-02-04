import { useStorage } from '@vueuse/core';

const isPrivate = useStorage('don.privacy', false);

export const usePrivacy = () => {
  const togglePrivacy = () => {
    isPrivate.value = !isPrivate.value;
  };

  return {
    isPrivate,
    togglePrivacy,
  };
};
