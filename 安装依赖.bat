@echo off
chcp 65001
echo 📦 安装 AI 聊天项目依赖...

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js 未安装！
    echo 请访问 https://nodejs.org/ 下载安装
    pause
    exit /b 1
)

echo ✅ Node.js 已安装
echo 📥 正在安装依赖...
npm install

if %errorlevel% neq 0 (
    echo ❌ 安装失败！
    pause
    exit /b 1
)

echo ✅ 安装完成！
echo 现在可以运行 "启动服务器-nodejs.bat"
pause
