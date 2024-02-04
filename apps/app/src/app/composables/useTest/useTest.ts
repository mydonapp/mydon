import { ref, watchEffect } from 'vue';
import { usePrivacy } from '../usePrivacy';

export const useTest = () => {
  const test = ref('');
  const { isPrivate } = usePrivacy();

  console.log('a', isPrivate.value);

  const format = () => {
    if (isPrivate.value) {
      test.value = 'b';
    } else {
      test.value = 'a';
    }
  };

  watchEffect(() => {
    console.log('b', isPrivate);
    format();
  });

  return {
    test,
  };
};
