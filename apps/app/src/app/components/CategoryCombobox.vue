<template>
  <div>
    <label
      v-if="label"
      class="block text-sm font-medium text-secondary mb-1"
    >
      {{ label }}
      <span
        v-if="required"
        class="text-error ml-0.5"
      >*</span>
    </label>

    <div
      v-if="!showCreate"
      class="flex gap-2"
    >
      <select
        :value="modelValue"
        class="select select-bordered w-full"
        :required="required"
        @change="onSelect(($event.target as HTMLSelectElement).value)"
      >
        <option
          value=""
          disabled
        >
          {{ placeholder }}
        </option>
        <option
          v-for="cat in categories"
          :key="cat.id"
          :value="cat.id"
        >
          {{ cat.name }}
        </option>
        <option value="__create__">
          + {{ t('components.categoryCombobox.createNew') }}
        </option>
      </select>
    </div>

    <div
      v-else
      class="flex gap-2"
    >
      <input
        v-model="newCategoryName"
        type="text"
        class="input input-bordered w-full"
        :placeholder="t('components.categoryCombobox.newCategoryPlaceholder')"
        autofocus
        @keydown.enter.prevent="confirmCreate"
      />
      <button
        type="button"
        class="btn btn-primary btn-sm px-3"
        @click="confirmCreate"
      >
        {{ t('common.add') }}
      </button>
      <button
        type="button"
        class="btn btn-ghost btn-sm px-3"
        @click="cancelCreate"
      >
        {{ t('common.cancel') }}
      </button>
    </div>

    <p
      v-if="creating"
      class="text-xs text-muted mt-1"
    >
      {{ t('components.categoryCombobox.creating') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Category } from '../composables/useCategories/useCategories';
import { useLanguage } from '../composables/useLanguage';

const props = defineProps<{
  modelValue: string;
  categories: Category[];
  label?: string;
  placeholder?: string;
  required?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  create: [name: string];
}>();

const { t } = useLanguage();

const showCreate = ref(false);
const newCategoryName = ref('');
const creating = ref(false);

const onSelect = (value: string) => {
  if (value === '__create__') {
    showCreate.value = true;
    return;
  }
  emit('update:modelValue', value);
};

const confirmCreate = async () => {
  const name = newCategoryName.value.trim();
  if (!name) return;
  creating.value = true;
  emit('create', name);
  newCategoryName.value = '';
  showCreate.value = false;
  creating.value = false;
};

const cancelCreate = () => {
  showCreate.value = false;
  newCategoryName.value = '';
};
</script>
