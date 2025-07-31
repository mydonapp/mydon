<template>
  <div
    class="min-h-screen bg-gradient-to-br from-secondary via-accent to-primary flex items-center justify-center p-4"
  >
    <div class="w-full max-w-md">
      <!-- Brand Section -->
      <div class="text-center mb-8">
        <div
          class="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4"
        >
          <svg
            class="w-8 h-8 text-secondary"
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

      <!-- Signup Card -->
      <div class="card bg-base-100 shadow-2xl border-0">
        <div class="card-body p-8">
          <div class="text-center mb-6">
            <h2 class="text-2xl font-bold text-base-content mb-2">
              {{ t('views.signup.title') }}
            </h2>
            <p class="text-base-content/60 text-sm">
              Create your account to start tracking your finances
            </p>
          </div>

          <!-- Error Messages -->
          <div
            v-if="signupError"
            class="alert alert-error mb-4"
          >
            <svg
              class="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z" />
            </svg>
            <span>{{ signupError }}</span>
          </div>

          <form
            class="space-y-4"
            @submit.prevent="signup"
          >
            <!-- Name Field -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">{{
                  t('views.signup.signupForm.name.label')
                }}</span>
              </label>
              <div class="relative">
                <input
                  v-model="name"
                  type="text"
                  :placeholder="t('views.signup.signupForm.name.placeholder')"
                  class="input input-bordered w-full pl-12 focus:input-secondary"
                  :class="{ 'input-error': !name && formSubmitted }"
                  autocomplete="name"
                  required
                />
                <svg
                  class="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-base-content/40"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"
                  />
                </svg>
              </div>
              <label
                v-if="!name && formSubmitted"
                class="label"
              >
                <span class="label-text-alt text-error">Name is required</span>
              </label>
            </div>

            <!-- Email Field -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">{{
                  t('views.signup.signupForm.email.label')
                }}</span>
              </label>
              <div class="relative">
                <input
                  v-model="email"
                  type="email"
                  :placeholder="t('views.signup.signupForm.email.placeholder')"
                  class="input input-bordered w-full pl-12 focus:input-secondary"
                  :class="{
                    'input-error': (!email || !isValidEmail) && formSubmitted,
                  }"
                  autocomplete="username"
                  required
                />
                <svg
                  class="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-base-content/40"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z"
                  />
                </svg>
              </div>
              <label
                v-if="(!email || !isValidEmail) && formSubmitted"
                class="label"
              >
                <span class="label-text-alt text-error">
                  {{
                    !email
                      ? 'Email is required'
                      : 'Please enter a valid email address'
                  }}
                </span>
              </label>
            </div>

            <!-- Password Field -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">{{
                  t('views.signup.signupForm.password.label')
                }}</span>
              </label>
              <div class="relative">
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  :placeholder="
                    t('views.signup.signupForm.password.placeholder')
                  "
                  class="input input-bordered w-full pl-12 pr-12 focus:input-secondary"
                  :class="{
                    'input-error':
                      (!password || !isValidPassword) && formSubmitted,
                  }"
                  autocomplete="new-password"
                  required
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
                v-if="(!password || !isValidPassword) && formSubmitted"
                class="label"
              >
                <span class="label-text-alt text-error">
                  {{
                    !password
                      ? 'Password is required'
                      : 'Password must be at least 6 characters long'
                  }}
                </span>
              </label>
              <label
                v-else-if="password && password.length < 6"
                class="label"
              >
                <span class="label-text-alt text-warning"
                  >Password should be at least 6 characters</span
                >
              </label>
            </div>

            <!-- Signup Button -->
            <button
              type="submit"
              class="btn btn-secondary w-full mt-6"
              :class="{ loading: isLoading }"
              :disabled="isLoading || !isFormValid"
            >
              <svg
                v-if="!isLoading"
                class="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
              </svg>
              {{ t('views.signup.signupForm.submit.label') }}
            </button>
          </form>

          <!-- Terms and Privacy -->
          <div class="text-center mt-4">
            <p class="text-xs text-base-content/60">
              By creating an account, you agree to our Terms of Service and
              Privacy Policy
            </p>
          </div>

          <!-- Login Link -->
          <div class="divider mt-6">
            {{ t('views.signup.loginPrompt.text') }}
          </div>
          <router-link
            :to="{ name: 'Login', query: route.query }"
            class="btn btn-outline btn-primary w-full"
          >
            {{ t('views.signup.loginPrompt.link') }}
          </router-link>
        </div>
      </div>

      <!-- Footer -->
      <div class="text-center mt-8">
        <p class="text-white/60 text-xs">
          © 2025 myDon Financial Tracker. Start your financial journey today.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeMount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth } from '../../composables/useAuth';
import { useLanguage } from '../../composables/useLanguage';

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
