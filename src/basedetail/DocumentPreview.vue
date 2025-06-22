<template>
  <div class="document-preview-container">
    <!-- 预览头部 -->
    <div v-if="activeDocument" class="preview-header">
      <div class="preview-file-info">
        <div class="preview-file-icon">
          <span class="material-icons">{{
            getFileIcon(activeDocument.file_type)
          }}</span>
        </div>
        <div class="preview-file-details">
          <h3 class="preview-file-title">{{ activeDocument.document_name }}</h3>
          <p class="preview-file-meta">
            {{ activeDocument.file_type }} • {{ activeDocument.file_size }} •
            {{ activeDocument.upload_time }}
          </p>
        </div>
      </div>
      <div class="preview-actions">
        <button class="preview-action-btn" @click="handleDownload">
          <span class="material-icons">download</span>
          <span>下载</span>
        </button>
        <button class="preview-action-btn" @click="handleShare">
          <span class="material-icons">share</span>
          <span>分享</span>
        </button>
        <button class="preview-action-btn" @click="handleFullscreen">
          <span class="material-icons">fullscreen</span>
          <span>全屏</span>
        </button>
      </div>
    </div>

    <!-- 预览内容区域 -->
    <div class="preview-content">
      <!-- 有选中文档时显示预览 -->
      <div v-if="activeDocument" class="document-viewer">
        <!-- 固定预览容器 -->
        <div class="preview-viewport">
          <!-- 错误信息 -->
          <div v-if="previewError" class="error-message">
            <div class="error-icon">
              <span class="material-icons">error_outline</span>
            </div>
            <div class="error-content">
              <h4>预览失败</h4>
              <p>{{ previewError }}</p>
              <button class="retry-btn" @click="retryPreview">
                <span class="material-icons">refresh</span>
                重试
              </button>
            </div>
          </div>

          <!-- 加载状态 -->
          <div v-if="isLoadingPreview" class="loading-preview">
            <div class="loading-spinner"></div>
            <p>正在加载文档预览...</p>
            <div class="loading-progress">
              <div class="progress-bar"></div>
            </div>
          </div>

          <!-- 文档预览容器 -->
          <div
            v-show="!isLoadingPreview && !previewError"
            class="preview-container"
            :class="getPreviewContainerClass()"
          >
            <!-- 文档预览iframe -->
            <iframe
              ref="previewFrame"
              class="preview-frame"
              :class="getPreviewFrameClass()"
              :src="previewUrl"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation"
              @load="handleFrameLoad"
              @error="handleFrameError"
            ></iframe>
          </div>
        </div>
      </div>

      <!-- 未选中文档时显示占位符 -->
      <div v-else class="preview-placeholder">
        <div class="placeholder-icon">
          <span class="material-icons">description</span>
        </div>
        <h3 class="placeholder-title">文档预览</h3>
        <p class="placeholder-desc">点击左侧文档列表中的文档来查看内容</p>
        <div class="placeholder-features">
          <p class="features-title">支持的功能：</p>
          <ul class="features-list">
            <li>• PDF文档在线预览</li>
            <li>• 图片文档查看</li>
            <li>• 网页内容预览</li>
            <li>• 文档下载和分享</li>
            <li>• 全屏查看模式</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useKnowledgeBaseDetailStore } from "../store/knowledgebase_detail";

defineOptions({ name: "DocumentPreview" });

// Store
const knowledgeBaseDetailStore = useKnowledgeBaseDetailStore();

// Refs
const previewFrame = ref<HTMLIFrameElement | null>(null);
const isLoadingPreview = ref(false);
const previewError = ref<string | null>(null);
const loadStartTime = ref<number>(0);

// Computed properties
const activeDocument = computed(
  () => knowledgeBaseDetailStore.activeDocumentDetail
);

