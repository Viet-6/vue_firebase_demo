<template>
  <div class="about">
    <div class="wrappers">
      <div class="container">
        <div class="left">
          <ul class="people">
            <template v-for="(user, key) in users">
              <li class="person" :class="{ 'active': selected === key }" @click="setSelected(key)" v-if="key !== currentAcc">
                <img :src="user.avatar"/>
                <span class="name">{{ user.name }}</span>
                <span class="time">2:09 PM</span>
                <span class="preview">I ...</span>
              </li>
            </template>
          </ul>
        </div>
        <div class="right">
          <div class="chat-div">
            <div class="top"><span>To: <span class="name">{{ messageTo }}</span></span></div>
            <div class="loading-page" :class="{ 'active': loading }">
              <svg class="pl" viewBox="0 0 128 128" width="128px" height="128px" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="pl-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="hsl(193,90%,55%)" />
                    <stop offset="100%" stop-color="hsl(223,90%,55%)" />
                  </linearGradient>
                </defs>
                <circle class="pl__ring" r="56" cx="64" cy="64" fill="none" stroke="hsla(0,10%,10%,0.1)" stroke-width="16" stroke-linecap="round" />
                <path class="pl__worm" d="M92,15.492S78.194,4.967,66.743,16.887c-17.231,17.938-28.26,96.974-28.26,96.974L119.85,59.892l-99-31.588,57.528,89.832L97.8,19.349,13.636,88.51l89.012,16.015S81.908,38.332,66.1,22.337C50.114,6.156,36,15.492,36,15.492a56,56,0,1,0,56,0Z" fill="none" stroke="url(#pl-grad)" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="44 1111" stroke-dashoffset="10" />
              </svg>
            </div>
            <div class="chat active-chat" id="style-1" ref="chatboxRef" @scroll.passive="loadmore">
              <template v-for="(item, key) in loadmoreMessages">
                <div class="message-container" :class="item.sender_id === currentAcc ? 'flex--end' : ''">
                  <div class="chat--bubble flex--end" :class="item.sender_id === currentAcc ? 'flex-reverse' : ''" v-if="item.payload">
                    <div class="bubble reverse" :class="item.sender_id === currentAcc ? 'me' : 'you'">
                        {{ item.payload }}
                    </div>
                    <span class="time" :class="item.sender_id === currentAcc ? 'from--right' : ''">{{ formatDate(item.created_at, "HH:mm") }}</span>
                  </div>
                  <div class="attachments">
                      <template v-for="url in item.attachments">
                        <img :src="url" :class="item.sender_id === currentAcc ? 'from--right' : ''"/>
                      </template>
                  </div>
                  <div class="from--user align-center" :class="item.sender_id === currentAcc ? 'from--right' : ''">
                      <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/382994/thomas.jpg">
                      <span class="name" v-if="item.sender_id !== currentAcc">MQ</span>
                  </div>
                </div>
              </template>
                <template v-for="(item, key) in messages">
                  <div class="message-container" :class="item.sender_id === currentAcc ? 'flex--end' : ''">
                    <div class="chat--bubble flex--end" :class="item.sender_id === currentAcc ? 'flex-reverse' : ''" v-if="item.payload">
                      <div class="bubble" :class="item.sender_id === currentAcc ? 'me' : 'you'">
                          {{ item.payload }}
                      </div>
                      <span class="time"  :class="item.sender_id === currentAcc ? 'from--right' : ''">{{ formatDate(item.created_at, "HH:mm") }}</span>
                    </div>
                    <div class="attachments">
                      <template v-for="url in item.attachments">
                        <img :src="url" :class="item.sender_id === currentAcc ? 'from--right' : ''" @change=""/>
                      </template>
                    </div>
                    <div class="from--user align-center" :class="item.sender_id === currentAcc ? 'from--right' : ''">
                      <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/382994/thomas.jpg">
                      <span class="name" v-if="item.sender_id !== currentAcc">MQ</span>
                  </div>
                  </div>
                </template>
            </div>
          </div>
          <div class="write">
              <input type="file" ref="fileInput" id="files" name="files" accept="image/*" multiple @change="selectFiles" v-show="false">
              <a href="javascript:;" class="write-link attach" @click="attachFile"></a>
              <input type="text" v-model="message" @keyup.enter="sendMessages"/>
              <a href="javascript:;" class="write-link smiley"></a>
              <a href="javascript:;" class="write-link send" @click="sendMessages"></a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { FirestoreHandler }  from '../utils/firebase/init';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { formatDate } from '../common/helper';
