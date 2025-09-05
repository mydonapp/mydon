<template>
  <div class="w-full">
    <!-- Label -->
    <label
      v-if="label"
      :for="inputId"
      class="block mb-2"
    >
      <span class="text-sm font-medium text-secondary">
        {{ label }}
        <span
          v-if="required"
          class="text-danger ml-1"
          >*</span
        >
      </span>
    </label>

    <!-- File Input Container -->
    <div class="relative">
      <input
        :id="inputId"
        type="file"
        :class="[inputClasses, $attrs.class]"
        :accept="accept"
        :multiple="multiple"
        :required="required"
        :disabled="disabled"
        v-bind="inputAttrs"
        @change="handleFileChange"
        @focus="$emit('focus', $event)"
        @blur="$emit('blur', $event)"
      />
    </div>

    <!-- Help Text -->
    <div
      v-if="hint && !error"
      class="mt-1"
    >
      <span class="text-xs text-muted">{{ hint }}</span>
    </div>

    <!-- Error Message -->
    <div
      v-if="error"
      class="mt-1"
    >
      <span class="text-xs text-red-500">{{ error }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useAttrs, useId } from 'vue';

interface Props {
  label?: string;
  accept?: string;
  multiple?: boolean;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'bordered' | 'ghost' | 'primary' | 'default';
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  accept: '',
  error: '',
  hint: '',
  multiple: false,
  required: false,
  disabled: false,
  size: 'md',
  variant: 'default',
});

const emit = defineEmits<{
  change: [files: FileList | null];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
}>();

const attrs = useAttrs();

// Generate unique ID for accessibility (same as BaseInput)
const inputId = useId();

// Computed classes for the file input (matches BaseInput structure)
const inputClasses = computed(() => {
  const classes = [
    'w-full',
    'rounded-md',
    'border',
    'transition-colors',
    'duration-200',
    'bg-primary',
    'focus:outline-none',
    // File input specific styles for proper alignment
    'file:mr-4',
    'file:rounded-md',
    'file:border-0',
    'file:cursor-pointer',
    'file:bg-primary',
    'file:text-white',
    'file:font-medium',
    'hover:file:bg-primary-700',
  ];

  // Size classes
  switch (props.size) {
    case 'xs':
      classes.push(
        'h-8',
        'px-3',
        'text-xs',
        'file:py-1.5',
        'file:px-2',
        'file:text-xs',
      );
      break;
    case 'sm':
      classes.push(
        'h-10',
        'px-3',
        'text-sm',
        'file:py-2',
        'file:px-3',
        'file:text-sm',
      );
      break;
    case 'lg':
      classes.push(
        'h-14',
        'px-4',
        'text-lg',
        'file:py-3.5',
        'file:px-4',
        'file:text-base',
      );
      break;
    default:
      classes.push(
        'h-12',
        'px-4',
        'text-base',
        'file:py-3',
        'file:px-4',
        'file:text-sm',
      );
  }

  // Variant classes - exactly matching BaseSelect for bordered variant
  switch (props.variant) {
    case 'bordered':
      classes.push(
        'border-border-primary',
        'focus:border-primary-600',
        'focus:ring-2',
        'focus:ring-primary-200',
      );

      break;
    case 'ghost':
      classes.push(
        'border-transparent',
        'bg-transparent',
        'text-text-primary',
        'focus:bg-background-secondary',
        'focus:border-border-primary',
      );
      break;
    case 'primary':
      classes.push(
        'bg-background-primary',
        'border-primary-500',
        'text-text-primary',
        'focus:border-primary-600',
        'focus:ring-2',
        'focus:ring-primary-200',
      );
      break;
    default:
      // Use CSS variables for consistent styling
      classes.push(
        'bg-background-primary',
        'border-border-primary',
        'text-text-primary',
        'focus:border-primary-600',
        'focus:ring-2',
        'focus:ring-primary-200',
      );
  }

  // State classes
  if (props.error) {
    classes.push(
      'border-red-500',
      'focus:border-red-500',
      'focus:ring-red-200',
    );
  }

  if (props.disabled) {
    classes.push(
      'bg-gray-100',
      'text-gray-400',
      'cursor-not-allowed',
      'file:bg-gray-400',
      'file:cursor-not-allowed',
    );
  }

  return classes.join(' ');
});

// Filter out class and id from attrs to avoid conflicts
const inputAttrs = computed(() => {
  const { class: _, id: __, ...rest } = attrs;
  return rest;
});

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('change', target.files);
};
</script>
