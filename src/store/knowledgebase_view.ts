import { defineStore } from 'pinia'

export type KnowledgebaseView = 'dashboard' | 'detail' | 'graph'

export const useKnowledgebaseViewStore = defineStore('knowledgebaseView', {
  state: () => ({
    currentView: 'dashboard' as KnowledgebaseView
  }),
  actions: {
    setCurrentView(view: KnowledgebaseView) {
      this.currentView = view
    }
  }
}) 