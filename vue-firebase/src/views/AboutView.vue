<template>
  <div class="about">
    <div class="wrappers">
      <div class="container">
        <div class="left">
          <div class="top">
            <input type="text" placeholder="Search" />
          </div>
          <ul class="people">
            <template v-for="(user, key) in users">
              <li class="person" :class="{ 'active': selected === key }" @click="setSelected(key)">
                <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/382994/thomas.jpg"/>
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
            <div class="chat active-chat" data-chat="person1">
                <div class="conversation-start">
                    <span>Today, 6:48 AM</span>
                </div>
                <template v-for="item in messages">
                  <div class="bubble" :class="item.sender === currentAcc ? 'me' : 'you'">
                      {{ item.message }}
                  </div>
                </template>
            </div>
          </div>
          <div class="write">
              <a href="javascript:;" class="write-link attach"></a>
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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { formatDate } from '../common/helper';

const users = ref([]);
const conversation = ref();
const messages = ref({});
const selected = ref();
const currentAcc = ref('AALlse6HUpwOH3AXK9oZ');
const userRef = new FirestoreHandler('users');
const conversationRef = new FirestoreHandler('conversations');
const message = ref('');
const messageRef = ref();

const messageTo = computed(() => users.value[selected.value]?.name);

const setSelected = (key) => {
  selected.value = key;
  openChat();
}

const openChat = async () => {
  messages.value = {};
  conversation.value = await conversationRef
    .whereIn('from', [currentAcc.value, selected.value])
    .whereIn('to', [currentAcc.value, selected.value])
    .first();

  if (!conversation.value || !Object.keys(conversation.value).length) {
    conversation.value = await conversationRef.save({
      from: currentAcc.value,
      to: selected.value
    });
  }

  messageRef.value = new FirestoreHandler('conversations', conversation.value.id, 'messages');
  messageRef.value.unsubscribe();
  messageRef.value.fetchOnSnapshot(messages.value);
  console.log(typeof messages.value);
}

const sendMessage = async () => {
  if (!message.value) return;

 await messageRef.value.save({
    message: message.value,
    sender: currentAcc.value,
    read: false,
    send_at: formatDate(new Date())
  });

  message.value = '';
}

onMounted(async () => {
  users.value = await userRef.all();
});

onBeforeUnmount(() => {
  messageRef.value.unsubscribe();
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
.container .right .chat.active-chat .bubble {
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
.container .right .chat.active-chat .bubble:nth-of-type(10) {
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
</style>