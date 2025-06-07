// 知识库卡片菜单功能
document.addEventListener('DOMContentLoaded', () => {
    const cardMenuButtons = document.querySelectorAll('.knowledge-card-menu');

    cardMenuButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            // 这里可以添加菜单显示逻辑
            console.log('知识库菜单点击');
        });
    });
});