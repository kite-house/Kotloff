// JavaScript для обработки формы (добавь в <script> тег или отдельный JS-файл)

// Ждём загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('orderForm');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalClose = document.getElementById('modalClose');

    // Закрытие модалки по кнопке
    modalClose.addEventListener('click', () => {
        modalOverlay.style.display = 'none';
    });

    // Обработка submit формы
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Остановить стандартную отправку

        // Собираем данные (поля без name, так что селектим по типу/классу)
        const nameInput = form.querySelector('input[type="text"]');
        const phoneInput = form.querySelector('input[type="tel"]');
        const commentTextarea = form.querySelector('textarea');

        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        const comment = commentTextarea.value.trim();

        // Простая валидация (required уже в HTML, но на всякий)
        if (!name || !phone) {
            alert('Заполните имя и телефон!');
            return;
        }

        // Отправляем fetch-запрос на backend
        try {
            const response = await fetch('http://127.0.0.1:8000/api/application', { // Или твой URL backend'а (в проде — https://your-backend.com/api/submit)
                method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',  // ← ЭТО ВАЖНО!
                    },
                mode: 'cors',  // Важно для CORS
                body: JSON.stringify({
                    name: name,       // Из input[type="text"]
                    number: phone,     // Из input[type="tel"]
                    comment: comment  // Из textarea
                })
            });

            const data = await response.json();
            console.log(data)
            if (data.success) {
                alert(data.message); // "Заявка успешно отправлена!"
                form.reset();        // Очистить форму
                modalOverlay.style.display = 'none'; // Закрыть модалку
            } else {
                alert(data.message || 'Ошибка отправки!');
            }
        } catch (error) {
            console.error('Ошибка fetch:', error);
            alert('Ошибка соединения с сервером. Попробуйте позже.');
        }
    });
});