import { createChannel } from '@/services/chat/createChannel';
import { syncMessages } from '@/services/chat/syncMessages';
import { sendMessage } from '@/services/chat/sendMessage';

const users = ref({});
const conversation = ref({});
const messages = ref({});
const selected = ref();
const currentAcc = ref('');
const userRef = new FirestoreHandler('users');
const conversationRef = new FirestoreHandler('conversations');
const message = ref('');
const messageRef = ref();
const chatboxRef = ref(null);
const loadmoreMessages = ref([]);
const stopLoadmore = ref(false);
const shouldScroll = ref(false);
const lastDocument = ref();
const loading = ref(false);
const files = ref([]);
const fileInput = ref();
const attachments = ref([]);

const messageTo = computed(() => users.value[selected.value]?.name);

const selectFiles = () => {
  for (let index = 0; index < fileInput.value.files.length; index++) {
    files.value.push(fileInput.value.files[index]);
  }
}

const attachFile = () => {
  fileInput.value?.click();
  fileInput.value.value = '';
}

const handleMessagesResponse = (querySnapshot) => {
  let docsLength = querySnapshot.docs.length;
  for (let index = docsLength - 1; index >= 0; index--) {
    let doc = querySnapshot.docs[index];
    messages.value[doc.id] = doc.data();
  }

  if (docsLength) {
    lastDocument.value = querySnapshot.docs[docsLength - 1];
  }

  shouldScroll.value = true;
}

const setSelected = (key) => {
  selected.value = key;
  openChat();
}

const openChat = async () => {
  messages.value = {};
  loadmoreMessages.value = [];
  stopLoadmore.value = false;
  // const channelRef = new FirestoreHandler('channels');
  // const currentChannelDoc = channelRef.getDoc(channelId);
  // conversation.value = await channelRef.find(currentChannelDoc);

  // if (!conversation.value) {
      // conversation.value = await createChannel({
      //   channel_name: "test channel",
      //   host_id: currentAcc.value,
      //   channel_type: 1,
      //   members: [selected.value]
      // });
  // }
  conversation.value = {
    channel_id: 'JkEovtczFsJxR7sZY6lV'
  }

  console.log(conversation.value);
  await syncMessages({
    channel_id: conversation.value.channel_id,
    member_id: currentAcc.value
  }, handleMessagesResponse)
}

const getAttachments = (url) => {
  attachments.value.push(url)
}

const sendMessages = async () => {
  if (!message.value && !files.value.length) return;
  if (files.value.length) {
    messageRef.value.uploadFile(files.value, getAttachments, 'image');
  } else {
    saveMessageAction(message.value);
  }
}

const saveMessageAction = async (msg = '', attachs = []) => {
  message.value = '';
  files.value = [];
  attachments.value = [];

  await sendMessage({
    channel_id: conversation.value.channel_id,
    member_id: currentAcc.value,
    payload: msg,
    attachments: attachs
  });
}

const loadmore = async (e) => {
  loading.value = true;
  if (e.target.scrollTop === 0 && !stopLoadmore.value) {
    let preMessage = [];
    await messageRef.value.orderBy('send_at', 'desc').startAfter(lastDocument.value).take(10).get().then((docs) => {
      let docsLength = docs.docs.length;
      if (docsLength) {
        lastDocument.value = docs.docs[docsLength - 1];
      } else {
        stopLoadmore.value = true;
        return;
      }
      docs.forEach((doc) => {
        preMessage.unshift(doc.data());
      })
    });

    loadmoreMessages.value = preMessage.concat(loadmoreMessages.value);
  }
  loading.value = false;
}

watch(shouldScroll, async (newVal) => {
  if (newVal) {
    await nextTick();
    chatboxRef.value?.lastElementChild?.scrollIntoView({
      behavior: "smooth",
    });

    shouldScroll.value = false;
  }
})

watch(() => attachments.value, (newVal) => {
  if (!attachments.value.length) return;
  if (attachments.value.length === files.value.length) {
    saveMessageAction(message.value, attachments.value)
  }
}, { deep: true })

onMounted(async () => {
  currentAcc.value = window.sessionStorage.getItem('id');
  if (currentAcc.value) {
    await userRef.update({
      inused: true,
    }, userRef.getDoc(currentAcc.value))

    await userRef.where('inused', '==', true).get().then((docs) => {
      docs.forEach((doc) => {
        users.value[doc.id] = doc.data();
      });
    });

  }
});

onBeforeUnmount(async () => {
  messageRef.value?.unsubscribe();
  window.sessionStorage.clear();
  await userRef.update({
      inused: false,
    }, userRef.getDoc(currentAcc.value))
});
</script>
