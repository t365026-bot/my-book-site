document.getElementById('payButton').addEventListener('click', function() {
    // 1. Имитация вызова ЮKassa
    this.innerText = 'Обработка платежа...';
    this.disabled = true;

    setTimeout(() => {
        // 2. Скрываем кнопку оплаты
        this.style.display = 'none';
        
        // 3. Показываем зону скачивания
        const successZone = document.getElementById('successZone');
        successZone.classList.remove('hidden');
        
        // 4. Скроллим к кнопке скачивания
        successZone.scrollIntoView({ behavior: 'smooth' });
        
        alert('Тестовый платеж на 1000р принят! Файл доступен для скачивания.');
    }, 2000);
});
