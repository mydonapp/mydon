<template>
  <component
    :is="tag"
    :type="tag === 'button' ? type : undefined"
    :to="tag === 'router-link' ? to : undefined"
    :href="tag === 'a' ? href : undefined"
    :disabled="disabled"
    :class="buttonClasses"
    @click="handleClick"
  >
    <!-- Loading Spinner -->
    <div
      v-if="loading && !hideLoadingSpinner"
      class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
      :class="{ 'mr-2': $slots.default }"
    ></div>

    <!-- Icon Slot -->
    <slot
      v-if="!loading || hideLoadingSpinner"
      name="icon"
    ></slot>

    <!-- Default Content -->
    <slot v-if="$slots.default"></slot>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface BaseButtonProps {
  // Visual variants
  variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'danger'
    | 'warning'
    | 'info'
    | 'ghost'
    | 'link'
    | 'borderless';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';

  // Behavior
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  hideLoadingSpinner?: boolean;

  // Navigation (for router-link or a tag)
  tag?: 'button' | 'router-link' | 'a';
  to?: string | object;
  href?: string;

  // Layout
  block?: boolean; // full width
  rounded?: boolean;
  shadow?: boolean;

  // Custom classes
  class?: string;
}

const props = withDefaults(defineProps<BaseButtonProps>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  tag: 'button',
  disabled: false,
  loading: false,
  hideLoadingSpinner: false,
  block: false,
  rounded: true,
  shadow: false,
  to: undefined,
  href: undefined,
  class: undefined,
});

const emit = defineEmits<{
  click: [event: Event];
}>();

const handleClick = (event: Event) => {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
};

// Base classes for all buttons
const baseClasses = computed(() => [
  'inline-flex items-center justify-center gap-2',
  'font-medium transition-all duration-200',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  'hover:cursor-pointer',
  {
    'w-full': props.block,
    'rounded-lg': props.rounded,
    'animate-pulse': props.loading,
  },
]);

// Size variants
const sizeClasses = computed(() => {
  const sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-3 text-lg font-semibold',
    xl: 'px-8 py-4 text-xl font-semibold',
  };
  return sizes[props.size];
});

// Variant classes
const variantClasses = computed(() => {
  const variants = {
    primary: [
      'bg-gradient-to-r from-blue-600 to-blue-700',
      'hover:from-blue-700 hover:to-blue-800',
      'text-white',
      'focus:ring-blue-500',
      props.shadow ? 'shadow-lg hover:shadow-xl' : '',
    ],
    secondary: [
      'bg-gradient-to-r from-gray-600 to-gray-700',
      'hover:from-gray-700 hover:to-gray-800',
      'text-white',
      'focus:ring-gray-500',
      props.shadow ? 'shadow-lg hover:shadow-xl' : '',
    ],
    success: [
      'bg-gradient-to-r from-green-600 to-green-700',
      'hover:from-green-700 hover:to-green-800',
      'text-white',
      'focus:ring-green-500',
      props.shadow ? 'shadow-lg hover:shadow-xl' : '',
    ],
    danger: [
      'bg-gradient-to-r from-red-600 to-red-700',
      'hover:from-red-700 hover:to-red-800',
      'text-white',
      'focus:ring-red-500',
      props.shadow ? 'shadow-lg hover:shadow-xl' : '',
    ],
    warning: [
      'bg-gradient-to-r from-yellow-600 to-yellow-700',
      'hover:from-yellow-700 hover:to-yellow-800',
      'text-white',
      'focus:ring-yellow-500',
      props.shadow ? 'shadow-lg hover:shadow-xl' : '',
    ],
    info: [
      'bg-gradient-to-r from-cyan-600 to-cyan-700',
      'hover:from-cyan-700 hover:to-cyan-800',
      'text-white',
      'focus:ring-cyan-500',
      props.shadow ? 'shadow-lg hover:shadow-xl' : '',
    ],
    ghost: [
      'bg-transparent',
      'border border-gray-600',
      'text-gray-400 hover:text-white',
      'hover:bg-gray-700',
      'focus:ring-gray-500',
    ],
    link: [
      'bg-transparent',
      'text-gray-400 hover:text-gray-300',
      'underline decoration-1 underline-offset-2',
      'focus:ring-gray-500',
      'px-3 py-2', // Override default padding for links
    ],
    borderless: [
      'bg-transparent',
      'text-gray-400 hover:text-white',
      'hover:bg-transparent',
      'focus:ring-0 focus:ring-offset-0',
    ],
  };

  return variants[props.variant].filter(Boolean);
});

// Combine all classes
const buttonClasses = computed(() => [
  ...baseClasses.value,
  props.variant !== 'link' ? sizeClasses.value : '', // Links have their own padding
  ...variantClasses.value,
  props.class,
]);
</script>
