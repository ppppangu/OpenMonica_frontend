// 统一的侧边按钮管理
// 用于管理所有页面的侧边导航按钮功能

// 获取当前页面名称
function getCurrentPageName() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    return page.replace('.html', '');
}

// 设置按钮活跃状态
function setActiveButton(activeButtonId) {
    // 移除所有按钮的活跃状态
    const allButtons = document.querySelectorAll('aside button');
    allButtons.forEach(button => {
        button.classList.remove('bg-purple-100', 'text-purple-600', 'bg-purple-50');
        button.classList.add('hover:bg-gray-100');
        const icon = button.querySelector('.material-icons');
        if (icon) {
            icon.classList.remove('text-purple-600');
            icon.classList.add('text-gray-600');
        }
    });

    // 设置当前按钮为活跃状态
    const activeButton = document.getElementById(activeButtonId);
    if (activeButton) {
        activeButton.classList.remove('hover:bg-gray-100');
        activeButton.classList.add('bg-purple-100', 'text-purple-600');
        const icon = activeButton.querySelector('.material-icons');
        if (icon) {
            icon.classList.remove('text-gray-600');
            icon.classList.add('text-purple-600');
        }
    }
}

// 绑定聊天按钮
function bindChatButton() {
    const chatButton = document.getElementById('chatButton');
    if (!chatButton) return;
    
    chatButton.addEventListener('click', () => {
        if (getCurrentPageName() !== 'index') {
            window.location.href = 'index.html';
        }
    });
}

// 绑定画笔按钮
function bindBrushButton() {
    const brushButton = document.getElementById('brushButton');
    if (!brushButton) return;
    
    brushButton.addEventListener('click', () => {
        if (getCurrentPageName() !== 'brush') {
            window.location.href = 'brush.html';
        }
    });
}

// 绑定帮助按钮
function bindHelpButton() {
    const helpButton = document.getElementById('helpButton');
    if (!helpButton) return;
    
    helpButton.addEventListener('click', () => {
        if (getCurrentPageName() !== 'help') {
            window.location.href = 'help.html';
        }
    });
}

// 绑定设置按钮
function bindSettingsButton() {
    const settingsButton = document.getElementById('settingsButton');
    if (!settingsButton) return;
    
    settingsButton.addEventListener('click', () => {
        if (getCurrentPageName() !== 'settings') {
            window.location.href = 'settings.html';
        }
    });
}
    

// 初始化侧边按钮
function initSideButtons() {
    // 绑定所有按钮事件
    bindChatButton();
    bindBrushButton();
    bindHelpButton();
    bindSettingsButton();
    
    // 根据当前页面设置活跃按钮
    const currentPage = getCurrentPageName();
    switch (currentPage) {
        case 'index':
            setActiveButton('chatButton');
            break;
        case 'brush':
            setActiveButton('brushButton');
            break;
        case 'help':
            setActiveButton('helpButton');
            break;
        case 'settings':
            setActiveButton('settingsButton');
            break;
        default:
            // 默认高亮聊天按钮
            setActiveButton('chatButton');
    }
    
    console.log('侧边按钮初始化完成，当前页面:', currentPage);
}

// 页面加载完成后自动初始化
document.addEventListener('DOMContentLoaded', () => {
    initSideButtons();
});
