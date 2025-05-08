<template>
  <div
    class="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8"
  >
    <div class="sm:mx-auto sm:w-full sm:max-w-sm">
      <h2 class="mt-10 text-center text-2xl font-bold leading-9 tracking-tight">
        {{ t('views.signup.title') }}
      </h2>
    </div>
    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">
          {{ t('views.signup.signupForm.name.label') }}
        </legend>
        <input
          v-model="name"
          type="text"
          :placeholder="t('views.signup.signupForm.name.placeholder')"
          class="input w-full"
          autocomplete="name"
        />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">
          {{ t('views.signup.signupForm.email.label') }}
        </legend>
        <input
          v-model="email"
          type="email"
          :placeholder="t('views.signup.signupForm.email.placeholder')"
          class="input w-full"
          autocomplete="username"
        />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">
          {{ t('views.signup.signupForm.password.label') }}
        </legend>
        <input
          v-model="password"
          type="password"
          :placeholder="t('views.signup.signupForm.password.placeholder')"
          class="input w-full"
          autocomplete="new-password"
        />
      </fieldset>

      <div>
        <button
          class="btn btn-primary w-full mt-6"
          @click="signup"
        >
          {{ t('views.signup.signupForm.submit.label') }}
        </button>
      </div>
      <p class="mt-10 text-center text-sm">
        {{ t('views.signup.loginPrompt.text') }}
        {{ ' ' }}
        <router-link
          :to="{ name: 'Login', query: route.query }"
          class="link"
        >
          {{ t('views.signup.loginPrompt.link') }}
        </router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount, ref } from 'vue';
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

// Check Params
if (route.query.email) {
  email.value = route.query.email as string;
}

const signup = async () => {
  if (!email.value || !password.value || !name.value) {
    return;
  }
  try {
    await signupMutation({
      email: email.value,
      name: name.value,
      password: password.value,
    });
  } catch (error) {
    console.log(error);
  }
};

onBeforeMount(async () => {
  if (isAuthenticated()) {
    await router.push({ name: 'Dashboard' });
  }
});
</script>
