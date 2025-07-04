import yaml from 'js-yaml'

export interface AppConfig {
  user_manage_url: string
  file_manage_url: string
  model_chat_url: string
  // 允许包含其他键
  [key: string]: any
}

let cachedConfig: AppConfig | null = null
let loadingPromise: Promise<AppConfig> | null = null

/**
 * 异步加载并缓存 config.yaml
 */
export async function loadConfig(): Promise<AppConfig> {
  if (cachedConfig) return cachedConfig
  if (!loadingPromise) {
    loadingPromise = fetch('/config.yaml')
      .then(res => {
        if (!res.ok) {
          throw new Error(`无法加载 config.yaml: ${res.status}`)
        }
        return res.text()
      })
      .then(text => {
        cachedConfig = yaml.load(text) as AppConfig
        return cachedConfig
      })
      .catch(err => {
        console.error('[ConfigLoader] 加载配置失败，后续请求可能无法发送到正确地址:', err)
        // 返回空占位，避免后续代码报 undefined
        cachedConfig = {
          user_manage_url: '',
          file_manage_url: '',
          model_chat_url: '',
        }
        return cachedConfig
      })
  }
  return loadingPromise
} 