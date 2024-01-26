import { firestore } from "@/utils/firebase/init";
import { QuerySnapshot, addDoc, getFirestore, limit, onSnapshot, orderBy, startAfter, startAt, updateDoc, where } from "firebase/firestore";
import { collection, doc, getDocs, setDoc,  getDoc, query } from 'firebase/firestore';

export default class Firestore 
{
    constructor (path, ...pathSegments) {
        this.reference = collection(firestore, path, ...pathSegments);
        this.path = path;
        this.pathSegments = pathSegments;
        this.queries = [];
        this.lastQuery = null;
        this.unsubscribe = () => {
            return null;
        };
    }

    getReference() {
        return this.reference;
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

    generateId() {
        return doc(collection(firestore, this.getPath(), ...this.getPathSegments()));
    }

    getDoc(id) {
        return doc(firestore, this.getPath(), ...this.getPathSegments(), id);
    }

    where(column, operators, value) {
        this.queries.push(where(column, operators, value));
        return this;
    }

    whereIn(column, values) {
        this.queries.push(where(column, 'in', values));
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
    
    orderBy(column, value = 'asc') {
        this.queries.push(orderBy(column, value));
        return this;
    }

    all() {
        return this.get();
    }

    async first() {
        let q = this.getReference();
        this.take(1);
        if (this.queries.length) {
            q = query(q, ...this.queries);
            this.lastQuery = q;
            this.queries = [];
        }
        
        return await getDocs(q);
    }

    async get() {
        let q = this.getReference();
        if (this.queries.length) {
            q = query(q, ...this.queries);
            this.lastQuery = q;
            this.queries = [];
        }
        
        return await getDocs(q);
    }

    async save(data) {
        return await addDoc(this.getReference(), data);
    }

    async saveWithCustomId(data, ...id) {
        return await setDoc(doc(firestore, this.getPath(), ...this.getPathSegments(), ...id), data);
    }

    async update(doc, data) {
        await updateDoc(doc, data);
    }

    fetchOnSnapshot(handleResponse) {
        let q = this.getReference();
        if (this.queries.length) {
            q = query(q, ...this.queries);
            this.lastQuery = q;
            this.queries = [];
        }
        
        this.unsubscribe = onSnapshot(q, handleResponse);
    }

    syncDocument(id, handleResponse) {
        this.unsubscribe = onSnapshot(this.getDoc(id), handleResponse);
    }
}