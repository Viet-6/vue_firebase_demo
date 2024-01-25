import { FirestoreHandler } from '@/utils/firebase/init';
import { arrayUnion } from 'firebase/firestore';

export async function addMember(request) {
    const { channel_id: channelId, member_ids: memberIds } = request;
    
    if (!channelId || !memberIds?.length) {
        return -1;
    }

    const channelRef = new FirestoreHandler('channels');
    const currentChannelDoc = channelRef.getDoc(channelId);
    const channel = await channelRef.find(currentChannelDoc);

    if (!channel) {
        return -2;
    }

    memberIds.forEach((id, index) => {
        if (channel.data().members?.length && channel.data().members.includes(id)) {
            console.log(`addMember: the user ${id} has been added into the channel before`);
            memberIds.splice(index, 1);
        }
    });

    await channelRef.update({
        members: arrayUnion(memberIds)
    }, currentChannelDoc);

    const userRef = new FirestoreHandler('users');

    await userRef.batchInsert(members, {
        joined_channels: arrayUnion({
            id: channel.id,
            unread_message: 0
        })
    });

    return { channel_id: channel.id }
}