<template>
  <div class="about">
    <div class="wrappers">
      <div class="container">
        <div class="left">
          <ul class="people">
            <template v-for="(user, key) in users">
              <li class="person" :class="{ 'active': selected === key }" @click="setSelected(key)">
                <img :src="user.avatar"/>
                <span class="name">{{ user.name }}</span>
                <template>

                </template>
                <span class="time" :data-unread="123">2:09 PM</span>
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
                <div class="message-container" :class="item.sender === currentAcc ? 'flex--end' : ''">
                  <div class="chat--bubble flex--end" :class="item.sender === currentAcc ? 'flex-reverse' : ''" v-if="item.message">
                    <div class="bubble reverse" :class="item.sender === currentAcc ? 'me' : 'you'">
                        {{ item.message }}
                    </div>
                    <span class="time" :class="item.sender === currentAcc ? 'from--right' : ''">{{ formatDate(item.send_at, "HH:mm") }}</span>
                  </div>
                  <div class="attachments">
                      <template v-for="url in item.attachments">
                        <img :src="url" :class="item.sender === currentAcc ? 'from--right' : ''"/>
                      </template>
                  </div>
                  <div class="from--user align-center" :class="item.sender === currentAcc ? 'from--right' : ''">
                      <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/382994/thomas.jpg">
                      <span class="name" v-if="item.sender !== currentAcc">MQ</span>
                  </div>
                </div>
              </template>
                <template v-for="(item, key) in messages">
                  <div class="message-container" :class="item.sender === currentAcc ? 'flex--end' : ''">
                    <div class="chat--bubble flex--end" :class="item.sender === currentAcc ? 'flex-reverse' : ''" v-if="item.message">
                      <div class="bubble" :class="item.sender === currentAcc ? 'me' : 'you'">
                          {{ item.message }}
                      </div>
                      <span class="time"  :class="item.sender === currentAcc ? 'from--right' : ''">{{ formatDate(item.send_at, "HH:mm") }}</span>
                    </div>
                    <div class="attachments">
                      <template v-for="url in item.attachments">
                        <img :src="url" :class="item.sender === currentAcc ? 'from--right' : ''" @change=""/>
                      </template>
                    </div>
                    <div class="from--user align-center" :class="item.sender === currentAcc ? 'from--right' : ''">
                      <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/382994/thomas.jpg">
                      <span class="name" v-if="item.sender !== currentAcc">MQ</span>
                  </div>
                  </div>
                </template>
            </div>
          </div>
          <div class="write">
              <input type="file" ref="fileInput" id="files" name="files" accept="image/*" multiple @change="selectFiles" v-show="false">
              <a href="javascript:;" class="write-link attach" @click="attachFile"></a>
              <input type="text" v-model="message" @keyup.enter="sendMessage"/>
              <a href="javascript:;" class="write-link smiley"></a>
              <a href="javascript:;" class="write-link send" @click="sendMessage"></a>
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
import Auth from '@/services/firebase/auth';
import syncUserList from '@/services/chat/syncUserList';
import syncUnreadMessage from '@/services/chat/syncUnreadMessage';

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
const auth = new Auth();
const unreadMessages = ref({});

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
  await conversationRef
    .whereIn('from', [currentAcc.value, selected.value])
    .whereIn('to', [currentAcc.value, selected.value])
    .first().then((docs) => {
      docs.forEach((doc) => {
        conversation.value = {
          id: doc.id,
          data: doc.data()
        }
      })
    });
    
  if (!conversation.value || !Object.keys(conversation.value).length) {
    conversation.value = await conversationRef.save({
      from: currentAcc.value,
      to: selected.value
    });
  }

  messageRef.value = new FirestoreHandler('conversations', conversation.value.id, 'messages');
  messageRef.value.unsubscribe();
  messageRef.value.orderBy('send_at', 'desc').take(10).fetchOnSnapshot(handleMessagesResponse);
}

const getAttachments = (url) => {
  attachments.value.push(url)
}