const previewUrl = computed(() => {
  // Use the new pdf_file_path for direct PDF viewing, fallback to legacy document_url
  const pdfUrl =
    activeDocument.value?.pdf_file_path || activeDocument.value?.document_url;
  if (!pdfUrl) {
    return "about:blank";
  }

  // Use proxy endpoint to avoid CORS issues
  const proxyUrl = new URL('/file/proxy', window.location.origin)
  proxyUrl.searchParams.set('url', pdfUrl)
  proxyUrl.searchParams.set('t', Date.now().toString()) // Prevent caching

  return proxyUrl.toString();
});

// Methods - Define functions before they are used
const clearPreview = () => {
  isLoadingPreview.value = false;
  previewError.value = null;
  if (previewFrame.value) {
    previewFrame.value.src = "about:blank";
  }
};

const loadPreview = async (url: string) => {
  if (!url || url === "about:blank") {
    clearPreview();
    return;
  }

  // Reset state
  previewError.value = null;
  isLoadingPreview.value = true;
  loadStartTime.value = Date.now();

  console.log("Loading preview for URL:", url);

  try {
    // Test proxy endpoint accessibility first
    const proxyTestUrl = new URL('/file/proxy', window.location.origin)
    proxyTestUrl.searchParams.set('url', url)

    const response = await fetch(proxyTestUrl.toString(), {
      method: 'HEAD'
    })

    if (!response.ok) {
      throw new Error(`Proxy response: ${response.status} ${response.statusText}`)
    }

    console.log("Proxy endpoint accessible, loading document");

  } catch (error) {
    console.warn('Proxy accessibility check failed:', error)
    // Continue with loading, let iframe handle the error
  }

  // Set a timeout for loading
  setTimeout(() => {
    if (isLoadingPreview.value) {
      isLoadingPreview.value = false
      previewError.value = '文档加载超时，请检查网络连接或稍后重试'
    }
  }, 20000) // 20 second timeout
};

const getFileIcon = (fileType?: string) => {
  switch (fileType?.toUpperCase()) {
    case "PDF":
      return "picture_as_pdf";
    case "DOCX":
    case "DOC":
      return "description";
    case "TXT":
      return "text_snippet";
    case "MD":
      return "article";
    default:
      return "insert_drive_file";
  }
};

// 获取文档类型
const getDocumentType = () => {
  const pdfUrl =
    activeDocument.value?.pdf_file_path || activeDocument.value?.document_url;
  if (!pdfUrl) return "unknown";

  const url = pdfUrl.toLowerCase();
  const fileType = activeDocument.value.file_type?.toLowerCase();

  if (fileType === "pdf" || url.includes(".pdf")) return "pdf";
  if (fileType === "image" || url.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/))
    return "image";
  if (url.match(/\.(doc|docx)$/)) return "document";
  if (url.match(/\.(txt|md)$/)) return "text";
  if (url.startsWith("http")) return "webpage";

  return "unknown";
};

// 获取预览容器的CSS类
const getPreviewContainerClass = () => {
  const docType = getDocumentType();
  return {
    "preview-container-pdf": docType === "pdf",
    "preview-container-image": docType === "image",
    "preview-container-document": docType === "document",
    "preview-container-text": docType === "text",
    "preview-container-webpage": docType === "webpage",
  };
};

// 获取预览框架的CSS类
const getPreviewFrameClass = () => {
  const docType = getDocumentType();
  return {
    "preview-frame-pdf": docType === "pdf",
    "preview-frame-image": docType === "image",
    "preview-frame-document": docType === "document",
    "preview-frame-text": docType === "text",
    "preview-frame-webpage": docType === "webpage",
  };
};

// 重试预览
const retryPreview = () => {
  const pdfUrl =
    activeDocument.value?.pdf_file_path || activeDocument.value?.document_url;
  if (pdfUrl) {
    loadPreview(pdfUrl);
  }
};

// Watch for document changes to load preview
watch(
  activeDocument,
  (newDocument) => {
    const pdfUrl = newDocument?.pdf_file_path || newDocument?.document_url;
    if (pdfUrl) {
      loadPreview(pdfUrl);
    } else {
      clearPreview();
    }
  },
  { immediate: true }
);

const handleFrameLoad = () => {
  isLoadingPreview.value = false;
  previewError.value = null;

  const loadTime = Date.now() - loadStartTime.value;
  console.log(`Preview loaded in ${loadTime}ms`);
};

