import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";

export default class Auth
{
    constructor() {
        this.auth = getAuth();
    }

    getAuth() {
        return this.auth;
    }

    currentUser() {
        return this.auth.currentUser;
    }

    createUserBasic(email, password) {
        const user = createUserWithEmailAndPassword(this.getAuth(), email, password).catch((error) => {
            console.log(error.code);
            console.log(error.message);
        });

        return user;
    }
    
    basicSignIn(email, password) {
        const user = signInWithEmailAndPassword(this.getAuth(), email, password).catch((error) => {
            console.log(error.code);
            console.log(error.message);
        });

        return user;
    }

    signOut() {
        return signOut(this.getAuth()).catch((error) => {
            console.log(error)
        })
    }
}