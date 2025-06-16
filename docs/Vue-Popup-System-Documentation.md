# Vue.js Popup/Bubble Management System - Technical Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Code Coupling Relationships](#code-coupling-relationships)
3. [State Management &amp; Storage](#state-management--storage)
4. [Interaction Logic](#interaction-logic)
5. [Information Flow](#information-flow)
6. [Implementation Examples](#implementation-examples)

## Architecture Overview

### System Components Hierarchy

The popup management system follows a **TopView-style centralized container architecture** with the following component hierarchy:

```
Application Root
├── PopupManager (Teleported to body)
│   ├── BasePopup (Container for each popup)
│   │   ├── Header (Title + Close button)
│   │   ├── Content (Dynamic component slot)
│   │   └── Footer (Optional action buttons)
│   └── Transition Group (Animation management)
└── Popup Store (Pinia state management)
```

### Core Components

1. **PopupManager.vue** - The centralized container that manages all popups
2. **BasePopup.vue** - Individual popup wrapper with common functionality
3. **usePopupManagerStore** - Pinia store for state management
4. **Specific Popup Components** - Content components (e.g., ToolDetailPopup.vue)

### Layering System

Popups are layered using a **z-index management system**:

- Base z-index: 1000
- Each additional popup: +10 z-index
- Automatic stacking order based on creation timestamp
- Top popup receives focus and keyboard events

## Code Coupling Relationships

### Parent-Child Component Structure

```vue
<!-- PopupManager.vue (Top-level container) -->
<template>
  <teleport to="body">
    <BasePopup v-for="popup in visiblePopups" :key="popup.id">
      <component :is="popup.component" v-bind="popup.props" />
    </BasePopup>
  </teleport>
</template>
```

### Component Communication Patterns

#### 1. Store-to-Component Communication

```typescript
// Store triggers component updates
const popupStore = usePopupManagerStore()
const visiblePopups = computed(() => popupStore.visiblePopups)
```

#### 2. Component-to-Store Communication

```typescript
// Components call store methods
function handleClose(id: string): void {
  popupStore.hide(id)
}
```

#### 3. Event Propagation

```vue
<!-- BasePopup emits events up to PopupManager -->
<BasePopup @close="handleClose" @cancel="handleCancel" />

<!-- PopupManager handles and forwards to store -->
function handleClose(id: string): void {
  popupStore.hide(id)
}
```

### Dependency Injection

The system uses **prop passing** and **provide/inject** patterns:

```typescript
// Props passed down the component tree
interface PopupProps {
  popupId: string
  toolCall: ToolCallState
}

// Popup components receive popup-specific data
const props = defineProps<PopupProps>()
```

### Integration with Existing Components

Popup system integrates seamlessly with existing Vue components:

```typescript
// Any component can trigger popups
async function showDetailPopup(toolCall: ToolCallState): Promise<void> {
  const { usePopupManagerStore } = await import('../store/popup_manager')
  const ToolDetailPopup = await import('./popup/ToolDetailPopup.vue')
  const popupStore = usePopupManagerStore()

  try {
    await popupStore.show({
      component: ToolDetailPopup.default,
      title: `Tool Details: ${toolCall.toolName}`,
      width: 900,
      height: 700,
      props: { toolCall }
    })
  } catch (error) {
    console.log('Popup cancelled:', error)
  }
}
```

## State Management & Storage

### Pinia Store Structure

The popup state is managed through a centralized Pinia store:

```typescript
// Store state structure
interface PopupState {
  id: string
  component: Component | string
  props?: Record<string, any>
  title?: string
  width?: number | string
  height?: number | string
  visible: boolean
  loading: boolean
  timestamp: number
  promise?: {
    resolve: (value?: any) => void
    reject: (reason?: any) => void
  }
  // Configuration options
  closable?: boolean
  maskClosable?: boolean
  keyboard?: boolean
  centered?: boolean
  zIndex?: number
  className?: string
}
```

### Global vs Local State Decisions

#### Global State (Pinia Store)

- **Popup visibility and configuration** - Managed globally for cross-component access
- **Z-index management** - Centralized to prevent conflicts
- **Keyboard navigation state** - Global setting affects all popups
- **Promise-based communication** - Stored globally for async operations

#### Local Component State

- **Form data within popups** - Kept local to specific popup components
- **UI interaction states** - Loading states, validation errors
- **Component-specific animations** - Managed by individual components

### Data Flow Architecture

```
Trigger Component → Store Action → State Update → Reactive UI Update
     ↓                                                    ↑
Promise Creation ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
     ↓                                                    ↑
Async Wait ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
     ↓                                                    ↑
Result/Cancel ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
```

## Interaction Logic

### Show/Hide API with Promise-based Communication

#### Basic Show Method

```typescript
async function show(config: PopupConfig): Promise<any> {
  const id = generateId()
  
  return new Promise((resolve, reject) => {
    const popup: PopupState = {
      ...config,
      id,
      visible: true,
      promise: { resolve, reject },
      timestamp: Date.now()
    }
  
    popups.value.set(id, popup)
  
    // Auto-focus management
    nextTick(() => focusPopup(id))
  })
}
```

#### Hide with Result

```typescript
function hide(id: string, result?: any): void {
  const popup = popups.value.get(id)
  if (!popup) return
  
  popup.visible = false
  
  // Resolve promise with result
  if (popup.promise) {
    popup.promise.resolve(result)
  }
  
  // Cleanup after animation
  setTimeout(() => popups.value.delete(id), 300)
}
```

### Keyboard Navigation Support

#### ESC Key Handling

```typescript
function handleKeydown(event: KeyboardEvent): void {
  if (!keyboardNavigation.value || !hasVisiblePopups.value) return
  
  const currentPopup = topPopup.value
  if (!currentPopup) return
  
  switch (event.key) {
    case 'Escape':
      if (currentPopup.keyboard && currentPopup.closable) {
        event.preventDefault()
        hide(currentPopup.id)
      }
      break
  }
}
```

#### Tab Navigation

```typescript
function handleTabNavigation(event: KeyboardEvent, popupId: string): void {
  const popup = document.querySelector(`[data-popup-id="${popupId}"]`)
  const focusableElements = popup.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  
  // Trap focus within popup
  const firstElement = focusableElements[0] as HTMLElement
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
  
  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault()
    lastElement.focus()
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault()
    firstElement.focus()
  }
}
```

### Background Click-to-Close

```typescript
function handleBackgroundClick(popupId: string): void {
  const popup = popups.value.get(popupId)
  if (popup && popup.maskClosable) {
    hide(popupId)
  }
}
```

### Multiple Popup Handling

The system supports multiple simultaneous popups with proper z-index management:

```typescript
function calculateZIndex(popup: PopupState): number {
  if (popup.zIndex) return popup.zIndex
  
  const visibleCount = visiblePopups.value.length
  return baseZIndex.value + visibleCount * 10
}
```

## Information Flow

### Data Transmission Patterns

#### 1. Triggering Component → Popup

```typescript
// Data flows through props
await popupStore.show({
  component: ToolDetailPopup,
  props: { 
    toolCall: selectedTool,
    additionalData: someData 
  }
})
```

#### 2. Popup → Parent Component

```typescript
// Results flow back through Promise resolution
try {
  const result = await popupStore.show({ /* config */ })
  console.log('Popup returned:', result)
} catch (error) {
  console.log('Popup was cancelled:', error)
}
```

#### 3. Event Bubbling and Capture

```vue
<!-- Events bubble up from content to container -->
<BasePopup @close="handleClose" @cancel="handleCancel">
  <ToolDetailPopup @close="$emit('close')" />
</BasePopup>
```

### Communication Between Popup and Parent

#### Method 1: Event Emission

```vue
<!-- In popup component -->
<template>
  <button @click="$emit('close', resultData)">Close</button>
</template>

<script setup>
const emit = defineEmits(['close', 'cancel'])
</script>
```

#### Method 2: Direct Store Interaction

```typescript
// In popup component
function closeWithResult(data: any): void {
  const popupStore = usePopupManagerStore()
  popupStore.hide(props.popupId, data)
}
```

### Return Value Handling

```typescript
// Popup components can return data when closing
async function submitForm(): Promise<void> {
  try {
    const formData = await validateForm()
    // Close popup with form data as result
    popupStore.hide(props.popupId, formData)
  } catch (error) {
    // Handle validation errors
    showValidationErrors(error)
  }
}
```

## Implementation Examples

### 1. Basic Popup Component Setup

#### Step 1: Create a Simple Popup Component

```vue
<!-- components/popup/SimpleConfirmPopup.vue -->
<template>
  <div class="simple-confirm-popup">
    <div class="message">
      {{ message }}
    </div>

    <div class="actions">
      <a-button @click="handleCancel">
        Cancel
      </a-button>
      <a-button type="primary" @click="handleConfirm">
        Confirm
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  message: string
  popupId: string
}

interface Emits {
  (e: 'close', result?: boolean): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function handleConfirm(): void {
  // Return true when confirmed
  emit('close', true)
}

function handleCancel(): void {
  // Return false when cancelled
  emit('cancel')
}
</script>

<style scoped>
.simple-confirm-popup {
  padding: 20px;
  text-align: center;
}

.message {
  margin-bottom: 20px;
  font-size: 16px;
  color: #262626;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}
</style>
```

#### Step 2: Integrate PopupManager in Your App

```vue
<!-- App.vue or main layout component -->
<template>
  <div id="app">
    <!-- Your main application content -->
    <router-view />

    <!-- Popup manager - renders all popups -->
    <PopupManager />
  </div>
</template>

<script setup lang="ts">
import PopupManager from '@/components/popup/PopupManager.vue'
</script>
```

### 2. Triggering Popups from Components

#### Basic Confirmation Dialog

```vue
<!-- Any component that needs to show popups -->
<template>
  <div>
    <a-button @click="showConfirmation">
      Delete Item
    </a-button>
  </div>
</template>

<script setup lang="ts">
import { usePopupManagerStore } from '@/store/popup_manager'

const popupStore = usePopupManagerStore()

async function showConfirmation(): Promise<void> {
  try {
    // Import popup component dynamically
    const SimpleConfirmPopup = await import('@/components/popup/SimpleConfirmPopup.vue')

    // Show popup and wait for result
    const confirmed = await popupStore.show({
      component: SimpleConfirmPopup.default,
      title: 'Confirm Deletion',
      width: 400,
      height: 200,
      props: {
        message: 'Are you sure you want to delete this item? This action cannot be undone.'
      }
    })

    if (confirmed) {
      console.log('User confirmed deletion')
      // Proceed with deletion
      await deleteItem()
    } else {
      console.log('User cancelled deletion')
    }
  } catch (error) {
    console.log('Popup was cancelled:', error)
  }
}

async function deleteItem(): Promise<void> {
  // Your deletion logic here
}
</script>
```

### 3. Advanced Form Popup Example

#### Step 1: Create Form Popup Component

```vue
<!-- components/popup/UserFormPopup.vue -->
<template>
  <div class="user-form-popup">
    <a-form
      :model="formData"
      :rules="rules"
      @finish="handleSubmit"
      @finishFailed="handleSubmitFailed"
      layout="vertical"
    >
      <a-form-item label="Name" name="name">
        <a-input v-model:value="formData.name" placeholder="Enter user name" />
      </a-form-item>

      <a-form-item label="Email" name="email">
        <a-input v-model:value="formData.email" placeholder="Enter email address" />
      </a-form-item>

      <a-form-item label="Role" name="role">
        <a-select v-model:value="formData.role" placeholder="Select role">
          <a-select-option value="admin">Admin</a-select-option>
          <a-select-option value="user">User</a-select-option>
          <a-select-option value="viewer">Viewer</a-select-option>
        </a-select>
      </a-form-item>

      <div class="form-actions">
        <a-button @click="handleCancel">
          Cancel
        </a-button>
        <a-button type="primary" html-type="submit" :loading="submitting">
          {{ editMode ? 'Update' : 'Create' }} User
        </a-button>
      </div>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Form, FormItem, Input, Select, SelectOption, Button, message } from 'ant-design-vue'

interface UserData {
  name: string
  email: string
  role: string
}

interface Props {
  popupId: string
  initialData?: UserData
  editMode?: boolean
}

interface Emits {
  (e: 'close', result?: UserData): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  editMode: false
})
const emit = defineEmits<Emits>()

const submitting = ref(false)
const formData = reactive<UserData>({
  name: props.initialData?.name || '',
  email: props.initialData?.email || '',
  role: props.initialData?.role || ''
})

const rules = {
  name: [{ required: true, message: 'Please enter user name' }],
  email: [
    { required: true, message: 'Please enter email address' },
    { type: 'email', message: 'Please enter valid email address' }
  ],
  role: [{ required: true, message: 'Please select a role' }]
}

async function handleSubmit(): Promise<void> {
  submitting.value = true

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    message.success(`User ${props.editMode ? 'updated' : 'created'} successfully`)

    // Return form data as result
    emit('close', { ...formData })
  } catch (error) {
    message.error('Failed to save user')
  } finally {
    submitting.value = false
  }
}

function handleSubmitFailed(): void {
  message.error('Please fix form errors')
}

function handleCancel(): void {
  emit('cancel')
}
</script>

<style scoped>
.user-form-popup {
  padding: 20px;
  min-width: 400px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}
</style>
```

#### Step 2: Using the Form Popup

```typescript
// In any component
async function createUser(): Promise<void> {
  try {
    const UserFormPopup = await import('@/components/popup/UserFormPopup.vue')

    const userData = await popupStore.show({
      component: UserFormPopup.default,
      title: 'Create New User',
      width: 500,
      props: {
        editMode: false
      }
    })

    console.log('New user data:', userData)
    // Handle the returned user data
  } catch (error) {
    console.log('User creation cancelled')
  }
}

async function editUser(existingUser: UserData): Promise<void> {
  try {
    const UserFormPopup = await import('@/components/popup/UserFormPopup.vue')

    const updatedUserData = await popupStore.show({
      component: UserFormPopup.default,
      title: 'Edit User',
      width: 500,
      props: {
        editMode: true,
        initialData: existingUser
      }
    })

    console.log('Updated user data:', updatedUserData)
    // Handle the updated user data
  } catch (error) {
    console.log('User edit cancelled')
  }
}
```

### 4. Error Handling and Edge Cases

#### Handling Component Loading Errors

```typescript
async function showPopupWithErrorHandling(): Promise<void> {
  try {
    // Try to load the component
    const PopupComponent = await import('@/components/popup/SomePopup.vue')

    const result = await popupStore.show({
      component: PopupComponent.default,
      title: 'My Popup',
      // Error handling configuration
      onError: (error: Error) => {
        console.error('Popup error:', error)
        message.error('Popup encountered an error')
      }
    })

    console.log('Popup result:', result)
  } catch (importError) {
    console.error('Failed to load popup component:', importError)
    message.error('Failed to load popup')
  } catch (popupError) {
    console.log('Popup was cancelled or failed:', popupError)
  }
}
```

#### Handling Multiple Popup Scenarios

```typescript
// Prevent multiple instances of the same popup
const activePopups = new Set<string>()

async function showUniquePopup(popupType: string): Promise<void> {
  if (activePopups.has(popupType)) {
    message.warning('This popup is already open')
    return
  }

  activePopups.add(popupType)

  try {
    const result = await popupStore.show({
      id: `unique-${popupType}`, // Custom ID for uniqueness
      component: SomePopup,
      title: 'Unique Popup'
    })

    console.log('Result:', result)
  } catch (error) {
    console.log('Popup cancelled')
  } finally {
    activePopups.delete(popupType)
  }
}
```

#### Cleanup and Memory Management

```typescript
// Proper cleanup when component unmounts
import { onUnmounted } from 'vue'

export default {
  setup() {
    const popupStore = usePopupManagerStore()

    // Close all popups when component unmounts
    onUnmounted(() => {
      popupStore.hideAll()
    })

    return {
      showPopup: async () => {
        // Your popup logic
      }
    }
  }
}
```

### 5. Best Practices for Beginners

#### 1. Component Structure Best Practices

```vue
<!-- Good: Well-structured popup component -->
<template>
  <div class="my-popup">
    <!-- Clear content sections -->
    <div class="popup-content">
      <!-- Main content here -->
    </div>

    <!-- Consistent action buttons -->
    <div class="popup-actions">
      <a-button @click="handleCancel">Cancel</a-button>
      <a-button type="primary" @click="handleConfirm">Confirm</a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
// Always define clear interfaces
interface Props {
  popupId: string
  // Other props with clear types
}

interface Emits {
  (e: 'close', result?: any): void
  (e: 'cancel'): void
}

// Use descriptive function names
function handleConfirm(): void {
  // Clear logic
}

function handleCancel(): void {
  // Clear logic
}
</script>
```

#### 2. Store Usage Patterns

```typescript
// Good: Centralized popup utilities
export class PopupUtils {
  static async showConfirmation(message: string): Promise<boolean> {
    const popupStore = usePopupManagerStore()
    const ConfirmPopup = await import('@/components/popup/ConfirmPopup.vue')

    try {
      return await popupStore.show({
        component: ConfirmPopup.default,
        title: 'Confirmation',
        props: { message }
      })
    } catch {
      return false
    }
  }

  static async showUserForm(userData?: UserData): Promise<UserData | null> {
    const popupStore = usePopupManagerStore()
    const UserFormPopup = await import('@/components/popup/UserFormPopup.vue')

    try {
      return await popupStore.show({
        component: UserFormPopup.default,
        title: userData ? 'Edit User' : 'Create User',
        props: {
          editMode: !!userData,
          initialData: userData
        }
      })
    } catch {
      return null
    }
  }
}
```

#### 3. TypeScript Integration

```typescript
// Define clear types for popup configurations
interface PopupConfig {
  component: Component
  title?: string
  width?: number | string
  height?: number | string
  props?: Record<string, any>
  className?: string
}

// Use generic types for type-safe results
async function showTypedPopup<T>(config: PopupConfig): Promise<T> {
  const popupStore = usePopupManagerStore()
  return await popupStore.show(config) as T
}

// Usage with type safety
const userData = await showTypedPopup<UserData>({
  component: UserFormPopup,
  title: 'Create User'
})
```

#### 4. Common Pitfalls to Avoid

```typescript
// ❌ Bad: Not handling promise rejections
popupStore.show({ component: SomePopup })

// ✅ Good: Always handle both success and failure
try {
  const result = await popupStore.show({ component: SomePopup })
  console.log('Success:', result)
} catch (error) {
  console.log('Cancelled or failed:', error)
}

// ❌ Bad: Not cleaning up resources
function showPopup() {
  const interval = setInterval(() => {
    // Some periodic task
  }, 1000)

  popupStore.show({ component: SomePopup })
}

// ✅ Good: Clean up resources properly
async function showPopup() {
  const interval = setInterval(() => {
    // Some periodic task
  }, 1000)

  try {
    await popupStore.show({ component: SomePopup })
  } finally {
    clearInterval(interval)
  }
}
```

### 6. Complete Workflow Example

Here's a complete example showing the entire popup workflow from trigger to cleanup:

```typescript
// 1. Component that triggers popup
export default defineComponent({
  setup() {
    const popupStore = usePopupManagerStore()

    async function handleEditUser(userId: string): Promise<void> {
      try {
        // 2. Load user data
        const userData = await fetchUserData(userId)

        // 3. Show popup with data
        const UserEditPopup = await import('@/components/popup/UserEditPopup.vue')
        const updatedData = await popupStore.show({
          component: UserEditPopup.default,
          title: 'Edit User',
          width: 600,
          height: 500,
          props: {
            userId,
            initialData: userData
          }
        })

        // 4. Handle successful result
        if (updatedData) {
          await saveUserData(userId, updatedData)
          message.success('User updated successfully')

          // 5. Update local state or refresh data
          await refreshUserList()
        }
      } catch (error) {
        // 6. Handle cancellation or errors
        if (error === 'cancelled') {
          console.log('User cancelled edit')
        } else {
          console.error('Error editing user:', error)
          message.error('Failed to edit user')
        }
      }
    }

    return {
      handleEditUser
    }
  }
})
```

This documentation provides a comprehensive guide for implementing and using the Vue.js popup/bubble management system, with clear examples and best practices for beginners.
