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

      <!-- Signup Card -->
      <div class="bg-secondary rounded-xl shadow-2xl border-0 overflow-hidden">
        <div class="p-8">
          <div class="text-center mb-6">
            <h2 class="text-2xl font-bold text-white mb-2">
              {{ t('views.signup.title') }}
            </h2>
            <p class="text-gray-400 text-sm">
              Create your account to start tracking your finances
            </p>
          </div>

          <!-- Error Messages -->
          <div
            v-if="signupError"
            class="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3 mb-4"
          >
            <RiErrorWarningLine class="w-5 h-5 text-red-400" />
            <span>{{ signupError }}</span>
          </div>

          <form
            class="space-y-4"
            @submit.prevent="signup"
          >
            <!-- Name Field -->
            <BaseInput
              v-model="name"
              type="text"
              :label="t('views.signup.signupForm.name.label')"
              :placeholder="t('views.signup.signupForm.name.placeholder')"
              :error="!name && formSubmitted ? 'Name is required' : undefined"
              autocomplete="name"
              required
              class="bg-primary border-gray-600 text-white placeholder-gray-400"
            >
              <template #leftIcon>
                <RiUserLine class="w-5 h-5" />
              </template>
            </BaseInput>

            <!-- Email Field -->
            <BaseInput
              v-model="email"
              type="email"
              :label="t('views.signup.signupForm.email.label')"
              :placeholder="t('views.signup.signupForm.email.placeholder')"
              :error="
                (!email || !isValidEmail) && formSubmitted
                  ? !email
                    ? 'Email is required'
                    : 'Please enter a valid email address'
                  : undefined
              "
              autocomplete="username"
              required
              class="bg-primary border-gray-600 text-white placeholder-gray-400"
            >
              <template #leftIcon>
                <RiMailLine class="w-5 h-5" />
              </template>
            </BaseInput>

            <!-- Password Field -->
            <BaseInput
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              :label="t('views.signup.signupForm.password.label')"
              :placeholder="t('views.signup.signupForm.password.placeholder')"
              :error="
                (!password || !isValidPassword) && formSubmitted
                  ? !password
                    ? 'Password is required'
                    : 'Password must be at least 6 characters long'
                  : undefined
              "
              :help-text="
                password && password.length < 6 && !formSubmitted
                  ? 'Password should be at least 6 characters'
                  : undefined
              "
              autocomplete="new-password"
              required
              class="bg-primary border-gray-600 text-white placeholder-gray-400"
            >
              <template #leftIcon>
                <RiLockLine class="w-5 h-5" />
              </template>
              <template #rightIcon>
                <BaseButton
                  variant="ghost"
                  size="sm"
                  class="text-gray-400 hover:text-white transition-colors duration-200 p-1"
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

            <!-- Signup Button -->
            <BaseButton
              type="submit"
              variant="success"
              size="lg"
              :loading="isLoading"
              :disabled="isLoading || !isFormValid"
              shadow
              block
              class="mt-6"
            >
              <template #icon>
                <RiAddLine
                  v-if="!isLoading"
                  class="w-5 h-5"
                />
              </template>
              {{ t('views.signup.signupForm.submit.label') }}
            </BaseButton>
          </form>

          <!-- Terms and Privacy -->
          <div class="text-center mt-4">
            <p class="text-xs text-gray-400">
              By creating an account, you agree to our Terms of Service and
              Privacy Policy
            </p>
          </div>

          <!-- Login Link -->
          <div class="mt-8">
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-700"></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-3 bg-secondary text-gray-500 text-xs">
                  {{ t('views.signup.loginPrompt.text') }}
                </span>
              </div>
            </div>
          </div>
          <BaseButton
            tag="router-link"
            :to="{ name: 'Login', query: route.query }"
            variant="link"
            size="sm"
            block
            class="mt-4"
          >
            {{ t('views.signup.loginPrompt.link') }}
          </BaseButton>
        </div>
      </div>

      <!-- Footer -->
      <div class="text-center mt-8">
        <p class="text-gray-400 text-xs">
          © 2025 myDon Financial Tracker. Start your financial journey today.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeMount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  RiStarFill,
  RiErrorWarningLine,
  RiUserLine,
  RiMailLine,
  RiLockLine,
  RiEyeOffLine,
  RiEyeLine,
  RiAddLine,
} from '@remixicon/vue';
import { useAuth } from '../../composables/useAuth';
import { useLanguage } from '../../composables/useLanguage';
import BaseButton from '../../components/BaseButton.vue';
import BaseInput from '../../components/BaseInput.vue';

const { t } = useLanguage();

const { signup: signupMutation, isAuthenticated } = useAuth();

const router = useRouter();
const route = useRoute();

const name = ref('');
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const isLoading = ref(false);
const formSubmitted = ref(false);
const signupError = ref<string | undefined>(undefined);

// Validation computed properties
const isValidEmail = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.value);
});

const isValidPassword = computed(() => {
  return password.value.length >= 6;
});

const isFormValid = computed(() => {
  return (
    name.value.trim() !== '' &&
    email.value.trim() !== '' &&
    isValidEmail.value &&
    isValidPassword.value
  );
});

// Watch for form changes to clear errors
watch([name, email, password], () => {
  if (signupError.value) {
    signupError.value = undefined;
  }
});

// Check route params
if (route.query.email) {
  email.value = route.query.email as string;
}

const signup = async () => {
  formSubmitted.value = true;

  if (!isFormValid.value) {
    return;
  }

  isLoading.value = true;
  signupError.value = undefined;

  try {
    await signupMutation({
      email: email.value.trim(),
      name: name.value.trim(),
      password: password.value,
    });

    // Success - user will be redirected by the auth system
  } catch (error: any) {
    console.error('Signup error:', error);
    signupError.value =
      error?.message || 'An error occurred during signup. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

onBeforeMount(async () => {
  if (isAuthenticated()) {
    await router.push({ name: 'Dashboard' });
  }
});
</script>
