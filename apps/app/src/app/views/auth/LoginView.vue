<template>
  <div
    class="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8"
  >
    <div class="sm:mx-auto sm:w-full sm:max-w-sm">
      <h2 class="mt-10 text-center text-2xl font-bold leading-9 tracking-tight">
        {{ t('views.login.title') }}
      </h2>
    </div>
    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">
          {{ t('views.login.loginForm.email.label') }}
        </legend>
        <input
          v-model="loginForm.email"
          type="email"
          :placeholder="t('views.login.loginForm.email.placeholder')"
          class="input w-full"
          autocomplete="username"
          data-form-type="username,email"
        />
        <span
          v-if="errorFields?.email && errorFields?.email[0].message"
          class="text-sm py-1 text-error"
        >
          {{ errorFields?.email && errorFields?.email[0].message }}
        </span>
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">
          {{ t('views.login.loginForm.password.label') }}
        </legend>
        <input
          v-model="loginForm.password"
          type="password"
          :placeholder="t('views.login.loginForm.password.label')"
          autocomplete="current-password"
          data-form-type="password"
          class="input w-full"
        />
        <span
          v-if="errorFields?.password && errorFields?.password[0].message"
          class="text-sm py-1 text-error"
        >
          {{ errorFields?.password && errorFields?.password[0].message }}
        </span>
      </fieldset>

      <div>
        <button
          class="btn btn-primary w-full mt-6"
          @click="authenticate"
        >
          {{ t('views.login.loginForm.submit.label') }}
        </button>
      </div>
    </div>
    <p class="mt-10 text-center text-sm">
      {{ t('views.login.signupPrompt.text') }}
      {{ ' ' }}
      <router-link
        :to="{ name: 'SignUp', query: route.query }"
        class="link"
      >
        {{ t('views.login.signupPrompt.link') }}
      </router-link>
    </p>
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

const formTouched = ref(false);

watch(
  () => loginForm,
  () => {
    formTouched.value = true;
  },
  { deep: true },
);

if (route.query.email) {
  loginForm.email = route.query.email as string;
}

const authenticate = async () => {
  if (pass.value) {
    const { success, errorMessage } = await login(
      loginForm.email,
      loginForm.password,
      route.query.next as string,
    );
    if (!success) {
      wrongPassword.value = errorMessage;
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
