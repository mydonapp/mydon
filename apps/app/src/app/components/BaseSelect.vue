<!--
BaseSelect Component

A reusable select/dropdown component with consistent styling and accessibility.

Props:
- modelValue: string | number - The current selected value
- options: Array<SelectOption> - Array of options to display
- label: string - Label for the select field
- placeholder: string - Placeholder text for empty state
- disabled: boolean - Whether the select is disabled
- required: boolean - Whether the select is required
- error: string - Error message to display
- helpText: string - Help text to display
- size: 'xs' | 'sm' | 'md' | 'lg' - Size of the select
- variant: 'default' | 'bordered' | 'ghost' | 'primary' - Visual variant
- multiple: boolean - Whether multiple selection is allowed

Events:
- update:modelValue: Emitted when selection changes

Usage:
<BaseSelect 
  v-model="selectedValue" 
  :options="options"
  label="Select an option"
  placeholder="Choose..."
  required
/>
-->

<template>
  <div class="w-full">
    <!-- Label -->
    <label
      v-if="label"
      :for="selectId"
      class="block mb-2"
    >
      <span class="text-sm font-medium text-secondary">
        {{ label }}
        <span
          v-if="required"
          class="text-red-500 ml-1"
          >*</span
        >
      </span>
    </label>

    <!-- Select Container -->
    <div class="relative">
      <!-- Left Icon -->
      <div
        v-if="slots.leftIcon"
        class="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted pointer-events-none z-10"
      >
        <slot name="leftIcon" />
      </div>

      <!-- Select Element -->
      <select
        :id="selectId"
        :value="modelValue"
        :disabled="disabled"
        :required="required"
        :multiple="multiple"
        :class="[selectClasses, $attrs.class]"
        @change="handleChange"
        @blur="handleBlur"
        @focus="handleFocus"
      >
        <!-- Placeholder option -->
        <option
          v-if="placeholder && !multiple"
          value=""
          disabled
          :hidden="!!modelValue"
        >
          {{ placeholder }}
        </option>

        <!-- Options from array prop -->
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
          :disabled="option.disabled"
        >
          {{ option.label }}
        </option>

        <!-- Slot for custom options -->
        <slot name="options"></slot>
      </select>

      <!-- Right Icon (Chevron) -->
      <div
        v-if="!multiple"
        class="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
      >
        <svg
          class="w-4 h-4 text-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>

    <!-- Help Text -->
    <div
      v-if="helpText && !error"
      class="mt-1"
    >
      <span class="text-xs text-muted">{{ helpText }}</span>
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
import { computed, useId, useSlots } from 'vue';

// Prevent attribute inheritance on root element
defineOptions({
  inheritAttrs: false,
});

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface BaseSelectProps {
  modelValue?: string | number | string[] | number[];
  options?: SelectOption[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helpText?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'bordered' | 'ghost' | 'primary';
  multiple?: boolean;
}

export interface BaseSelectEmits {
  (e: 'update:modelValue', value: string | number | string[] | number[]): void;
  (e: 'blur', event: FocusEvent): void;
  (e: 'focus', event: FocusEvent): void;
}

const props = withDefaults(defineProps<BaseSelectProps>(), {
  size: 'md',
  variant: 'default',
  modelValue: '',
  options: () => [],
  label: undefined,
  placeholder: undefined,
  disabled: false,
  required: false,
  error: undefined,
  helpText: undefined,
  multiple: false,
});

const emit = defineEmits<BaseSelectEmits>();

// Access slots
const slots = useSlots();

// Generate unique ID for accessibility
const selectId = useId();

// Handle select change
const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;

  if (props.multiple) {
    const selectedValues = Array.from(target.selectedOptions).map(
      (option) => option.value,
    );
    emit('update:modelValue', selectedValues);
  } else {
    emit('update:modelValue', target.value);
  }
};

// Handle blur event
const handleBlur = (event: FocusEvent) => {
  emit('blur', event);
};

// Handle focus event
const handleFocus = (event: FocusEvent) => {
  emit('focus', event);
};

// Computed classes for the select element
const selectClasses = computed(() => {
  const classes = [
    'select',
    'w-full',
    'appearance-none',
    'transition-all',
    'duration-200',
    'rounded-md',
    'border',
  ];

  // Size classes - matching BaseInput heights
  switch (props.size) {
    case 'xs':
      classes.push('h-8', 'px-3', 'text-xs');
      break;
    case 'sm':
      classes.push('h-10', 'px-3', 'text-sm');
      break;
    case 'lg':
      classes.push('h-14', 'px-4', 'text-lg');
      break;
    default: // md
      classes.push('h-12', 'px-4', 'text-base');
  }

  // Variant classes
  switch (props.variant) {
    case 'bordered':
      classes.push(
        'border-2',
        'border-border-primary',
        'focus:border-primary-600',
        'focus:ring-2',
        'focus:ring-primary-200',
      );
      break;
    case 'ghost':
      classes.push(
        'border-0',
        'bg-transparent',
        'focus:bg-background-secondary',
      );
      break;
    case 'primary':
      classes.push(
        'border-primary-500',
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
    classes.push('bg-gray-100', 'text-gray-400', 'cursor-not-allowed');
  }

  // Icon padding
  if (slots.leftIcon) {
    classes.push('pl-10');
  }

  if (!props.multiple) {
    classes.push('pr-10'); // Space for chevron icon
  }

  return classes.join(' ');
});
</script>

<style scoped>
/* Custom styles for better select appearance */
select {
  background-image: none; /* Remove default arrow in some browsers */
}

/* Firefox specific */
select {
  -moz-appearance: none;
  text-indent: 0.01px;
  text-overflow: '';
}

/* IE specific */
select::-ms-expand {
  display: none;
}
</style>
