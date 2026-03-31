import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const secretKey = "GHOST_ULTRA_KEY_2026"; // Ключ для AES

// --- АВТОРИЗАЦИЯ ---
document.getElementById('login-btn').onclick = () => signInWithEmailAndPassword(auth, document.getElementById('auth-email').value, document.getElementById('auth-pass').value);
document.getElementById('reg-btn').onclick = () => createUserWithEmailAndPassword(auth, document.getElementById('auth-email').value, document.getElementById('auth-pass').value);
document.getElementById('google-btn').onclick = () => signInWithPopup(auth, new GoogleAuthProvider());
document.getElementById('logout-btn').onclick = () => signOut(auth).then(() => location.reload());

onAuthStateChanged(auth, async (user) => {
    const appUI = document.getElementById('app-screen');
    const authUI = document.getElementById('auth-screen');
    if (user) {
        authUI.style.display = 'none';
        appUI.style.display = 'flex';
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) document.getElementById('profile-modal').style.display = 'flex';
        initChat();
    } else {
        authUI.style.display = 'flex';
        appUI.style.display = 'none';
    }
});

// --- ПРОФИЛЬ ---
document.getElementById('save-profile').onclick = async () => {
    const nick = document.getElementById('set-username').value.trim().toLowerCase();
    if (nick) {
        await setDoc(doc(db, "users", auth.currentUser.uid), { username: nick, uid: auth.currentUser.uid });
        document.getElementById('profile-modal').style.display = 'none';
    }
};
document.getElementById('profile-btn').onclick = () => document.getElementById('profile-modal').style.display = 'flex';

// --- ЧАТ И ГС ---
async function send(type, val) {
    let content = val;
    if (type === 'text') content = CryptoJS.AES.encrypt(val, secretKey).toString();
    
    await addDoc(collection(db, "messages"), {
        uid: auth.currentUser.uid,
        type: type,
        content: content,
        time: serverTimestamp()
    });
}

document.getElementById('send-btn').onclick = () => {
    const inp = document.getElementById('msg-input');
    if (inp.value.trim()) { send('text', inp.value); inp.value = ''; }
};

function initChat() {
    const q = query(collection(db, "messages"), orderBy("time", "asc"));
    onSnapshot(q, (snap) => {
        const box = document.getElementById('messages-box');
        box.innerHTML = '';
        snap.forEach(d => {
            const m = d.data();
            const div = document.createElement('div');
            div.className = `msg ${m.uid === auth.currentUser.uid ? 'my' : 'other'}`;
            
            if (m.type === 'text') {
                div.innerText = CryptoJS.AES.decrypt(m.content, secretKey).toString(CryptoJS.enc.Utf8);
            } else if (m.type === 'voice') {
                div.innerHTML = `<audio src="${m.content}" controls style="width:200px;"></audio>`;
            }
            box.appendChild(div);
        });
        box.scrollTop = box.scrollHeight;
    });
}

// ГС через Base64 (Бесплатно)
let rec; let chunks = [];
document.getElementById('voice-btn').onmousedown = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    rec = new MediaRecorder(stream);
    rec.ondataavailable = e => chunks.push(e.data);
    rec.onstop = () => {
        const reader = new FileReader();
        reader.readAsDataURL(new Blob(chunks, { type: 'audio/ogg' }));
        reader.onloadend = () => { send('voice', reader.result); chunks = []; };
    };
    rec.start();
    document.getElementById('voice-btn').classList.add('rec');
};
document.getElementById('voice-btn').onmouseup = () => {
    rec.stop();
    document.getElementById('voice-btn').classList.remove('rec');
};
