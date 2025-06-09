import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from './user_info'


// 模型列表接口
interface Model {
    model_id: string
    model_type: string              // 模型类型,多模态 / 文本
    model_exhibit_name: string
    reasoning_model: boolean
}

export const useModelListStore = defineStore('model_list', () => {
    const model_list = ref<Model[]>([])
    const current_model = ref<Model | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)
    const retryCount = ref(0)
    const maxRetries = 3

    // Utility function for delay with exponential backoff
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    // Calculate delay with exponential backoff
    const getRetryDelay = (attempt: number) => Math.min(1000 * Math.pow(2, attempt), 10000)

    // 输入一个字符串，返回一个boolean，入参为模型名称，出参为模型类型。使用字典匹配的方式，如果入参中有集合中的字符串，则返回ture, 否则返回false。例如集合为['gpt', 'gpt-3.5', 'claude']，则输入'gpt-4'返回true，因为'gpt-4'包含'gpt'，不区分大小写。
    function is_reasoning_model(model_name: string) {
        // 检查输入是否为有效字符串
        if (!model_name || typeof model_name !== 'string') {
            return false
        }

        const model_name_list = [
            'gpt-4',
            'gpt-3.5-turbo',
            'claude-3'
        ]

        return model_name_list.some(name => model_name.toLowerCase().includes(name.toLowerCase())) && model_name.toLowerCase().includes('reasoning')
    }

    async function get_model_list(forceRetry = false) {
        const userStore = useUserStore()

        // Reset retry count if this is a forced retry (user clicked retry button)
        if (forceRetry) {
            retryCount.value = 0
        }

        loading.value = true
        error.value = null

        const attemptFetch = async (attempt: number): Promise<void> => {
            try {
                console.log(`尝试获取模型列表 (第${attempt + 1}次)`)

                const formData = new FormData()
                formData.append('token', userStore.user?.token || '')

                const response = await fetch(`/user/model/get_list`, {
                    method: 'POST',
                    body: formData,
                    signal: AbortSignal.timeout(30000) // 30 second timeout
                })

                // 检查响应是否成功
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}))
                    const errorMessage = errorData.message || `HTTP error! status: ${response.status}`
                    throw new Error(errorMessage)
                }

                const contentType = response.headers.get('content-type')
                if (!contentType || !contentType.includes('application/json')) {
                    const text = await response.text()
                    console.error('Response is not JSON:', text.substring(0, 200))
                    throw new Error('服务器返回了无效的响应格式')
                }

                const data = await response.json()
                console.log('获取模型列表响应:', data)

                // 处理API响应
                if (data.success === false) {
                    throw new Error(data.message || '获取模型列表失败')
                }

                if (data.data && data.data.length > 0) {
                    if (Array.isArray(data.data)) {
                        // 解析数据为Model[]，响应中的id为model_id，owned_by为model_type，alias为model_exhibit_name，reasoning_model使用is_reasoning_model函数判断
                        model_list.value = data.data.map((model: any) => ({
                            model_id: model.id || '',
                            model_type: model.owned_by || '',
                            model_exhibit_name: model.alias || '未知模型',
                            reasoning_model: is_reasoning_model(model.alias || '')
                        }))
                        // 如果没有选中的模型，默认选择第一个
                        if (!current_model.value && model_list.value.length > 0) {
                            current_model.value = model_list.value[0]
                            console.log('自动选择第一个模型作为当前模型:', current_model.value)
                        }

                        // 成功获取数据，重置错误状态
                        error.value = null
                        retryCount.value = 0
                        console.log('模型列表获取成功:', model_list.value)
                    } else {
                        console.error('模型列表数据格式错误:', data)
                        throw new Error('模型列表数据格式错误')
                    }
                } else {
                    console.error('获取模型列表失败:', data.message || '未知错误')
                    throw new Error(data.message || '服务器返回了空的模型列表')
                }
            } catch (fetchError: any) {
                console.error(`获取模型列表失败 (第${attempt + 1}次):`, fetchError)

                // 如果还有重试机会，进行重试
                if (attempt < maxRetries - 1) {
                    const delayMs = getRetryDelay(attempt)
                    console.log(`${delayMs}ms 后进行第${attempt + 2}次重试...`)
                    await delay(delayMs)
                    return attemptFetch(attempt + 1)
                } else {
                    // 所有重试都失败了，设置错误状态
                    retryCount.value = attempt + 1
                    let errorMessage = '获取模型列表失败'

                    if (fetchError.name === 'TimeoutError' || fetchError.message.includes('timeout')) {
                        errorMessage = '连接超时，请检查网络连接后重试'
                    } else if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('NetworkError')) {
                        errorMessage = '网络连接失败，请检查网络后重试'
                    } else if (fetchError.message) {
                        errorMessage = fetchError.message
                    }

                    error.value = errorMessage
                    // 不清空现有的模型列表，保持之前的状态
                    throw fetchError
                }
            }
        }

        try {
            await attemptFetch(0)
        } catch (finalError) {
            console.error('所有重试都失败了:', finalError)
            // 错误已经在 attemptFetch 中设置了，这里不需要再设置
        } finally {
            loading.value = false
        }
    }

    function setCurrentModel(model: Model) {
        console.log('设置当前模型:', model);
        current_model.value = model
        console.log('当前模型已更新为:', current_model.value?.model_exhibit_name);
    }

    // 计算属性：当前模型的显示名称
    const currentModelName = computed(() => {
        return current_model.value?.model_exhibit_name || '选择模型'
    })

    // Retry function for manual retry
    const retryGetModelList = () => {
        return get_model_list(true)
    }

    return {
        model_list,
        current_model,
        loading,
        error,
        retryCount,
        maxRetries,
        currentModelName,
        get_model_list,
        retryGetModelList,
        setCurrentModel
    }

})