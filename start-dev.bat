@echo off
echo 🚀 启动AI聊天界面开发环境
echo.

echo 📦 检查依赖...
if not exist "node_modules" (
    echo ❌ 未找到node_modules，正在安装依赖...
    npm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
) else (
    echo ✅ 依赖已安装
)

echo.
echo 🔧 启动开发服务器...
echo.
echo 📋 React应用:
echo    - http://localhost:5173/ (React应用主页)
echo    - http://localhost:5173/login (登录页面)
echo    - http://localhost:5173/chat (聊天界面)
echo    - http://localhost:5173/knowledge (知识库)
echo    - http://localhost:5173/settings (设置页面)
echo    - http://localhost:5173/help (帮助页面)
echo    - http://localhost:5173/test (测试页面)
echo.
echo 🔧 开发工具:
echo    - 按 Ctrl+C 停止服务器
echo    - 修改代码后页面会自动刷新
echo    - 打开浏览器开发者工具查看控制台日志
echo.

start "" "http://localhost:5173/"
npm run dev
