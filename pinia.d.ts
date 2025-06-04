declare module 'pinia' {
  import { App, Plugin } from 'vue'
  
  export interface Pinia extends Plugin {
    install(app: App): void
  }
  
  export function createPinia(): Plugin
  
  export function defineStore(id: string, options: any): any
} 