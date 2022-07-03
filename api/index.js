import { user_id, user_key, vectorUrlEndPoint } from './ApiVariables';

export default function(imgUri) {
    return new Promise(((resolve, reject) => {
        var data = new FormData();
        data.append("img", {
            uri: imgUri,
            type: 'image/jpg',
            name: 'image.jpg',
        });

        var xhr = new XMLHttpRequest();
        xhr.withCredentials = true;

        xhr.onerror = () => {
            console.warn('[uploadPhoto][xhr.onerror]');
            reject(xhr);
        };
        xhr.onload = () => {
            console.log('[uploadPhoto][onload] status:', xhr.status);
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr);
            } else {
                reject(xhr);
            }
        };

        xhr.open("POST", vectorUrlEndPoint);
        xhr.setRequestHeader("user_id", user_id);
        xhr.setRequestHeader("user_key", user_key);
        xhr.send(data);
    }));
}