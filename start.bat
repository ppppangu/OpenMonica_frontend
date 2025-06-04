@echo off
echo 🚀 启动AI聊天界面服务器...
echo.

REM 检查是否安装了Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到Node.js
    echo 请先安装Node.js: https://nodejs.org/
    pause
    exit /b 1
)

REM 检查是否存在node_modules
if not exist "node_modules" (
    echo 📦 安装依赖...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
)

echo ✅ 启动服务器...
echo.
echo 🌐 服务器将在以下地址运行:
echo    http://localhost:3000
echo.
echo 💡 按 Ctrl+C 停止服务器
echo.

echo 构建前端资源...
call npm run build
call npm start
