// 帮助页面功能
document.addEventListener('DOMContentLoaded', () => {
    // 导航链接激活状态管理
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            // 移除所有激活状态
            navLinks.forEach(l => l.classList.remove('active'));
            // 添加当前链接的激活状态
            this.classList.add('active');
        });
    });

    // 平滑滚动到锚点
    const anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href')?.substring(1);
            const targetElement = targetId ? document.getElementById(targetId) : null;

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});