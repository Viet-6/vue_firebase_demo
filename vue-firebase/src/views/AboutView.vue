<template>
  <div class="about">
    <ul class="user-list">
      <template v-for="(user, key) in users">
        <li :class="{ 'user-selected': selected === key }" @click="setSelected(key)">{{ user.name }}</li>
      </template>
    </ul>
  </div>
</template>

<script setup>
import { firestoreHandler }  from '../utils/firebase/init';
import { onMounted, ref } from 'vue';

const users = ref([]);
const selected = ref();

const setSelected = (key) => {
  selected.value = key
}

onMounted(async () => {
  users.value = await firestoreHandler.all('users');
});
</script>

<style>
.user-list {
  list-style: none;
  margin-block: unset;
  margin-inline: unset;
  padding-inline: unset;
}

.user-list li {
  background: rgb(255 255 255 / 89%);
  padding: 25px;
  margin-bottom: 10px;
  border-radius: 15px;
  border: 1px solid cadetblue;
  color: black;
}

.user-list li:hover, li.user-selected {
  background: repeating-linear-gradient(172deg, black, #584747 100px);
  color: white;
}
</style>