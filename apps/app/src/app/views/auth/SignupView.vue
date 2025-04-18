<template>
  <div
    class="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8"
  >
    <div class="sm:mx-auto sm:w-full sm:max-w-sm">
      <h2 class="mt-10 text-center text-2xl font-bold leading-9 tracking-tight">
        Signup to your account
      </h2>
    </div>
    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Name</legend>
        <input
          type="text"
          placeholder="Name"
          class="input w-full"
          v-model="name"
          autocomplete="name"
        />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Email</legend>
        <input
          type="email"
          placeholder="Email"
          class="input w-full"
          v-model="email"
          autocomplete="username"
        />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Password</legend>
        <input
          type="password"
          placeholder="Password"
          class="input w-full"
          v-model="password"
          autocomplete="new-password"
        />
      </fieldset>

      <div>
        <button class="btn btn-primary w-full mt-6" @click="signup">
          Create Account
        </button>
      </div>
      <p class="mt-10 text-center text-sm">
        Already a member?
        {{ ' ' }}
        <router-link :to="{ name: 'Login', query: route.query }" class="link"
          >Login now</router-link
        >
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount, ref } from 'vue';
import { useAuth } from '../../composables/useAuth';
import { useRoute, useRouter } from 'vue-router';

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
