<template>
  <div class="fixed top-4 right-4 z-50 space-y-2">
    <TransitionGroup
      name="toast"
      tag="div"
      class="space-y-2"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="alert shadow-lg cursor-pointer max-w-md rounded-lg border"
        :class="getToastClass(toast.type)"
        @click="removeToast(toast.id)"
      >
        <div class="flex items-center">
          <RiCheckLine
            v-if="toast.type === 'success'"
            class="w-6 h-6 shrink-0"
          />
          <RiCloseLine
            v-else-if="toast.type === 'error'"
            class="w-6 h-6 shrink-0"
          />
          <RiErrorWarningLine
            v-else-if="toast.type === 'warning'"
            class="w-6 h-6 shrink-0"
          />
          <RiInformationLine
            v-else
            class="w-6 h-6 shrink-0"
          />
          <span class="text-sm font-medium">{{ toast.message }}</span>
        </div>
        <BaseButton
          variant="ghost"
          size="sm"
          class="w-6 h-6 rounded-full flex items-center justify-center ml-2 hover:bg-white/10 p-0"
          @click.stop="removeToast(toast.id)"
        >
          <RiCloseLine class="w-4 h-4" />
        </BaseButton>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import {
  RiCheckLine,
  RiCloseLine,
  RiErrorWarningLine,
  RiInformationLine,
} from '@remixicon/vue';
import BaseButton from './BaseButton.vue';
import { useToast } from '../composables/useToast';

const { toasts, removeToast } = useToast();

const getToastClass = (type: string) => {
  switch (type) {
    case 'success':
      return 'bg-success text-white border-success';
    case 'error':
      return 'bg-error text-white border-error';
    case 'warning':
      return 'bg-warning text-black border-warning';
    case 'info':
    default:
      return 'bg-info text-white border-info';
  }
};
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
