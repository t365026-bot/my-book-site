import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const conf = {
    apiKey: "AIzaSyCOM2tekyIxqOUGWvB1rwiFOCvGS4zFy8o",
    authDomain: "ghost-eadbc.firebaseapp.com",
    projectId: "ghost-eadbc",
    storageBucket: "ghost-eadbc.firebasestorage.app",
    messagingSenderId: "49431891859",
    appId: "1:49431891859:web:4721d994c4ebe455e02266"
};

const app = initializeApp(conf);
const auth = getAuth(app);
const db = getFirestore(app);
const salt = "GHOST_KEY_2026";
let curChat = "global";
let unsub = null;

// AUTH
window.authLog = () => signInWithEmailAndPassword(auth, v('email'), v('pass')).catch(e => alert(e.message));
window.authReg = () => createUserWithEmailAndPassword(auth, v('email'), v('pass')).catch(e => alert(e.message));
window.authGoog = () => signInWithPopup(auth, new GoogleAuthProvider());
window.exit = () => signOut(auth).then(() => location.reload());

onAuthStateChanged(auth, async (u) => {
    if (u) {
        show('app-screen'); hide('auth-screen');
        const d = await getDoc(doc(db, "users", u.uid));
        if (!d.exists()) show('p-modal');
        setChat("global");
    }
});

// PROFILE & SEARCH
window.saveProf = async () => {
    const n = v('unick').trim().toLowerCase();
    if (n) { await setDoc(doc(db, "users", auth.currentUser.uid), { username: n, uid: auth.currentUser.uid }); hide('p-modal'); }
};
window.openProf = () => show('p-modal');

document.getElementById('search').onkeypress = async (e) => {
    if (e.key === 'Enter') {
        const s = await getDocs(query(collection(db, "users"), where("username", "==", e.target.value.toLowerCase())));
        if (!s.empty) {
            const t = s.docs[0].data();
            setChat([auth.currentUser.uid, t.uid].sort().join('_'), "@" + t.username);
        } else alert("User not found");
    }
};

// CHAT ENGINE
window.setChat = (id, title = "Ghost Global") => {
    curChat = id;
    document.getElementById('head').innerText = title;
    if (unsub) unsub();
    const q = query(collection(db, "messages"), where("cid", "==", id), orderBy("t", "asc"));
    unsub = onSnapshot(q, (s) => {
        const b = document.getElementById('msgs'); b.innerHTML = '';
        s.forEach(doc => {
            const m = doc.data();
            const div = document.createElement('div');
            div.className = `msg ${m.uid === auth.currentUser.uid ? 'my' : 'other'}`;
            if (m.type === 'txt') div.innerText = CryptoJS.AES.decrypt(m.val, salt).toString(CryptoJS.enc.Utf8);
            else div.innerHTML = `<audio src="${m.val}" controls></audio>`;
            b.appendChild(div);
        });
        b.scrollTop = b.scrollHeight;
    });
};

window.sendMsg = async (type = 'txt', val = null) => {
    const input = document.getElementById('inp');
    const v = val || input.value;
    if (!v) return;
    await addDoc(collection(db, "messages"), {
        cid: curChat, uid: auth.currentUser.uid, type,
        val: type === 'txt' ? CryptoJS.AES.encrypt(v, salt).toString() : v,
        t: serverTimestamp()
    });
    if (!val) input.value = '';
};

// VOICE (FREE BASE64)
let rec; let ch = [];
window.startV = async () => {
    const s = await navigator.mediaDevices.getUserMedia({ audio: true });
    rec = new MediaRecorder(s);
    rec.ondataavailable = e => ch.push(e.data);
    rec.onstop = () => {
        const f = new FileReader(); f.readAsDataURL(new Blob(ch));
        f.onloadend = () => { sendMsg('voice', f.result); ch = []; };
    };
    rec.start();
};
window.stopV = () => rec.stop();

// UTILS
const v = (id) => document.getElementById(id).value;
const show = (id) => document.getElementById(id).style.display = 'flex';
const hide = (id) => document.getElementById(id).style.display = 'none';
