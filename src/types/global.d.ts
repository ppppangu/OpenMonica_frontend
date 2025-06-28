declare global {
  interface KnowledgeBaseUtils {
    showError: (msg: string) => void;
    hideLoading: () => void;
  }
  interface Window {
    KnowledgeBaseUtils?: KnowledgeBaseUtils;
    __VUE_APP__?: any;
    __PINIA__?: any;
  }
}
export {}
