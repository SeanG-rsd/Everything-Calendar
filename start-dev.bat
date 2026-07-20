@echo off
start "Frontend" cmd /k "cd /d %~dp0frontend && npx expo start --tunnel"
