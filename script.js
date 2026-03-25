// Переключение вкладок
function showTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.remove('hidden');
    event.currentTarget.classList.add('active');
}

// Имитация работы спаммера
const startBtn = document.getElementById('startBtn');
const consoleLog = document.getElementById('consoleLog');

function addLog(msg, type = 'INFO') {
    const time = new Date().toLocaleTimeString();
    consoleLog.innerHTML += `<br>[${time}] [${type}] ${msg}`;
    consoleLog.scrollTop = consoleLog.scrollHeight;
}

startBtn.addEventListener('click', () => {
    addLog('Запуск потоков рассылки...', 'SYSTEM');
    startBtn.disabled = true;
    startBtn.innerText = 'В РАБОТЕ...';

    let sent = 0;
    const interval = setInterval(() => {
        sent++;
        document.getElementById('sentCount').innerText = sent;
        document.getElementById('pBar').style.width = (sent % 100) + '%';
        addLog(`Сообщение отправлено в сессию Ghost_${sent % 2 + 1}`, 'SUCCESS');
        
        if (sent >= 10) {
            clearInterval(interval);
            addLog('Цикл завершен. Ожидание интервала (3600 сек)...', 'WAIT');
            startBtn.disabled = false;
            startBtn.innerText = 'ЗАПУСТИТЬ ПОТОК';
        }
    }, 1500);
});
