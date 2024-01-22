import { initializeApp } from "firebase/app"
import { firebaseConfig } from "./config"
import { QuerySnapshot, addDoc, getFirestore, limit, onSnapshot, orderBy, where } from "firebase/firestore";
import { collection, doc, getDocs, setDoc,  getDoc, query } from 'firebase/firestore';

const firebaseApp = initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp);

class FirestoreHandler {
    constructor (path, ...pathSegments) {
        this.ref = collection(firestore, path, ...pathSegments);
        this.path = path;
        this.pathSegments = pathSegments;
        this.queries = [];
        this.lastQuery = [];
        this.unsubscribe = () => {
            return null;
        };
    }

    getRef() {
        return this.ref;
    }

    getPath() {
        return this.path;
    }

    getPathSegments() {
        return this.pathSegments;
    }

    getLastQuery() {
        return this.lastQuery;
    }

    unsubscribeOnSnapshot() {
        this.unsubscribe();
    }

    all() {
        return this.get();
    }

    whereIn(column, values) {
        this.queries.push(where(column, 'in', values));
        return this;
    }

    orderBy(column, value = 'asc') {
        this.queries.push(orderBy(column, value));
        return this;
    }

    take(number) {
        this.queries.push(limit(number));
        return this;
    }

    async get() {
        let q = this.getRef();
        if (this.queries.length) {
            q = query(q, ...this.queries);
            this.lastQuery = this.queries;
            this.queries = [];
        }
        
        const docs = await getDocs(q);
        let data = {};
        docs.forEach((doc) => {
            data[doc.id] = doc.data();
        })

        return data;
    }

    async first() {
        let q = this.getRef();
        this.take(1);
        if (this.queries.length) {
            q = query(q, ...this.queries);
            this.lastQuery = this.queries;
            this.queries = [];
        }
        
        const docs = await getDocs(q);
        let data = {};
        docs.forEach((doc) => {
            data = {
                id: doc.id,
                data: doc.data()
            };
        })

        return data;
    }

    fetchOnSnapshot(response = {}) {
        let q = this.getRef();
        if (this.queries.length) {
            q = query(q, ...this.queries);
            this.lastQuery = this.queries;
            this.queries = [];
        }
        
        this.unsubscribe = onSnapshot(q, (querySnapshot) => {
            querySnapshot.forEach((doc) => {
                response[doc.id] = doc.data();
            });
        });
    }

    generateId() {
        return doc(collection(firestore, this.getPath(), ...this.getPathSegments()));
    }

    async save(data) {
        return await addDoc(this.getRef(), data);
    }

    async saveWithCustomId(data, ...id) {
        return await setDoc(doc(firestore, this.getPath(), ...this.getPathSegments(), ...id), data);
    }
}

export { firestore, FirestoreHandler } ;