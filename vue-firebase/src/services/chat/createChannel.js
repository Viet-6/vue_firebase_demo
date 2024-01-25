import { FirestoreHandler } from '@/utils/firebase/init';
import { CHANNEL_TYPE } from '@/common/constants';
import { arrayUnion, Timestamp } from 'firebase/firestore';

export async function createChannel(request) {
    const { channel_name: channelName, host_id: hostId, channel_type: channelType, members: members } = request;
    const now = Timestamp.fromDate(new Date());
    console.log(channelName, hostId, channelType, members)
    if (!members) {
        members = [];
    }

    if (!channelName || !hostId || !channelType) {
        return -1;
    }

    if (![CHANNEL_TYPE.PRIVATE, CHANNEL_TYPE.PUBLIC].includes(channelType)) {
        return -2;
    }

    const channelRef = new FirestoreHandler('channels')
        .where('channel_name', '==', channelName)
        .where('channel_type', '==', channelType);
    if (channelType === CHANNEL_TYPE.PRIVATE) {
        members.sort();
        channelRef.whereIn('members', [members]);
    }

    const channelSnapshot = await channelRef.first();

    if (!channelSnapshot.empty) {
        const channel = channelSnapshot.docs[0];
        if (!channel.data().deleted_at) {
            return -3;
        } else {
            channelRef.update(channel, {
                deleted_at: null
            })

            return channel.id;
        }
    }

    console.log(hostId);

    const channel = await channelRef.save({
        channel_name: channelName,
        host_id: hostId,
        channel_type: channelType,
        members: members,
        created_at: now
    });

    if (members?.length) {
        const userRef = new FirestoreHandler('users');
        await userRef.batchUpdate(members, {
            ['joined_channels.' + channel.id + '.unread_message']: 0,
        })
    }

    return { channel_id: channel.id }
}