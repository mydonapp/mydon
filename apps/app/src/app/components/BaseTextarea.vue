<template>
  <div class="space-y-2">
    <label
      v-if="label"
      :for="inputId"
      class="block text-sm font-medium text-gray-300"
    >
      {{ label }}
      <span
        v-if="required"
        class="text-red-400 ml-1"
        >*</span
      >
    </label>

    <div class="relative">
      <textarea
        :id="inputId"
        :value="modelValue"
        :class="[
          'w-full px-3 py-2 bg-primary border rounded-lg text-white placeholder-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent',
          'transition-colors duration-200 resize-none',
          error ? 'border-red-500 focus:ring-red-500' : 'border-gray-600',
          $attrs.class,
        ]"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :readonly="readonly"
        :rows="rows"
        v-bind="inputAttrs"
        @input="
          $emit(
            'update:modelValue',
            ($event.target as HTMLTextAreaElement).value,
          )
        "
        @focus="$emit('focus', $event)"
        @blur="$emit('blur', $event)"
      />
    </div>

    <div
      v-if="error || hint"
      class="text-sm"
    >
      <p
        v-if="error"
        class="text-red-400"
      >
        {{ error }}
      </p>
      <p
        v-else-if="hint"
        class="text-gray-400"
      >
        {{ hint }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue';

interface Props {
  modelValue?: string;
  label?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  rows?: number;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '',
  placeholder: '',
  error: '',
  hint: '',
  rows: 3,
});

defineEmits<{
  'update:modelValue': [value: string];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
}>();

const attrs = useAttrs();

// Generate a unique ID for the textarea
const inputId = computed(
  () =>
    (attrs.id as string) ||
    `textarea-${Math.random().toString(36).substr(2, 9)}`,
);

// Filter out class and id from attrs to avoid conflicts
const inputAttrs = computed(() => {
  const { class: _, id: __, ...rest } = attrs;
  return rest;
});
</script>
