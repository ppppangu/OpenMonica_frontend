// 简单的拖拽调整宽度功能
document.addEventListener('DOMContentLoaded', function() {
    const resizeHandle = document.getElementById('resize-handle');
    const fileListContainer = document.getElementById('container-file-list');
    let isResizing = false;

    if (resizeHandle && fileListContainer) {
        resizeHandle.addEventListener('mousedown', function() {
            isResizing = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', function(e) {
            if (!isResizing) return;

            const containerRect = document.getElementById('container-main-layout')?.getBoundingClientRect();
            if (!containerRect) return;

            const newWidth = e.clientX - containerRect.left;

            // 限制宽度范围
            if (newWidth >= 300 && newWidth <= 600) {
                fileListContainer.style.width = newWidth + 'px';
            }
        });

        document.addEventListener('mouseup', function() {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        });
    }

    // 文件项点击切换激活状态
    const fileItems = document.querySelectorAll('.file-item');
    fileItems.forEach(item => {
        item.addEventListener('click', function() {
            // 移除所有激活状态
            fileItems.forEach(i => i.classList.remove('file-item-active'));
            // 添加当前项的激活状态
            this.classList.add('file-item-active');

            // 更新预览区域的文件信息
            const titleElement = this.querySelector('.file-item-title');
            const metaElement = this.querySelector('.file-item-meta');
            const previewTitleElement = document.querySelector('.preview-file-title');
            const previewMetaElement = document.querySelector('.preview-file-meta');

            if (titleElement && metaElement && previewTitleElement && previewMetaElement) {
                const title = titleElement.textContent;
                const meta = metaElement.textContent;

                previewTitleElement.textContent = title;
                previewMetaElement.textContent = meta + ' • 共 45 页';
            }
        });
    });
});