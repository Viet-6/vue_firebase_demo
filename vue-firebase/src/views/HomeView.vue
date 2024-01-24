<script setup>
import router from '@/router';
import { FirestoreHandler }  from '../utils/firebase/init';
import { onMounted, ref, watch } from 'vue';

const users = ref({});
const userRef = new FirestoreHandler('users');
const currentAcc = ref('');
const addNew = ref(false);
const username = ref('');
const avatar = ref('');
const loading = ref(false);

const emit = defineEmits(['selectedAccount']);

onMounted(async () => {
  await userRef.where('inused', '==', false).get().then((docs) => {
    docs.forEach((doc) => {
      users.value[doc.id] = doc.data();
    });
  });
});

watch(currentAcc, (newVal) => {
  window.sessionStorage.clear();
  emit('selectedAccount', newVal);
})

const saveUser = async () => {
  if (loading.value) return;

  loading.value = true;

  if (!username.value) return;
  const newUser = await userRef.save({
    name: username.value,
    avatar: avatar.value || 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/382994/thomas.jpg',
    unread_message: 0,
    inused: false,
  });

  currentAcc.value = newUser.id;
  loading.value = false;
  router.push('/about');
}
</script>

<template>
  <main>
    <select v-model="currentAcc">
      <option :value="''">Select Account</option>
      <template v-for="(user, key) in users">
        <option :value="key">{{ user.name }}</option>
      </template>
    </select>
    <button style="margin-left:15px" @click="addNew = !addNew">+</button>
    <div class="input--div" v-if="addNew">
      <input type="text" class="input" v-model="username" placeholder="name" @keyup.enter="saveUser">
      <input type="text" class="input" v-model="avatar" placeholder="avatar url">
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