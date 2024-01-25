import { initializeApp } from "firebase/app"
import { firebaseConfig } from "./config"
import { QuerySnapshot, addDoc, getFirestore, limit, onSnapshot, orderBy, startAfter, startAt, updateDoc, where, writeBatch } from "firebase/firestore";
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

    async find(doc) {
        return await getDoc(doc);
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

    whereArrayContains(column, value) {
        this.queries.push(where(column, 'array-contains', value));
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

    async batchInsert(ids, data) {
        const batches = [];
        let currentBatch = writeBatch(firestore);
        let counter = 0;
    
        ids.forEach((id, index) => {
            const reference = doc(firestore, this.getPath(), ...this.getPathSegments(), id);
            if (!reference) return;
    
            currentBatch.set(reference, data);
            counter++;
    
            if (counter === 500 || index === ids.length - 1) {  
                batches.push(currentBatch);  
                currentBatch = writeBatch(firestore);
                counter = 0; 
              }
        })
    
        for (const batch of batches) {  
            await batch.commit();  
        }
    }

    async batchUpdate(ids, data) {
        const batches = [];
        let currentBatch = writeBatch(firestore);
        let counter = 0;
    
        ids.forEach((id, index) => {
            const reference = doc(firestore, this.getPath(), ...this.getPathSegments(), id);
            if (!reference) return;
    
            currentBatch.update(reference, data);
            counter++;
    
            if (counter === 500 || index === ids.length - 1) {  
                batches.push(currentBatch);  
                currentBatch = writeBatch(firestore);
                counter = 0; 
              }
        })
    
        for (const batch of batches) {  
            await batch.commit();  
        }
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