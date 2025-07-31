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
          <svg
            class="w-8 h-8 text-primary"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"
            />
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">myDon</h1>
        <p class="text-white/80 text-sm">{{ t('app.subtitle') }}</p>
      </div>

      <!-- Login Card -->
      <div class="card bg-base-100 shadow-2xl border-0">
        <div class="card-body p-8">
          <div class="text-center mb-6">
            <h2 class="text-2xl font-bold text-base-content mb-2">
              {{ t('views.login.title') }}
            </h2>
            <p class="text-base-content/60 text-sm">
              Enter your credentials to access your account
            </p>
          </div>

          <!-- Error Messages -->
          <div
            v-if="wrongPassword"
            class="alert alert-error mb-4"
          >
            <svg
              class="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z" />
            </svg>
            <span>{{ wrongPassword }}</span>
          </div>

          <form
            class="space-y-4"
            @submit.prevent="authenticate"
          >
            <!-- Email Field -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">{{
                  t('views.login.loginForm.email.label')
                }}</span>
              </label>
              <div class="relative">
                <input
                  v-model="loginForm.email"
                  type="email"
                  :placeholder="t('views.login.loginForm.email.placeholder')"
                  class="input input-bordered w-full pl-12 focus:input-primary"
                  :class="{ 'input-error': errorFields?.email }"
                  autocomplete="username"
                  data-form-type="username,email"
                />
                <svg
                  class="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-base-content/40"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12,15C12.81,15 13.5,14.7 14.11,14.11C14.7,13.5 15,12.81 15,12C15,11.19 14.7,10.5 14.11,9.89C13.5,9.3 12.81,9 12,9C11.19,9 10.5,9.3 9.89,9.89C9.3,10.5 9,11.19 9,12C9,12.81 9.3,13.5 9.89,14.11C10.5,14.7 11.19,15 12,15M12,2C14.75,2 17.1,3 19.05,4.95C21,6.9 22,9.25 22,12V13.45C22,14.45 21.65,15.3 21,16C20.3,16.67 19.5,17 18.5,17C17.3,17 16.31,16.5 15.56,15.5C14.56,16.5 13.38,17 12,17C10.63,17 9.45,16.5 8.46,15.54C7.5,14.55 7,13.38 7,12C7,10.63 7.5,9.45 8.46,8.46C9.45,7.5 10.63,7 12,7C13.38,7 14.55,7.5 15.54,8.46C16.5,9.45 17,10.63 17,12V13.45C17,13.86 17.16,14.22 17.46,14.53C17.76,14.84 18.11,15 18.5,15C18.92,15 19.27,14.84 19.57,14.53C19.87,14.22 20,13.86 20,13.45V12C20,9.81 19.23,7.93 17.65,6.35C16.07,4.77 14.19,4 12,4C9.81,4 7.93,4.77 6.35,6.35C4.77,7.93 4,9.81 4,12C4,14.19 4.77,16.07 6.35,17.65C7.93,19.23 9.81,20 12,20H16V22H12C9.25,22 6.9,21 4.95,19.05C3,17.1 2,14.75 2,12C2,9.25 3,6.9 4.95,4.95C6.9,3 9.25,2 12,2Z"
                  />
                </svg>
              </div>
              <label
                v-if="errorFields?.email"
                class="label"
              >
                <span class="label-text-alt text-error">{{
                  errorFields.email[0].message
                }}</span>
              </label>
            </div>

            <!-- Password Field -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">{{
                  t('views.login.loginForm.password.label')
                }}</span>
              </label>
              <div class="relative">
                <input
                  v-model="loginForm.password"
                  :type="showPassword ? 'text' : 'password'"
                  :placeholder="t('views.login.loginForm.password.placeholder')"
                  class="input input-bordered w-full pl-12 pr-12 focus:input-primary"
                  :class="{ 'input-error': errorFields?.password }"
                  autocomplete="current-password"
                  data-form-type="password"
                />
                <svg
                  class="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-base-content/40"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"
                  />
                </svg>
                <button
                  type="button"
                  class="absolute right-4 top-1/2 transform -translate-y-1/2 text-base-content/40 hover:text-base-content"
                  @click="showPassword = !showPassword"
                >
                  <svg
                    v-if="showPassword"
                    class="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.09L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.76,7.13 11.37,7 12,7Z"
                    />
                  </svg>
                  <svg
                    v-else
                    class="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"
                    />
                  </svg>
                </button>
              </div>
              <label
                v-if="errorFields?.password"
                class="label"
              >
                <span class="label-text-alt text-error">{{
                  errorFields.password[0].message
                }}</span>
              </label>
            </div>

            <!-- Login Button -->
            <button
              type="submit"
              class="btn btn-primary w-full mt-6"
              :class="{ loading: isLoading }"
              :disabled="isLoading || !pass"
            >
              <svg
                v-if="!isLoading"
                class="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2Z"
                />
              </svg>
              {{ t('views.login.loginForm.submit.label') }}
            </button>
          </form>

          <!-- Sign Up Link -->
          <div class="divider mt-6">
            {{ t('views.login.signupPrompt.text') }}
          </div>
          <router-link
            :to="{ name: 'SignUp', query: route.query }"
            class="btn btn-outline btn-secondary w-full"
          >
            {{ t('views.login.signupPrompt.link') }}
          </router-link>
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
import { useAuth } from '../../composables/useAuth';
import { useLanguage } from '../../composables/useLanguage';

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
