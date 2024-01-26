import Firestore from "../firebase/firestore";
import Auth from "../firebase/auth";

export default async function syncUserList(onSnapshotCallback) {
    const auth = (new Auth()).currentUser();

    if (!auth) {
        return 0;
    }

    const userRef = new Firestore('users');
    userRef.unsubscribe();
    userRef.where('user_token', '!=', auth.uid).fetchOnSnapshot(onSnapshotCallback);

    return 1;
}