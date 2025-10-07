chcp 65001 >nul
@echo off
setlocal

:: Проверяем наличие Python
where python >nul 2>nul
if errorlevel 1 (
    echo Python не найден. Установите Python и добавьте его в PATH.
    pause
    exit /b
)

:: Проверяем наличие виртуального окружения
if not exist ".venv" (
    echo Создаю виртуальное окружение...
    python -m venv .venv
)

:: Активируем окружение
call .venv\Scripts\activate

:: Устанавливаем pip, если нужно
python -m ensurepip --upgrade >nul

pip install --upgrade pip setuptools wheel

pip install numpy --only-binary :all:

pip install opencv-python --only-binary :all:

pip install flask openpyxl

:: Проверяем наличие основного файла
if not exist "flask\wsgi.py" (
    echo Ошибка: файл flask\wsgi.py не найден!
    pause
    exit /b
)

:: Запуск приложения
echo Запуск Flask приложения...
.venv\Scripts\python.exe flask\wsgi.py

echo Скрипт работает. Нажми Ctrl+C, чтобы выйти.
:loop
timeout /t 1 >nul
goto loop
