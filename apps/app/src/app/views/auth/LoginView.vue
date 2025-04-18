<template>
  <div
    class="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8"
  >
    <div class="sm:mx-auto sm:w-full sm:max-w-sm">
      <h2 class="mt-10 text-center text-2xl font-bold leading-9 tracking-tight">
        Login to your account
      </h2>
    </div>
    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Email</legend>
        <input
          type="email"
          placeholder="Email"
          class="input w-full"
          v-model="loginForm.email"
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
        <legend class="fieldset-legend">Password</legend>
        <input
          type="password"
          placeholder="Password"
          v-model="loginForm.password"
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
        <button class="btn btn-primary w-full mt-6" @click="authenticate">
          Login
        </button>
      </div>
    </div>
    <p class="mt-10 text-center text-sm">
      Not a member?
      {{ ' ' }}
      <router-link :to="{ name: 'SignUp', query: route.query }" class="link"
        >Create an account now</router-link
      >
    </p>
  </div>
</template>

<script setup lang="ts">
import { useAsyncValidator } from '@vueuse/integrations/useAsyncValidator';
import type { Rules } from 'async-validator';
import { onBeforeMount, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth } from '../../composables/useAuth';

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
