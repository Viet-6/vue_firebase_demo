import { FirestoreHandler } from "@/utils/firebase/init";
import { Timestamp, arrayUnion, increment } from "firebase/firestore";

export async function syncMessages(request, onSnapshotCallback) {
    const { channel_id: channelId, member_id: memberId } = request;
    const now = Timestamp.fromDate(new Date());

    if (!channelId || !memberId) {
        return -1;
    }
    console.log(123123);
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

    if (channel.data().host_id !== user.id && !channel.data().members.includes(user.id)) {
        console.log(`${user.id} don't have permission the access this channel`);
        return -4;
    }

    const messageRef = new FirestoreHandler('channels', channel.id, 'messages');
    messageRef.unsubscribe();
    messageRef.orderBy('created_at', 'desc').take(10).fetchOnSnapshot(async (querySnapshot) => {
        let currentChannel = await channelRef.find(currentChannelDoc);
        let currentUser = await userRef.find(currentUserDoc);
        if (!currentChannel || !currentUser) {
            messageRef.unsubscribe();
            return;
        }

        let onSnapshotDocs = [];

        querySnapshot.docChanges().forEach((change) => {
            const doc = change.doc;
            if (change.type === "added" && doc.data().sender_id !== currentUser.id) {
                onSnapshotDocs.push(doc)
            }
            if (change.type === "modified") {
                console.log("Modified city: ", change.doc.data());
            }
            if (change.type === "removed") {
                console.log("Removed city: ", change.doc.data());
            }
        });

        onSnapshotDocs.forEach((doc) => {            
            if (!(currentUser.id in doc.data().readers)) {
                messageRef.update({
                    ['readers.' + currentUser.id + '.read_at']: now,
                }, messageRef.getDoc(doc.id));
    
                userRef.update({
                    ['joined_channels.' +channel.id + '.unread_message']: increment(-1),
                }, currentUserDoc);
            }
        });

        onSnapshotCallback(querySnapshot);
    });

    return 1;
}