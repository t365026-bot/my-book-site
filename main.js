import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const config = {
    apiKey: "AIzaSyCOM2tekyIxqOUGWvB1rwiFOCvGS4zFy8o",
    authDomain: "ghost-eadbc.firebaseapp.com",
    projectId: "ghost-eadbc",
    storageBucket: "ghost-eadbc.firebasestorage.app",
    messagingSenderId: "49431891859",
    appId: "1:49431891859:web:4721d994c4ebe455e02266"
};

const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);
const key = "GHOST_ULTRA_2026"; 
let currentChat = "global";
let stopListen = null;

// СЛУШАТЕЛИ КНОПОК
const el = (id) => document.getElementById(id);
const val = (id) => el(id).value;

el('l-btn').onclick = () => signInWithEmailAndPassword(auth, val('email'), val('pass')).catch(e => alert("Ошибка входа"));
el('r-btn').onclick = () => createUserWithEmailAndPassword(auth, val('email'), val('pass')).catch(e => alert(e.message));
el('g-btn').onclick = () => signInWithPopup(auth, new GoogleAuthProvider()).catch(e => alert("Добавь домен в Auth!"));
el('exit').onclick = () => signOut(auth).then(() => location.reload());
el('prof-open').onclick = () => el('modal').style.display = 'flex';
el('global-trigger').onclick = () => loadChat("global", "Ghost Global");

// ПРОВЕРКА ВХОДА
onAuthStateChanged(auth, async (u) => {
    if (u) {
        el('auth-screen').style.display = 'none';
        el('app-screen').style.display = 'flex';
        const d = await getDoc(doc(db, "users", u.uid));
        if (!d.exists()) el('modal').style.display = 'flex';
        loadChat("global");
    } else {
        el('auth-screen').style.display = 'flex';
        el('app-screen').style.display = 'none';
    }
});

// СОХРАНЕНИЕ НИКА
el('save').onclick = async () => {
    const n = val('nick').trim().toLowerCase().replace('@', '');
    if (n.length < 3) return alert("Ник слишком короткий");
    await setDoc(doc(db, "users", auth.currentUser.uid), { username: n, uid: auth.currentUser.uid });
    el('modal').style.display = 'none';
};

// ПОИСК ЮЗЕРОВ
el('search').onkeypress = async (e) => {
    if (e.key === 'Enter') {
        const targetNick = e.target.value.toLowerCase().replace('@', '');
        const q = query(collection(db, "users"), where("username", "==", targetNick));
        const res = await getDocs(q);
        if (!res.empty) {
            const user = res.docs[0].data();
            const chatId = [auth.currentUser.uid, user.uid].sort().join('_');
            loadChat(chatId, "@" + user.username);
        } else alert("Юзер не найден");
    }
};

// ЛОГИКА ЧАТА
function loadChat(chatId, title = "Ghost Global") {
    currentChat = chatId;
    el('chat-name').innerText = title;
    if (stopListen) stopListen();

    const q = query(collection(db, "messages"), where("chatId", "==", chatId), orderBy("t", "asc"));
    stopListen = onSnapshot(q, (snap) => {
        const box = el('msgs');
        box.innerHTML = '';
        snap.forEach(doc => {
            const m = doc.data();
            const d = document.createElement('div');
            d.className = `msg ${m.uid === auth.currentUser.uid ? 'my' : 'other'}`;
            
            if (m.type === 'text') {
                try {
                    const dec = CryptoJS.AES.decrypt(m.val, key).toString(CryptoJS.enc.Utf8);
                    d.innerText = dec || "Ошибка дешифровки";
                } catch { d.innerText = "Зашифровано"; }
            } else {
                d.innerHTML = `<audio src="${m.val}" controls style="width:200px"></audio>`;
            }
            box.appendChild(d);
        });
        box.scrollTop = box.scrollHeight;
    });
}

// ОТПРАВКА
async function send(type, content) {
    if (!content) return;
    const finalVal = type === 'text' ? CryptoJS.AES.encrypt(content, key).toString() : content;
    await addDoc(collection(db, "messages"), {
        chatId: currentChat,
        uid: auth.currentUser.uid,
        type: type,
        val: finalVal,
        t: serverTimestamp()
    });
}

el('s-btn').onclick = () => {
    if (val('inp').trim()) { send('text', val('inp')); el('inp').value = ''; }
};

// ГОЛОСОВЫЕ (Base64)
let recorder; let chunks = [];
el('v-btn').onmousedown = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
        const reader = new FileReader();
        reader.readAsDataURL(new Blob(chunks));
        reader.onloadend = () => { send('voice', reader.result); chunks = []; };
    };
    recorder.start();
    el('v-btn').style.color = '#ff4b4b';
};
el('v-btn').onmouseup = () => {
    recorder.stop();
    el('v-btn').style.color = '#2481cc';
};
