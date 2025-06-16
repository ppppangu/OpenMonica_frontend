import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from './user_info'
import { useModelListStore } from './model_list'

interface UserRawInput {
    user_id: string
    text: string
    images: string[]
    file_list: string[]
    predict_text: string
    extra_request_list: {
        name: string
        parameters: {
            name: string
            value: string
        }[]
    }[]
    extra_request_messages: {}[]
    user_input_messages: {
        role: "user"
        content: ({
            type: "text"
            text: string
        } | {
            type: "image_url"
            image_url: {
                url: string
            }
        } | {
            type: "file"
            file_url: string
        })[]
    }[]
    full_input_messages: {
        role: "user"
        content: ({
            type: "text"
            text: string
        } | {
            type: "image_url"
            image_url: {
                url: string
            }
        } | {
            type: "file"
            file_url: string
        })[] | string
    }[]
    model_ids: string[]
}

export const useUserInputStore = defineStore('user_input', () => {
    const user_input = ref<UserRawInput>({
        user_id: '',
        text: '',
        images: [],
        file_list: [],
        predict_text: '',
        extra_request_list: [],
        extra_request_messages: [],
        user_input_messages: [],
        full_input_messages: [],
        model_ids: []
    })

    function update_user_input(name: keyof UserRawInput, value: any) {
        (user_input.value as any)[name] = value
        console.log('user_input.value', user_input.value)
    }

    // 略，将extra_request_list转为extra_request_messages
    async function process_extra_request_list() {}

    // Chat sending functionality
    async function sendChat(): Promise<any> {
        const userStore = useUserStore()
        const modelListStore = useModelListStore()

        // Get user_id from global state
        const userId = userStore.user?.id
        if (!userId) {
            throw new Error('User not authenticated')
        }

        // Get token for authentication
        const token = userStore.user?.token
        if (!token) {
            throw new Error('Authentication token not found')
        }

        // Validate that we have text to send
        if (!user_input.value.text || user_input.value.text.trim() === '') {
            throw new Error('Please enter a message')
        }

        await process_extra_request_list()

        // Create formatted user message with text and file attachments
        const messageContent: any[] = []

        // Add text content if present
        if (user_input.value.text.trim()) {
            messageContent.push({
                type: "text" as const,
                text: user_input.value.text
            })
        }

        // Add image attachments
        for (const imageUrl of user_input.value.images) {
            messageContent.push({
                type: "image_url" as const,
                image_url: {
                    url: imageUrl
                }
            })
        }

        // Add file attachments
        for (const fileUrl of user_input.value.file_list) {
            messageContent.push({
                type: "file" as const,
                file_url: fileUrl
            })
        }

        // Ensure we have at least some content
        if (messageContent.length === 0) {
            throw new Error('No content to send (text, images, or files)')
        }

        const formattedUserMessage = {
            role: "user" as const,
            content: messageContent
        }

        // Store the formatted user message
        user_input.value.user_input_messages = [formattedUserMessage]

        console.log('Formatted user message with attachments:', formattedUserMessage)

        // Combine extra_request_messages with user_input_messages
        // User message should always be the last element
        user_input.value.full_input_messages = [
            ...user_input.value.extra_request_messages as any[],
            formattedUserMessage
        ]

        // Convert model_ids to model names using the model list store
        const models: string[] = []
        if (user_input.value.model_ids.length === 0) {
            console.log('No models selected, use current_model')
            if (modelListStore.current_model?.model_id) {
                models.push(modelListStore.current_model.model_id)
            }
        }

        for (const modelId of user_input.value.model_ids) {
            const model = modelListStore.model_list.find((m: any) => m.model_id === modelId)
            if (model) {
                models.push(model.model_id)
            }
        }

        if (models.length === 0) {
            throw new Error('No valid models selected')
        }

        // Prepare the data to send
        const chatData = {
            user_id: userId,
            full_input_messages: user_input.value.full_input_messages,
            models: models
        }

        console.log('Sending chat data:', chatData)

        // Handle multiple models vs single model
        if (models.length > 1) {
            // Multiple models: make asynchronous requests
            return await sendMultipleModelRequests(chatData, token)
        } else {
            // Single model: handle as normal streaming response
            return await sendSingleModelRequest(chatData, token)
        }
    }

    // Helper function for multiple model requests
    async function sendMultipleModelRequests(chatData: any, token: string): Promise<any[]> {
        const promises = chatData.models.map(async (model: string) => {
            const formData = new FormData()
            formData.append('token', token)
            formData.append('user_id', chatData.user_id)
            formData.append('model_id', model)
            formData.append('user_message_list', JSON.stringify(chatData.full_input_messages))
            formData.append('extra_request_list', JSON.stringify(user_input.value.extra_request_list))

            try {
                const response = await fetch('/user/chat', {
                    method: 'POST',
                    body: formData
                })

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }

                const data = await response.json()
                return {
                    model: model,
                    success: true,
                    data: data
                }
            } catch (error) {
                console.error(`Error sending request to model ${model}:`, error)
                return {
                    model: model,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                }
            }
        })

        // Wait for all requests to complete
        const results = await Promise.all(promises)
        console.log('Multiple model results:', results)
        return results
    }

    // Helper function for single model request
    async function sendSingleModelRequest(chatData: any, token: string): Promise<any> {
        const formData = new FormData()
        formData.append('token', token)
        formData.append('user_id', chatData.user_id)
        formData.append('model_id', chatData.models[0])
        formData.append('user_message_list', JSON.stringify(chatData.full_input_messages))
        formData.append('extra_request_list', JSON.stringify(user_input.value.extra_request_list))

        try {
            const response = await fetch('/user/chat', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()
            console.log('Single model response:', data)
            return data
        } catch (error) {
            console.error('Error sending single model request:', error)
            throw error
        }
    }

    return {
        user_input,
        update_user_input,
        sendChat
    }
})

