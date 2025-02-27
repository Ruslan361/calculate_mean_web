function togglePanel() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar.style.display === 'none' || sidebar.style.display === '') {
        sidebar.style.display = 'block'; // Показываем панель
    } else {
        sidebar.style.display = 'none'; // Скрываем панель
    }
}