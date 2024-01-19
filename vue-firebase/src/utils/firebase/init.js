import { initializeApp } from "firebase/app"
import { firebaseConfig } from "./config"
import { getFirestore } from "firebase/firestore";
import { collection, doc, getDocs, setDoc,  getDoc} from 'firebase/firestore';

const firebaseApp = initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp);

const firestoreHandler = {
    async all(collectionPath, ...pathSegments) {
        const docs = await getDocs(collection(firestore, collectionPath, ...pathSegments));
        let data = {};
        docs.forEach((doc) => {
            data[doc.id] = doc.data();
        })

        return data;
    }
}

export { firestore, firestoreHandler } ;