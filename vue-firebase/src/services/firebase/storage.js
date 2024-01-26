import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage"

export default class Storage
{
    uploadFiles(files, callback = () => {}, path = '') {
        files.forEach(file => {
            const storage = getStorage();
            const storageRef = ref(storage, path + '/' + file.name);
            uploadBytes(storageRef, file).then(() => {
                getDownloadURL(storageRef).then(callback);
            });
        });
    }
}