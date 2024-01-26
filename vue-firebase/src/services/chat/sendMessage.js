import { FirestoreHandler } from "@/utils/firebase/init";
import { Timestamp, increment } from "firebase/firestore";

export async function sendMessage(request) {
    const { 
        channel_id: channelId, 
        member_id: memberId, 
        payload,
        attachments,
    } = request;
    const now = Timestamp.fromDate(new Date());

    if (!channelId || !memberId || !(payload || attachments?.length)) {
        return -1;
    }

    const channelRef = new FirestoreHandler('channels');
    const currentChannelDoc = channelRef.getDoc(channelId);
    const channel = await channelRef.find(currentChannelDoc);

    if (!channel) {
        return -2;
    }

    const userRef = new FirestoreHandler('users');
    const currentUserDoc = userRef.getDoc(memberId);
    const user = await userRef.find(currentUserDoc);

    if (!user) {
        return -3;
    }

    const channelMembers = channel.data().members;

    if (channel.data().host_id !== user.id && !channelMembers.includes(user.id)) {
        console.log(`${user.id} don't have permission the access this channel`);
        return -4;
    }

    const lastMessageSnippet = attachments.length ? 'ファイルを送信しました。' : payload;

    const messageRef = new FirestoreHandler('channels', channel.id, 'messages');
    messageRef.save({
        payload: payload,
        attachments: attachments,
        sender_id: user.id,
        readers: [],
        created_at: now,
    });

    channelRef.update({
        last_send_member: user.data().name,
        last_send_at: now,
        last_message: lastMessageSnippet
    }, currentChannelDoc);
    
    let index = channelMembers.indexOf(user.id);
    if (index !== -1) {
        channelMembers.splice(index, 1);
    }

    if (channel.data().host_id !== user.id) {
        channelMembers.push(channel.data().host_id);
    }

    userRef.batchUpdate(channelMembers, {
        ['joined_channels.' + channel.id + '.unread_message']: increment(1),
    })
}