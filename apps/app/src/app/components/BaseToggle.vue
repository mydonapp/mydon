<!--
BaseToggle Component

A reusable toggle/switch component with consistent styling and accessibility.

Props:
- modelValue: boolean - The current state of the toggle
- disabled: boolean - Whether the toggle is disabled
- size: 'sm' | 'md' | 'lg' - Size of the toggle
- variant: 'default' | 'success' | 'warning' | 'danger' | 'info' - Color variant

Events:
- update:modelValue: Emitted when toggle state changes

Usage:
<BaseToggle v-model="isPrivate" size="md" variant="warning" />
-->

<template>
  <label
    class="relative inline-flex items-center cursor-pointer"
    :class="{ 'opacity-50 cursor-not-allowed': disabled }"
  >
    <input
      :checked="modelValue"
      type="checkbox"
      class="sr-only peer"
      :disabled="disabled"
      @change="handleChange"
    />
    <div
      :class="[
        'relative rounded-full transition-colors duration-200 ease-in-out',
        sizeClasses,
        colorClasses,
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
      ]"
    >
      <div
        :class="[
          'absolute bg-white rounded-full transition-transform duration-200 ease-in-out',
          knobClasses,
          modelValue ? transformClasses : 'translate-x-0',
        ]"
      ></div>
    </div>
  </label>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  modelValue: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

interface Emits {
  'update:modelValue': [value: boolean];
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  size: 'md',
  variant: 'default',
});

const emit = defineEmits<Emits>();

const handleChange = (event: Event) => {
  if (props.disabled) return;
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.checked);
};

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'w-8 h-5';
    case 'md':
      return 'w-11 h-6';
    case 'lg':
      return 'w-14 h-8';
    default:
      return 'w-11 h-6';
  }
});

const knobClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'top-0.5 left-0.5 w-4 h-4';
    case 'md':
      return 'top-0.5 left-0.5 w-5 h-5';
    case 'lg':
      return 'top-1 left-1 w-6 h-6';
    default:
      return 'top-0.5 left-0.5 w-5 h-5';
  }
});

const transformClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'translate-x-3';
    case 'md':
      return 'translate-x-5';
    case 'lg':
      return 'translate-x-6';
    default:
      return 'translate-x-5';
  }
});

const colorClasses = computed(() => {
  const baseClasses = props.modelValue ? 'shadow-sm' : 'shadow-inner';

  if (props.disabled) {
    return `${baseClasses} ${props.modelValue ? 'bg-gray-400' : 'bg-gray-300'}`;
  }

  switch (props.variant) {
    case 'success':
      return `${baseClasses} ${props.modelValue ? 'bg-success' : 'bg-gray-300 dark:bg-gray-600'}`;
    case 'warning':
      return `${baseClasses} ${props.modelValue ? 'bg-warning' : 'bg-gray-300 dark:bg-gray-600'}`;
    case 'danger':
      return `${baseClasses} ${props.modelValue ? 'bg-error' : 'bg-gray-300 dark:bg-gray-600'}`;
    case 'info':
      return `${baseClasses} ${props.modelValue ? 'bg-info' : 'bg-gray-300 dark:bg-gray-600'}`;
    default:
      return `${baseClasses} ${props.modelValue ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`;
  }
});
</script>