const sendMessage = async () => {
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

  await messageRef.value.save({
    message: msg,
    sender: currentAcc.value,
    read: false,
    send_at: formatDate(new Date()),
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

const handleUsersResponse = (querySnapshot) => {
  let docsLength = querySnapshot.docs.length;
  for (let index = docsLength - 1; index >= 0; index--) {
    let doc = querySnapshot.docs[index];
    users.value[doc.id] = doc.data();
  }
}

const handleUnreadMessage = (snapshot) => {
  unreadMessages.value = snapshot.data().joined_channels;
}

onMounted(async () => {
  currentAcc.value = auth.currentUser();
  
  if (currentAcc.value) {
    syncUserList(handleUsersResponse);
    syncUnreadMessage(handleUnreadMessage);
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

<style>
.about {
  width: 70%;
}
ul {
  list-style-type: none;
  margin-block: unset;
  margin-inline: unset;
  padding-inline-start: unset;
}
.wrappers {
  position: relative;
  left: 50%;
  height: 800px;
  transform: translate(-50%, 0);
}
.container {
  position: relative;
  top: 50%;
  left: 100%;
  width: 225%;
  height: 75%;
  background-color: var(--white);
  transform: translate(-50%,-50%);
}
.container .left {
  float: left;
  width: 25%;
  height: 100%;
  border: 1px solid lightcyan;
  background-color: var(--white);
}
.container .left .top {
  position: relative;
  width: 100%;
  height: 96px;
  padding: 29px;
}
.container .left .top:after {
  position: absolute;
  bottom: 0;
  left: 50%;
  display: block;
  width: 80%;
  height: 1px;
  content: '';
  background-color: var(--light);
  transform: translate(-50%, 0);
}
.container .left input {
  float: left;
  width: 188px;
  height: 42px;
  padding: 0 15px;
  border: 1px solid var(--light);
  background-color: #eceff1;
  border-radius: 21px;
  font-family: 'Source Sans Pro', sans-serif;
  font-weight: 400;
}
.container .left input:focus {
  outline: none;
}
.container .left a.search {
  display: block;
  float: left;
  width: 42px;
  height: 42px;
  margin-left: 10px;
  border: 1px solid var(--light);
  background-color: var(--blue);
  background-image: url('https://s3-us-west-2.amazonaws.com/s.cdpn.io/382994/name-type.png');
  background-repeat: no-repeat;
  background-position: top 12px left 14px;
  border-radius: 50%;
}
.container .left .people {
  margin-left: -1px;
  border-right: 1px solid lightcyan;
  border-left: 1px solid lightcyan;
  width: calc(100% + 2px);
}
.container .left .people .person {
  position: relative;
  width: 100%;
  padding: 12px 10% 16px;
  cursor: pointer;
  background-color: #201f1f;
}
.container .left .people .person:after {
  position: absolute;
  bottom: 0;
  left: 50%;
  display: block;
  width: 80%;
  height: 1px;
  content: '';
  background-color: var(--light);
  transform: translate(-50%, 0);
}
.container .left .people .person img {
  float: left;
  width: 40px;
  height: 40px;
  margin-right: 12px;
  border-radius: 50%;
  object-fit: cover;
}
.container .left .people .person .name {
  font-size: 14px;
  line-height: 22px;
  color: var(--dark);
  font-family: 'Source Sans Pro', sans-serif;
  font-weight: 600;
}
.container .left .people .person .time {
  font-size: 14px;
  position: absolute;
  top: 16px;
  right: 10%;
  padding: 0 0 5px 5px;
  color: var(--grey);
  background-color: var(--white);
}
.container .left .people .person .preview {
  font-size: 14px;
  display: inline-block;
  overflow: hidden !important;
  width: 70%;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--grey);
}
.container .left .people .person.active, .container .left .people .person:hover {
  margin-top: -1px;
  margin-left: -1px;
  padding-top: 13px;
  border: 0;
  background: linear-gradient(189deg, #737b25, transparent 100px);
  width: calc(100% + 2px);
  padding-left: calc(10% + 1px);
}
.container .left .people .person.active span, .container .left .people .person:hover span {
  color: var(--white);
  background: transparent;
}
.container .left .people .person.active:after, .container .left .people .person:hover:after {
  display: none;
}
.container .right {
  position: relative;
  float: left;
  width: 53%;
  height: 100%;
  margin-left: 5px;
  border: 1px solid lightyellow;
}
.container .right .top {
  width: 100%;
  height: 47px;
  padding: 15px 29px;
  background-color: #030303;
  border-bottom: 1px solid;
}
.container .right .top span {
  font-size: 15px;
  color: #b6b6b6;
}
.container .right .top span .name {
  color: var(--dark);
  font-family: 'Source Sans Pro', sans-serif;
  font-weight: 600;
}
.container .right .chat {
  position: relative;
  display: none;
  overflow: hidden;
  padding: 0 35px 15px;
  border-width: 1px 1px 1px 0;
  border-style: solid;
  border-color: var(--light);
  height: calc(100% - 55px);
  justify-content: flex-end;
  flex-direction: column;
}
.container .right .chat.active-chat {
  display: block;
  overflow-y: scroll;
}
.container .right .chat.active-chat .bubble, .time {
  transition-timing-function: cubic-bezier(0.4, -0.04, 1, 1);
}
.container .right .chat.active-chat .bubble:nth-of-type(1) {
  animation-duration: 0.15s;
}
.container .right .chat.active-chat .bubble:nth-of-type(2) {
  animation-duration: 0.3s;
}
.container .right .chat.active-chat .bubble:nth-of-type(3) {
  animation-duration: 0.45s;
}
.container .right .chat.active-chat .bubble:nth-of-type(4) {
  animation-duration: 0.6s;
}
.container .right .chat.active-chat .bubble:nth-of-type(5) {
  animation-duration: 0.75s;
}
.container .right .chat.active-chat .bubble:nth-of-type(6) {
  animation-duration: 0.9s;
}
.container .right .chat.active-chat .bubble:nth-of-type(7) {
  animation-duration: 1.05s;
}
.container .right .chat.active-chat .bubble:nth-of-type(8) {
  animation-duration: 1.2s;
}
.container .right .chat.active-chat .bubble:nth-of-type(9) {
  animation-duration: 1.35s;
}
.container .right .chat.active-chat .bubble:nth-of-type(10), .time {
  animation-duration: 1.5s;
}

.container .right .chat.active-chat .bubble.reverse:nth-of-type(10) {
  animation-duration: 0.15s;
}
.container .right .chat.active-chat .bubble.reverse:nth-of-type(9) {
  animation-duration: 0.3s;
}
.container .right .chat.active-chat .bubble.reverse:nth-of-type(8) {
  animation-duration: 0.45s;
}
.container .right .chat.active-chat .bubble.reverse:nth-of-type(7) {
  animation-duration: 0.6s;
}
.container .right .chat.active-chat .bubble.reverse:nth-of-type(6) {
  animation-duration: 0.75s;
}
.container .right .chat.active-chat .bubble.reverse:nth-of-type(5) {
  animation-duration: 0.9s;
}
.container .right .chat.active-chat .bubble.reverse:nth-of-type(4) {
  animation-duration: 1.05s;
}
.container .right .chat.active-chat .bubble.reverse:nth-of-type(3) {
  animation-duration: 1.2s;
}
.container .right .chat.active-chat .bubble.reverse:nth-of-type(2) {
  animation-duration: 1.35s;
}
.container .right .chat.active-chat .bubble.reverse:nth-of-type(1) {
  animation-duration: 1.5s;
}

.container .right .write {
  position: absolute;
  bottom: 29px;
  left: 30px;
  height: 42px;
  padding-left: 8px;
  border: 1px solid var(--light);
  background-color: #eceff1;
  width: calc(100% - 58px);
  border-radius: 5px;
}
.container .right .write input {
  font-size: 16px;
  float: left;
  width: 347px;
  height: 40px;
  padding: 0 10px;
  color: black;
  border: 0;
  outline: none;
  background-color: #eceff1;
  font-family: 'Source Sans Pro', sans-serif;
  font-weight: 400;
}
.container .right .write .write-link.attach:before {
  display: inline-block;
  float: left;
  width: 20px;
  height: 42px;
  content: '';
  background-image: url('https://s3-us-west-2.amazonaws.com/s.cdpn.io/382994/attachment.png');
  background-repeat: no-repeat;
  background-position: center;
}
.container .right .write .write-link.smiley:before {
  display: inline-block;
  float: left;
  width: 20px;
  height: 42px;
  content: '';
  background-image: url('https://s3-us-west-2.amazonaws.com/s.cdpn.io/382994/smiley.png');
  background-repeat: no-repeat;
  background-position: center;
}
.container .right .write .write-link.send:before {
  display: inline-block;
  float: left;
  width: 20px;
  height: 42px;
  margin-left: 11px;
  content: '';
  background-image: url('https://s3-us-west-2.amazonaws.com/s.cdpn.io/382994/send.png');
  background-repeat: no-repeat;
  background-position: center;
}
.container .right .bubble {
  font-size: 16px;
  position: relative;
  display: inline-block;
  clear: both;
  margin-bottom: 8px;
  padding: 13px 14px;
  vertical-align: top;
  border-radius: 5px;
  line-break: anywhere;
}
.container .right .bubble:before {
  position: absolute;
  top: 19px;
  display: block;
  width: 8px;
  height: 6px;
  content: '\00a0';
  transform: rotate(29deg) skew(-35deg);
}
.container .right .bubble.you {
  float: left;
  color: var(--white);
  background-color: darkcyan;
  align-self: flex-start;
  animation-name: slideFromLeft;
}
.container .right .bubble.you:before {
  left: -3px;
  background-color: darkcyan;
}
.container .right .bubble.me {
  float: right;
  color: black;
  background-color: #eceff1;
  align-self: flex-end;
  animation-name: slideFromRight;
}
.container .right .bubble.me:before {
  right: -3px;
  background-color: #eceff1;
}
.container .right .conversation-start {
  position: relative;
  width: 100%;
  margin-bottom: 27px;
  text-align: center;
}
.container .right .conversation-start span {
  font-size: 14px;
  display: inline-block;
  color: var(--grey);
}
.container .right .conversation-start span:before, .container .right .conversation-start span:after {
  position: absolute;
  top: 10px;
  display: inline-block;
  width: 30%;
  height: 1px;
  content: '';
  background-color: var(--light);
}
.container .right .conversation-start span:before {
  left: 0;
}
.container .right .conversation-start span:after {
  right: 0;
}
@keyframes slideFromLeft {
  0% {
    margin-left: -200px;
    opacity: 0;
 }
  100% {
    margin-left: 0;
    opacity: 1;
 }
}
@-webkit-keyframes slideFromLeft {
  0% {
    margin-left: -200px;
    opacity: 0;
 }
  100% {
    margin-left: 0;
    opacity: 1;
 }
}
@keyframes slideFromRight {
  0% {
    margin-right: -200px;
    opacity: 0;
 }
  100% {
    margin-right: 0;
    opacity: 1;
 }
}
@-webkit-keyframes slideFromRight {
  0% {
    margin-right: -200px;
    opacity: 0;
 }
  100% {
    margin-right: 0;
    opacity: 1;
 }
}
.chat-div {
  height: calc(100% - 75px);
}

.loading-page.active {
  display: flex;
}
.loading-page {
  z-index: 99;
position: absolute;
width: 100%;
height: 100%;
display: none;
justify-content: center;
left: 0%;
right: 0%;
top: calc(45% - 75px);
}
.pl,
.pl__worm {
animation-duration: 3s;
animation-iteration-count: infinite;
}
.pl {
animation-name: bump;
animation-timing-function: linear;
width: 8em;
height: 8em;
}
.pl__ring {
stroke: hsla(233,10%,10%,0.1);
transition: stroke 0.3s;
}
.pl__worm {
animation-name: worm;
animation-timing-function: cubic-bezier(0.42,0.17,0.75,0.83);
}

/* Dark theme */
@media (prefers-color-scheme: dark) {
:root {
  --bg: hsl(233,10%,10%);
  --fg: hsl(233,10%,90%);
}
.pl__ring {
  stroke: hsla(233,10%,90%,0.1);
}
}

/* Animations */
@keyframes bump {
from,
42%,
46%,
51%,
55%,
59%,
63%,
67%,
71%,
74%,
78%,
81%,
85%,
88%,
92%,
to { transform: translate(0,0); }
44% { transform: translate(1.33%,6.75%); }
53% { transform: translate(-16.67%,-0.54%); }
61% { transform: translate(3.66%,-2.46%); }
69% { transform: translate(-0.59%,15.27%); }
76% { transform: translate(-1.92%,-4.68%); }
83% { transform: translate(9.38%,0.96%); }
90% { transform: translate(-4.55%,1.98%); }
}
@keyframes worm {
from { stroke-dashoffset: 10; }
25% { stroke-dashoffset: 295; }
to { stroke-dashoffset: 1165; }
}

#style-1::-webkit-scrollbar-track
{
  -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
  border-radius: 10px;
  background-color: #F5F5F5;
}

#style-1::-webkit-scrollbar
{
  width: 12px;
  background-color: #F5F5F5;
}

#style-1::-webkit-scrollbar-thumb
{
  border-radius: 10px;
  -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,.3);
  background-color: #555;
}

.time {
    float: left;
    margin-left: 5px;
    margin-bottom: 2px;
    animation-name: slideFromRight;
}
.time.from--right {
  margin-right: 5px;
  animation-name: slideFromLeft;
}
.from--right {
  float: right!important;
}
.chat--bubble.flex--end {
  display: flex;
  align-items: flex-end;
}

.from--user.align-center {
  display: flex;
  align-items: center;
}

.from--user.align-center img {
  float: left;
  width: 25px;
  height: 25px;
  margin-right: 8px;
  border-radius: 50%;
  object-fit: cover;
}
.flex-reverse {
  flex-direction: row-reverse;
}

.message-container {
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.message-container.flex--end {
  align-items: flex-end;
}

.attachments img {
  float: left;
  width: 100px;
  height: 100px;
  object-fit: contain;
  margin-bottom: 7px;
  margin-left: 5px;
}

.person .time::after {
  content: attr(data-unread);
  top: -13px;
  position: absolute;
  border: 1px solid #965757;
  border-radius: 50%;
  background: red;
}
</style>