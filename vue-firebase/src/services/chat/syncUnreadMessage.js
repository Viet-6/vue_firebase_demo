import Firestore from "../firebase/firestore";
import Auth from "../firebase/auth";

export default async function syncUnreadMessage(onSnapshotCallback) {
    const auth = (new Auth()).currentUser();

    if (!auth) {
        return 0;
    }

    const userRef = new Firestore('users');
    userRef.unsubscribe();
    userRef.syncDocument(auth.uid, onSnapshotCallback);

    return 1;
}