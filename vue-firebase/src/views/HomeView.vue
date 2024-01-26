<script setup>
import router from '@/router';
import { FirestoreHandler }  from '../utils/firebase/init';
import { onMounted, ref, watch } from 'vue';
import Auth from '@/services/firebase/auth';

const userRef = new FirestoreHandler('users');
const currentAcc = ref('');
const addNew = ref(false);
const username = ref('');
const avatar = ref('');
const loading = ref(false);
const password = ref();
const auth = new Auth();

const emit = defineEmits(['selectedAccount']);

watch(currentAcc, (newVal) => {
  window.sessionStorage.clear();
  emit('selectedAccount', newVal);
})

const saveUser = async () => {
  if (loading.value) return;

  loading.value = true;

  if (!username.value || !password.value) return;

  let userCredential;
  if (addNew.value) {
    userCredential = await auth.createUserBasic(username.value, password.value);
  } else {
    userCredential = await auth.basicSignIn(username.value, password.value);
  }

  const user = userCredential?.user;

  if (user?.uid) {
    currentAcc.value = user?.uid;

    await userRef.saveWithCustomId({
      name: user.email.split('@')[0],
      user_token: currentAcc.value,
      avatar: avatar.value || 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/382994/thomas.jpg',
      joined_channels: {},
    }, currentAcc.value);
    router.push('/about');
  }

  loading.value = false;
}
</script>

<template>
  <main>
    <button style="margin-left:15px" @click="addNew = !addNew">+</button>
    <div class="input--div">
      <input type="email" class="input" v-model="username" placeholder="name" @keyup.enter="saveUser">
      <input type="text" class="input" v-model="avatar" placeholder="avatar url" v-if="addNew">
      <input type="text" class="input" v-model="password" placeholder="password">
      <button @click="saveUser">{{ addNew ? 'Register' : 'Login' }}</button>
    </div>
  </main>
</template>

<style>
select {
  /* Reset */
  -webkit-appearance: none;
     -moz-appearance: none;
          appearance: none;
  border: 0;
  outline: 0;
  font: inherit;
  /* Personalize */
  width: 20rem;
  padding: 1rem 4rem 1rem 1rem;
  background: url(https://upload.wikimedia.org/wikipedia/commons/9/9d/Caret_down_font_awesome_whitevariation.svg) no-repeat right 0.8em center/1.4em, linear-gradient(to left, rgba(255, 255, 255, 0.3) 3em, rgba(255, 255, 255, 0.2) 3em);
  color: white;
  border-radius: 0.25em;
  box-shadow: 0 0 1em 0 rgba(0, 0, 0, 0.2);
  cursor: pointer;
  /* Remove IE arrow */
  /* Remove focus outline */
  /* <option> colors */
}
select::-ms-expand {
  display: none;
}
select:focus {
  outline: none;
}
select option {
  color: inherit;
  background-color: rgb(71 70 70 / 75%);
}

.input--div {
  margin-top: 50px;
    display: flex;
    flex-direction: column;
    max-width: 20rem;
}

.input {
  appearance: none;
    border: 0;
    outline: 0;
    font: inherit;
    width: 20rem;
    padding: 1rem 4rem 1rem 1rem;
    background: 0.8em center/1.4em,linear-gradient(to left,#afafaf4d 3em,#fff3 3em);
    color: #fff;
    border-radius: 0.25em;
    box-shadow: 0 0 1em #0003;
    margin-top: 15px;
}
</style>