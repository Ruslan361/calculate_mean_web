chcp 65001 >nul
.venv\Scripts\python.exe flask/wsgi.py
@echo off
echo Скрипт работает. Нажми Cntrl+C, чтобы выйти.
:loop
timeout /t 1 >nul
goto loop