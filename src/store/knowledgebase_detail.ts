import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useUserStore } from './user_info'

interface KnowledgeBaseDetail {
  id: string
  doucment_name: string
  document_description: string
  document_url: string
  document_markdown_url: string
  document_type: string
  document_size: number
}

export const useKnowledgeBaseDetailStore = defineStore('knowledgeBaseDetail', () => {
  
