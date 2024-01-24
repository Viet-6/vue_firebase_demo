import { initializeApp } from "firebase/app"
import { firebaseConfig } from "./config"
import { QuerySnapshot, addDoc, getFirestore, limit, onSnapshot, orderBy, startAfter, startAt, updateDoc, where } from "firebase/firestore";
import { collection, doc, getDocs, setDoc,  getDoc, query } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage"

const firebaseApp = initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp);

class FirestoreHandler {
    constructor (path, ...pathSegments) {
        this.ref = collection(firestore, path, ...pathSegments);
        this.path = path;
        this.pathSegments = pathSegments;
        this.queries = [];
        this.lastQuery = null;
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

    getDoc(id) {
        return doc(firestore, this.getPath(), ...this.getPathSegments(), id);
    }

    async update(data, doc) {
        await updateDoc(doc, data);
    }

    where(column, operators, value) {
        this.queries.push(where(column, operators, value));
        return this;
    }

    whereIn(column, values) {
        this.queries.push(where(column, 'in', values));
        return this;
    }

    orderBy(column, value = 'asc') {
        this.queries.push(orderBy(column, value));
        return this;
    }

    startAfter(value) {
        this.queries.push(startAfter(value));
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
            this.lastQuery = q;
            this.queries = [];
        }
        
        return await getDocs(q);
    }

    async first() {
        let q = this.getRef();
        this.take(1);
        if (this.queries.length) {
            q = query(q, ...this.queries);
            this.lastQuery = q;
            this.queries = [];
        }
        
        return await getDocs(q);
    }

    fetchOnSnapshot(handleResponse) {
        let q = this.getRef();
        if (this.queries.length) {
            q = query(q, ...this.queries);
            this.lastQuery = q;
            this.queries = [];
        }
        
        this.unsubscribe = onSnapshot(q, handleResponse);
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

    uploadFile(files, callback = () => {}, path = '') {
        files.forEach(file => {
            const storage = getStorage();
            const storageRef = ref(storage, path + '/' + file.name);
            uploadBytes(storageRef, file).then(() => {
                getDownloadURL(storageRef).then(callback);
            });
        });
    }
}

export { firestore, FirestoreHandler } ;