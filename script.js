function validate() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;

    // Твои данные для теста
    if (email === "admin@gmail" && pass === "Tim15") {
        document.getElementById('authBox').classList.add('hidden');
        document.getElementById('adminBox').classList.remove('hidden');
        console.log("Access Granted. Welcome, Admin.");
    } else {
        alert("ACCESS DENIED");
    }
}

// Имитация записи логов
function updateLogs(ip) {
    const consoleBox = document.getElementById('logConsole');
    const time = new Date().toLocaleTimeString();
    consoleBox.innerHTML = `[${time}] IP: ${ip} | STATUS: SUCCESS<br>` + consoleBox.innerHTML;
}
