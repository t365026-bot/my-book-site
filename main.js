import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCOM2tekyIxqOUGWvB1rwiFOCvGS4zFy8o",
  authDomain: "ghost-eadbc.firebaseapp.com",
  projectId: "ghost-eadbc",
  storageBucket: "ghost-eadbc.firebasestorage.app",
  messagingSenderId: "49431891859",
  appId: "1:49431891859:web:4721d994c4ebe455e02266"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const secretKey = "GHOST_ULTRA_SECRET_KEY_99"; // Ключ для AES-шифрования

// --- АВТОРИЗАЦИЯ ---
document.getElementById('login-btn').onclick = () => signInWithEmailAndPassword(auth, email.value, password.value);
document.getElementById('reg-btn').onclick = () => createUserWithEmailAndPassword(auth, email.value, password.value);
document.getElementById('google-btn').onclick = () => signInWithPopup(auth, new GoogleAuthProvider());
document.getElementById('logout-btn').onclick = () => signOut(auth);

onAuthStateChanged(auth, (user) => {
    document.getElementById('auth-screen').style.display = user ? 'none' : 'flex';
    document.getElementById('main-screen').style.display = user ? 'flex' : 'none';
    if(user) initChat();
});

// --- ЧАТ (МОМЕНТАЛЬНОСТЬ И ШИФРОВАНИЕ) ---
function initChat() {
    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
    
    // onSnapshot обновляет интерфейс мгновенно при любом изменении в БД
    onSnapshot(q, (snapshot) => {
        const container = document.getElementById('messages-container');
        container.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            
            // Дешифровка текста
            let decryptedText = "";
            try {
                if(data.type === 'text') {
                    decryptedText = CryptoJS.AES.decrypt(data.content, secretKey).toString(CryptoJS.enc.Utf8);
                }
            } catch(e) { decryptedText = "Ошибка дешифровки"; }

            renderMessage(data, decryptedText);
        });
        container.scrollTop = container.scrollHeight;
    });
}

async function sendMessage(type, content) {
    let finalContent = content;
    // Шифруем только текст
    if(type === 'text') {
        finalContent = CryptoJS.AES.encrypt(content, secretKey).toString();
    }

    await addDoc(collection(db, "messages"), {
        uid: auth.currentUser.uid,
        userName: auth.currentUser.displayName || auth.currentUser.email,
        type: type,
        content: finalContent,
        createdAt: serverTimestamp()
    });
}

document.getElementById('send-btn').onclick = () => {
    const input = document.getElementById('msg-input');
    if(input.value.trim()) {
        sendMessage('text', input.value);
        input.value = '';
    }
};

// --- ФАЙЛЫ И ГОЛОСОВЫЕ ---
document.getElementById('file-input').onchange = async (e) => {
    const file = e.target.files[0];
    const fileRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    sendMessage(file.type.startsWith('image') ? 'img' : 'file', url);
};

// Голосовые (MediaRecorder API)
let recorder;
let chunks = [];
document.getElementById('voice-btn').onmousedown = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recorder = new MediaRecorder(stream);
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/ogg' });
        const voiceRef = ref(storage, `voices/${Date.now()}.ogg`);
        await uploadBytes(voiceRef, blob);
        const url = await getDownloadURL(voiceRef);
        sendMessage('voice', url);
        chunks = [];
    };
    recorder.start();
    document.getElementById('voice-btn').classList.add('recording');
};
document.getElementById('voice-btn').onmouseup = () => {
    recorder.stop();
    document.getElementById('voice-btn').classList.remove('recording');
};

function renderMessage(data, text) {
    const container = document.getElementById('messages-container');
    const div = document.createElement('div');
    div.className = `message ${data.uid === auth.currentUser.uid ? 'my' : 'other'}`;
    
    if(data.type === 'text') div.innerText = text;
    if(data.type === 'img') div.innerHTML = `<img src="${data.content}" style="width:100%; border-radius:8px;">`;
    if(data.type === 'voice') div.innerHTML = `<audio src="${data.content}" controls style="width:200px;"></audio>`;
    if(data.type === 'file') div.innerHTML = `<a href="${data.content}" target="_blank" style="color:#fff;">📄 Файл</a>`;
    
    container.appendChild(div);
}
