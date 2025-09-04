<template>
  <div class="w-full">
    <!-- Label -->
    <label
      v-if="label"
      :for="inputId"
      class="block mb-2"
    >
      <span class="text-sm font-medium text-gray-700">
        {{ label }}
        <span
          v-if="required"
          class="text-red-500 ml-1"
          >*</span
        >
      </span>
    </label>

    <!-- Input Container -->
    <div class="relative">
      <!-- Left Icon -->
      <div
        v-if="slots.leftIcon"
        class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10"
      >
        <slot name="leftIcon" />
      </div>

      <!-- Input Element -->
      <input
        :id="inputId"
        :type="type"
        :placeholder="placeholder"
        :value="modelValue"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :min="min"
        :max="max"
        :step="step"
        :pattern="pattern"
        :autocomplete="autocomplete"
        :class="[inputClasses, $attrs.class]"
        :data-form-type="dataFormType"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
        @keydown="handleKeydown"
      />

      <!-- Right Icon/Button -->
      <div
        v-if="slots.rightIcon"
        class="absolute right-3 top-1/2 transform -translate-y-1/2 z-10"
      >
        <slot name="rightIcon" />
      </div>
    </div>

    <!-- Help Text -->
    <div
      v-if="helpText && !error"
      class="mt-1"
    >
      <span class="text-xs text-gray-500">{{ helpText }}</span>
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

export interface BaseInputProps {
  modelValue?: string | number;
  type?:
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'tel'
    | 'url'
    | 'search'
    | 'date'
    | 'datetime-local'
    | 'time'
    | 'month'
    | 'week';
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  error?: string;
  helpText?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'bordered' | 'ghost' | 'primary';
  min?: string | number;
  max?: string | number;
  step?: string | number;
  pattern?: string;
  autocomplete?: string;
  dataFormType?: string;
}

export interface BaseInputEmits {
  (e: 'update:modelValue', value: string | number): void;
  (e: 'blur', event: FocusEvent): void;
  (e: 'focus', event: FocusEvent): void;
  (e: 'keydown', event: KeyboardEvent): void;
}

const props = withDefaults(defineProps<BaseInputProps>(), {
  type: 'text',
  size: 'md',
  variant: 'default',
  modelValue: '',
  label: undefined,
  placeholder: undefined,
  disabled: false,
  readonly: false,
  required: false,
  error: undefined,
  helpText: undefined,
  min: undefined,
  max: undefined,
  step: undefined,
  pattern: undefined,
  autocomplete: undefined,
  dataFormType: undefined,
});

const emit = defineEmits<BaseInputEmits>();

// Access slots
const slots = useSlots();

// Generate unique ID for accessibility
const inputId = useId();

// Computed classes for the input
const inputClasses = computed(() => {
  const classes = [
    'w-full',
    'rounded-md',
    'border',
    'transition-colors',
    'duration-200',
  ];

  // Size classes - using Tailwind sizing
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
    default:
      classes.push('h-12', 'px-4', 'text-base');
  }

  // Variant classes - using Tailwind colors
  switch (props.variant) {
    case 'bordered':
      classes.push(
        'border-gray-300',
        'focus:border-blue-500',
        'focus:ring-2',
        'focus:ring-blue-200',
      );
      break;
    case 'ghost':
      classes.push(
        'border-transparent',
        'bg-gray-50',
        'focus:bg-white',
        'focus:border-gray-300',
      );
      break;
    case 'primary':
      classes.push(
        'border-blue-500',
        'focus:border-blue-600',
        'focus:ring-2',
        'focus:ring-blue-200',
      );
      break;
    default:
      classes.push(
        'border-gray-300',
        'focus:border-blue-500',
        'focus:ring-2',
        'focus:ring-blue-200',
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

  // Icon padding that works reliably
  if (slots.leftIcon) {
    classes.push('pl-10'); // Standard left padding for icon space
  }

  if (slots.rightIcon) {
    classes.push('pr-10'); // Standard right padding for icon space
  }

  return classes.join(' ');
});

// Event handlers
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  let value: string | number = target.value;

  // Convert to number for numeric inputs
  if (props.type === 'number' && value !== '') {
    value = parseFloat(value);
  }

  emit('update:modelValue', value);
};

const handleBlur = (event: FocusEvent) => {
  emit('blur', event);
};

const handleFocus = (event: FocusEvent) => {
  emit('focus', event);
};

const handleKeydown = (event: KeyboardEvent) => {
  emit('keydown', event);
};
</script>

<style scoped>
/* Remove browser default input styling */
input {
  outline: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

/* Focus ring override for better control */
input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Error state focus */
input.border-red-500:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* Prevent icon text selection */
.pointer-events-none * {
  user-select: none;
}
</style>
