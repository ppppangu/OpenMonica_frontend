@echo off
chcp 65001
echo 🚀 启动 AI 聊天服务器...

if not exist "node_modules" (
    echo ❌ 依赖未安装！请先运行 "安装依赖.bat"
    pause
    exit /b 1
)

echo ✅ 启动中...
timeout /t 1 /nobreak >nul
start http://localhost:3000

node server.js
