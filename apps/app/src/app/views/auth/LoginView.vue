<template>
  <div
    class="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center p-4"
  >
    <div class="w-full max-w-md">
      <!-- Brand Section -->
      <div class="text-center mb-8">
        <div
          class="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4"
        >
          <RiStarFill class="w-8 h-8 text-primary" />
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">myDon</h1>
        <p class="text-white/80 text-sm">{{ t('app.subtitle') }}</p>
      </div>

      <!-- Login Card -->
      <div class="bg-secondary rounded-xl shadow-2xl border-0 overflow-hidden">
        <div class="p-8">
          <div class="text-center mb-6">
            <h2 class="text-2xl font-bold text-white mb-2">
              {{ t('views.login.title') }}
            </h2>
            <p class="text-gray-400 text-sm">
              Enter your credentials to access your account
            </p>
          </div>

          <!-- Error Messages -->
          <div
            v-if="wrongPassword"
            class="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3 mb-4"
          >
            <RiErrorWarningLine class="w-5 h-5 text-red-400" />
            <span>{{ wrongPassword }}</span>
          </div>

          <form
            class="space-y-4"
            @submit.prevent="authenticate"
          >
            <!-- Email Field -->
            <BaseInput
              v-model="loginForm.email"
              type="email"
              :label="t('views.login.loginForm.email.label')"
              :placeholder="t('views.login.loginForm.email.placeholder')"
              :error="
                errorFields?.email ? errorFields.email[0].message : undefined
              "
              autocomplete="username"
              data-form-type="username,email"
              class="bg-primary border-gray-600 text-white placeholder-gray-400"
            >
              <template #leftIcon>
                <RiAtLine class="w-5 h-5" />
              </template>
            </BaseInput>

            <!-- Password Field -->
            <BaseInput
              v-model="loginForm.password"
              :type="showPassword ? 'text' : 'password'"
              :label="t('views.login.loginForm.password.label')"
              :placeholder="t('views.login.loginForm.password.placeholder')"
              :error="
                errorFields?.password
                  ? errorFields.password[0].message
                  : undefined
              "
              autocomplete="current-password"
              data-form-type="password"
              class="bg-primary border-gray-600 text-white placeholder-gray-400"
            >
              <template #leftIcon>
                <RiLockLine class="w-5 h-5" />
              </template>
              <template #rightIcon>
                <BaseButton
                  variant="borderless"
                  size="sm"
                  class="p-1"
                  @click="showPassword = !showPassword"
                >
                  <RiEyeOffLine
                    v-if="showPassword"
                    class="w-5 h-5"
                  />
                  <RiEyeLine
                    v-else
                    class="w-5 h-5"
                  />
                </BaseButton>
              </template>
            </BaseInput>

            <!-- Login Button -->
            <BaseButton
              type="submit"
              variant="primary"
              size="lg"
              :loading="isLoading"
              :disabled="isLoading || !pass"
              shadow
              block
              class="mt-6"
            >
              <template #icon>
                <RiCheckboxCircleLine
                  v-if="!isLoading"
                  class="w-5 h-5"
                />
              </template>
              {{ t('views.login.loginForm.submit.label') }}
            </BaseButton>
          </form>

          <!-- Sign Up Link -->
          <div class="mt-8">
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-700"></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-3 bg-secondary text-gray-500 text-xs">
                  {{ t('views.login.signupPrompt.text') }}
                </span>
              </div>
            </div>
          </div>
          <BaseButton
            tag="router-link"
            :to="{ name: 'SignUp', query: route.query }"
            variant="link"
            size="sm"
            block
            class="mt-4"
          >
            {{ t('views.login.signupPrompt.link') }}
          </BaseButton>
        </div>
      </div>

      <!-- Footer -->
      <div class="text-center mt-8">
        <p class="text-white/60 text-xs">
          © 2025 myDon Financial Tracker. Secure & Private.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAsyncValidator } from '@vueuse/integrations/useAsyncValidator';
import type { Rules } from 'async-validator';
import { onBeforeMount, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  RiStarFill,
  RiErrorWarningLine,
  RiAtLine,
  RiLockLine,
  RiEyeOffLine,
  RiEyeLine,
  RiCheckboxCircleLine,
} from '@remixicon/vue';
import { useAuth } from '../../composables/useAuth';
import { useLanguage } from '../../composables/useLanguage';
import BaseButton from '../../components/BaseButton.vue';
import BaseInput from '../../components/BaseInput.vue';

const { t } = useLanguage();

const { login, isAuthenticated } = useAuth();

const router = useRouter();
const route = useRoute();

const loginForm = reactive({ email: '', password: '' });
const loginFormSchema: Rules = {
  email: {
    type: 'email',
    required: true,
    message: 'Please enter a valid email address',
  },
  password: {
    type: 'string',
    required: true,
    message: 'Password is required',
  },
};

const { pass, errorFields } = useAsyncValidator(loginForm, loginFormSchema, {
  immediate: false,
});

const wrongPassword = ref<string | undefined>(undefined);
const showPassword = ref(false);
const isLoading = ref(false);
const formTouched = ref(false);

watch(
  () => loginForm,
  () => {
    formTouched.value = true;
    wrongPassword.value = undefined;
  },
  { deep: true },
);

if (route.query.email) {
  loginForm.email = route.query.email as string;
}

const authenticate = async () => {
  if (pass.value) {
    isLoading.value = true;
    wrongPassword.value = undefined;

    try {
      const { success, errorMessage } = await login(
        loginForm.email,
        loginForm.password,
        route.query.next as string,
      );
      if (!success) {
        wrongPassword.value = errorMessage;
      }
    } catch (error) {
      wrongPassword.value = 'An unexpected error occurred. Please try again.';
    } finally {
      isLoading.value = false;
    }
  }
};

onBeforeMount(async () => {
  if (isAuthenticated()) {
    if (route.query.next) {
      await router.push(route.query.next as string);
      return;
    }
    await router.push({ name: 'Dashboard' });
  }
});
</script>