const handleFrameError = () => {
  isLoadingPreview.value = false;

  // Try fallback to direct URL if proxy failed
  const directUrl = activeDocument.value?.pdf_file_path || activeDocument.value?.document_url;
  const currentSrc = previewFrame.value?.src;

  if (currentSrc && currentSrc.includes('/file/proxy') && directUrl) {
    console.log("Proxy failed, trying direct URL:", directUrl);
    previewFrame.value!.src = directUrl;
    isLoadingPreview.value = true;

    // Set another timeout for direct load
    setTimeout(() => {
      if (isLoadingPreview.value) {
        isLoadingPreview.value = false;
        previewError.value = "无法加载该文档，可能是网络问题或该文档不允许预览";
      }
    }, 10000);

    return;
  }

  previewError.value = "无法加载该文档，可能是网络问题或该文档不允许预览";
  console.error("Preview frame error");
};

// Event handlers
const handleDownload = () => {
  const pdfUrl =
    activeDocument.value?.pdf_file_path || activeDocument.value?.document_url;
  if (!pdfUrl) {
    console.warn("No document URL available for download");
    return;
  }

  // Create a temporary link to trigger download
  const link = document.createElement("a");
  link.href = pdfUrl;
  link.download = activeDocument.value.document_name || "document";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  console.log("Download initiated for:", activeDocument.value.document_name);
};

const handleShare = () => {
  const pdfUrl =
    activeDocument.value?.pdf_file_path || activeDocument.value?.document_url;
  if (!pdfUrl) {
    console.warn("No document URL available for sharing");
    return;
  }

  // Use Web Share API if available, otherwise copy to clipboard
  if (navigator.share) {
    navigator
      .share({
        title: activeDocument.value.document_name,
        url: pdfUrl,
      })
      .catch((err) => console.log("Error sharing:", err));
  } else {
    // Fallback: copy URL to clipboard
    navigator.clipboard
      .writeText(pdfUrl)
      .then(() => console.log("Document URL copied to clipboard"))
      .catch((err) => console.log("Error copying to clipboard:", err));
  }
};

const handleFullscreen = () => {
  if (!previewFrame.value) {
    console.warn("Preview frame not available");
    return;
  }

  // Request fullscreen for the iframe
  if (previewFrame.value.requestFullscreen) {
    previewFrame.value.requestFullscreen();
  } else if ((previewFrame.value as any).webkitRequestFullscreen) {
    (previewFrame.value as any).webkitRequestFullscreen();
  } else if ((previewFrame.value as any).msRequestFullscreen) {
    (previewFrame.value as any).msRequestFullscreen();
  }

  console.log("Fullscreen requested for preview");
};
</script>

<style scoped>
.document-preview-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.preview-file-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.preview-file-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 0.5rem;
  background: #7c3aed;
  color: white;
}

.preview-file-icon .material-icons {
  font-size: 1.5rem;
}

.preview-file-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.preview-file-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.preview-file-meta {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.preview-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.preview-action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.preview-action-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.preview-action-btn .material-icons {
  font-size: 1rem;
}

.preview-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 1rem 1rem 0;
  position: relative;
  background: #f8fafc;
  box-sizing: border-box;
}

.document-viewer {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-sizing: border-box;
}

/* 固定预览视口 */
.preview-viewport {
  width: calc(100% - 1rem);
  height: calc(100% - 1rem);
  max-height: calc(100vh - 200px);
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

/* 预览容器 - 适应不同文档类型 */
.preview-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  position: relative;
}

/* PDF文档容器 */
.preview-container-pdf {
  padding: 1rem;
}

/* 图片文档容器 */
.preview-container-image {
  padding: 2rem;
  background: #f1f5f9;
}

/* 文档容器 */
.preview-container-document {
  padding: 1.5rem;
}

/* 文本文档容器 */
.preview-container-text {
  padding: 2rem;
  background: #fefefe;
}

/* 网页容器 */
.preview-container-webpage {
  padding: 0;
}

