// 设置页面功能
document.addEventListener('DOMContentLoaded', () => {
    // 自动保存功能
    let saveTimeout: NodeJS.Timeout;

    // 自动保存指示器
    function showAutoSaveIndicator(indicatorId: string, status: 'saving' | 'saved' | 'error') {
        const indicator = document.getElementById(indicatorId);
        if (!indicator) return;

        indicator.className = 'auto-save-indicator';

        switch (status) {
            case 'saving':
                indicator.textContent = '保存中...';
                indicator.classList.add('saving');
                break;
            case 'saved':
                indicator.textContent = '已保存';
                indicator.classList.add('saved');
                setTimeout(() => {
                    indicator.textContent = '';
                    indicator.className = 'auto-save-indicator';
                }, 2000);
                break;
            case 'error':
                indicator.textContent = '保存失败';
                indicator.classList.add('error');
                setTimeout(() => {
                    indicator.textContent = '';
                    indicator.className = 'auto-save-indicator';
                }, 3000);
                break;
        }
    }

    // 处理文本域自动保存
    function setupAutoSave(textareaSelector: string, indicatorId: string, endpoint: string) {
        const textarea = document.querySelector(textareaSelector) as HTMLTextAreaElement;
        if (!textarea) return;

        textarea.addEventListener('input', () => {
            clearTimeout(saveTimeout);
            showAutoSaveIndicator(indicatorId, 'saving');

            saveTimeout = setTimeout(async () => {
                try {
                    const formData = new FormData();
                    formData.append(textarea.name, textarea.value);

                    const response = await fetch(endpoint, {
                        method: 'POST',
                        body: formData
                    });

                    if (response.ok) {
                        showAutoSaveIndicator(indicatorId, 'saved');
                    } else {
                        showAutoSaveIndicator(indicatorId, 'error');
                    }
                } catch (error) {
                    console.error('保存失败:', error);
                    showAutoSaveIndicator(indicatorId, 'error');
                }
            }, 3000);
        });
    }

    // 设置自动保存
    setupAutoSave('textarea[name="user_prompt"]', 'userPromptAutoSaveIndicator', '/api/settings/user-prompt');
    setupAutoSave('textarea[name="model_memory"]', 'modelMemoryAutoSaveIndicator', '/api/settings/model-memory');
});