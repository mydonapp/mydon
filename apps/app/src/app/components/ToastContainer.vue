<template>
  <div class="toast toast-top toast-end z-50">
    <TransitionGroup
      name="toast"
      tag="div"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="alert shadow-lg cursor-pointer max-w-md"
        :class="getToastClass(toast.type)"
        @click="removeToast(toast.id)"
      >
        <div class="flex items-center">
          <svg
            class="w-6 h-6 shrink-0"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              v-if="toast.type === 'success'"
              d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"
            />
            <path
              v-else-if="toast.type === 'error'"
              d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"
            />
            <path
              v-else-if="toast.type === 'warning'"
              d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z"
            />
            <path
              v-else
              d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"
            />
          </svg>
          <span class="text-sm font-medium">{{ toast.message }}</span>
        </div>
        <button
          class="btn btn-sm btn-circle btn-ghost ml-2"
          @click.stop="removeToast(toast.id)"
        >
          ✕
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '../composables/useToast';

const { toasts, removeToast } = useToast();

const getToastClass = (type: string) => {
  switch (type) {
    case 'success':
      return 'alert-success';
    case 'error':
      return 'alert-error';
    case 'warning':
      return 'alert-warning';
    case 'info':
    default:
      return 'alert-info';
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