/* 预览框架基础样式 */
.preview-frame {
  border: none;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

/* PDF预览框架 */
.preview-frame-pdf {
  width: 100%;
  height: 100%;
  min-height: 600px;
}

/* 图片预览框架 */
.preview-frame-image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
}

/* 文档预览框架 */
.preview-frame-document {
  width: 100%;
  height: 100%;
  min-height: 500px;
}

/* 文本预览框架 */
.preview-frame-text {
  width: 100%;
  height: 100%;
  min-height: 400px;
  background: #fefefe;
}

/* 网页预览框架 */
.preview-frame-webpage {
  width: 100%;
  height: 100%;
  min-height: 600px;
  border-radius: 0;
}

/* 加载状态样式 */
.loading-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #64748b;
  font-size: 1rem;
  z-index: 10;
}

.loading-spinner {
  width: 3rem;
  height: 3rem;
  border: 3px solid #e2e8f0;
  border-top: 3px solid #7c3aed;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1.5rem;
}

.loading-progress {
  width: 200px;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 1rem;
}

.progress-bar {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #7c3aed, #a855f7);
  border-radius: 2px;
  animation: progress 2s ease-in-out infinite;
}

/* 错误信息样式 */
.error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fef2f2;
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid #fecaca;
  text-align: center;
  max-width: 400px;
  z-index: 10;
}

.error-icon {
  margin-bottom: 1rem;
}

.error-icon .material-icons {
  font-size: 3rem;
  color: #dc2626;
}

.error-content h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #dc2626;
  margin: 0 0 0.5rem 0;
}

.error-content p {
  font-size: 0.875rem;
  color: #7f1d1d;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
}

.retry-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  background: #b91c1c;
  transform: translateY(-1px);
}

.retry-btn .material-icons {
  font-size: 1rem;
}

/* 动画效果 */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes progress {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .preview-viewport {
    max-width: 900px;
    max-height: 600px;
  }
}

@media (max-width: 768px) {
  .preview-content {
    padding: 0.75rem 0.75rem 0.75rem 0;
  }

  .preview-viewport {
    width: calc(100% - 0.75rem);
    height: calc(100% - 0.75rem);
    max-width: 100%;
    max-height: 500px;
    min-height: 400px;
    border-radius: 8px;
  }

  .preview-container {
    padding: 1rem;
  }

  .preview-container-image,
  .preview-container-text {
    padding: 1.5rem;
  }

  .preview-frame-pdf,
  .preview-frame-document,
  .preview-frame-webpage {
    min-height: 400px;
  }

  .error-message {
    max-width: 90%;
    padding: 1.5rem;
  }
}

@media (max-width: 480px) {
  .preview-content {
    padding: 0.5rem 0.5rem 0.5rem 0;
  }

  .preview-viewport {
    width: calc(100% - 0.5rem);
    height: calc(100% - 0.5rem);
    min-height: 300px;
    border-radius: 6px;
  }

  .preview-container {
    padding: 0.75rem;
  }

  .preview-container-image,
  .preview-container-text {
    padding: 1rem;
  }

  .preview-frame-pdf,
  .preview-frame-document,
  .preview-frame-webpage {
    min-height: 300px;
  }

  .loading-progress {
    width: 150px;
  }

  .error-message {
    padding: 1rem;
  }

  .error-content h4 {
    font-size: 1rem;
  }

  .error-content p {
    font-size: 0.8rem;
  }
}

/* Placeholder styles for when no document is selected */
.preview-placeholder {
  text-align: center;
  max-width: 24rem;
}

.placeholder-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 5rem;
  height: 5rem;
  margin: 0 auto 1.5rem;
  border-radius: 1rem;
  background: #f3f4f6;
  color: #9ca3af;
}

.placeholder-icon .material-icons {
  font-size: 2.5rem;
}

.placeholder-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.placeholder-desc {
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 1.5rem 0;
}

.placeholder-features {
  margin-top: 2rem;
  text-align: left;
}

.features-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.75rem 0;
}

.features-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.features-list li {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}
</style>
