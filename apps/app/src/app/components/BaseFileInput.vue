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
      <input
        :id="inputId"
        type="file"
        :class="[
          'w-full px-3 py-2 bg-primary border rounded-lg text-white',
          'focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent',
          'transition-colors duration-200',
          'file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0',
          'file:text-sm file:font-medium file:bg-accent file:text-white',
          'hover:file:bg-accent/80 file:cursor-pointer',
          error ? 'border-red-500 focus:ring-red-500' : 'border-gray-600',
          $attrs.class,
        ]"
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
  label?: string;
  accept?: string;
  multiple?: boolean;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  accept: '',
  error: '',
  hint: '',
  multiple: false,
  required: false,
  disabled: false,
});

const emit = defineEmits<{
  change: [files: FileList | null];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
}>();

const attrs = useAttrs();

// Generate a unique ID for the input
const inputId = computed(
  () =>
    (attrs.id as string) ||
    `file-input-${Math.random().toString(36).substr(2, 9)}`,
);

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
