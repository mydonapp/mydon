<template>
  <div
    class="text-white sticky xl:top-0 top-18.25 z-10 xl:z-50 overflow-hidden border-b border-primary -ml-0.25"
    style="
      background: linear-gradient(
        135deg,
        var(--color-background-secondary) 0%,
        var(--color-background-tertiary) 50%,
        var(--color-background-elevated) 100%
      );
    "
  >
    <!-- Background Pattern -->
    <div
      class="absolute inset-0"
      style="
        background: linear-gradient(
          135deg,
          var(--color-primary-600) 0%,
          transparent 100%
        );
        opacity: 0.15;
      "
    ></div>
    <div
      class="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl transform translate-x-32 -translate-y-32"
      style="background-color: var(--color-primary-500); opacity: 0.08"
    ></div>
    <div
      class="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-2xl transform -translate-x-16 translate-y-16"
      style="background-color: var(--color-primary-600); opacity: 0.08"
    ></div>

    <div class="container mx-auto px-4 sm:px-6 py-4 sm:py-6 relative z-10">
      <div class="flex items-center justify-between gap-4">
        <div class="min-w-0 flex-1">
          <h1 class="text-2xl font-bold truncate drop-shadow-sm">
            {{ title }}
          </h1>
          <p
            v-if="subtitle"
            class="text-white/90 text-sm truncate drop-shadow-sm"
          >
            {{ subtitle }}
          </p>
        </div>
        <div
          v-if="$slots.extra"
          class="flex-shrink-0"
        >
          <slot name="extra"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string;
  subtitle?: string;
}

defineProps<Props>();
</script>
