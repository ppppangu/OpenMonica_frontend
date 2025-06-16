# Vue.js Popup System - Practical Examples & Troubleshooting

## Real-World Implementation Examples

### 1. Multi-Step Wizard Popup

```vue
<!-- components/popup/WizardPopup.vue -->
<template>
  <div class="wizard-popup">
    <!-- Progress indicator -->
    <div class="wizard-progress">
      <div 
        v-for="(step, index) in steps" 
        :key="index"
        class="progress-step"
        :class="{ 
          active: index === currentStep, 
          completed: index < currentStep 
        }"
      >
        {{ step.title }}
      </div>
    </div>
    
    <!-- Step content -->
    <div class="wizard-content">
      <component 
        :is="currentStepComponent" 
        v-model="wizardData"
        @next="handleNext"
        @previous="handlePrevious"
        @finish="handleFinish"
      />
    </div>
    
    <!-- Navigation -->
    <div class="wizard-navigation">
      <a-button 
        v-if="currentStep > 0" 
        @click="handlePrevious"
      >
        Previous
      </a-button>
      
      <a-button 
        v-if="currentStep < steps.length - 1"
        type="primary" 
        @click="handleNext"
        :disabled="!canProceed"
      >
        Next
      </a-button>
      
      <a-button 
        v-if="currentStep === steps.length - 1"
        type="primary" 
        @click="handleFinish"
        :loading="finishing"
      >
        Finish
      </a-button>
      
      <a-button @click="$emit('cancel')">
        Cancel
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface WizardStep {
  title: string
  component: string
  validation?: (data: any) => boolean
}

interface Props {
  steps: WizardStep[]
  initialData?: Record<string, any>
  popupId: string
}

const props = defineProps<Props>()
const emit = defineEmits(['close', 'cancel'])

const currentStep = ref(0)
const wizardData = ref(props.initialData || {})
const finishing = ref(false)

const currentStepComponent = computed(() => {
  return props.steps[currentStep.value]?.component
})

const canProceed = computed(() => {
  const step = props.steps[currentStep.value]
  return !step.validation || step.validation(wizardData.value)
})

function handleNext(): void {
  if (currentStep.value < props.steps.length - 1) {
    currentStep.value++
  }
}

function handlePrevious(): void {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

async function handleFinish(): Promise<void> {
  finishing.value = true
  
  try {
    // Process wizard data
    await processWizardData(wizardData.value)
    emit('close', wizardData.value)
  } catch (error) {
    console.error('Wizard completion failed:', error)
  } finally {
    finishing.value = false
  }
}

async function processWizardData(data: any): Promise<void> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000))
}
</script>

<style scoped>
.wizard-popup {
  width: 700px;
  height: 600px;
  display: flex;
  flex-direction: column;
}

.wizard-progress {
  display: flex;
  margin-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 16px;
}

.progress-step {
  flex: 1;
  text-align: center;
  padding: 8px;
  border-radius: 4px;
  font-size: 14px;
  color: #8c8c8c;
  background: #f5f5f5;
  margin-right: 8px;
}

.progress-step:last-child {
  margin-right: 0;
}

.progress-step.active {
  background: #8b5cf6;
  color: white;
}

.progress-step.completed {
  background: #52c41a;
  color: white;
}

.wizard-content {
  flex: 1;
  overflow: auto;
  padding: 16px 0;
}

.wizard-navigation {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}
</style>
```

### 2. Image Gallery Popup with Navigation

```vue
<!-- components/popup/ImageGalleryPopup.vue -->
<template>
  <div class="image-gallery-popup">
    <div class="gallery-header">
      <h3>{{ title }}</h3>
      <span class="image-counter">
        {{ currentIndex + 1 }} / {{ images.length }}
      </span>
    </div>
    
    <div class="gallery-content">
      <button 
        v-if="images.length > 1"
        class="nav-button nav-previous"
        @click="previousImage"
        :disabled="currentIndex === 0"
      >
        <LeftOutlined />
      </button>
      
      <div class="image-container">
        <img 
          :src="currentImage.url" 
          :alt="currentImage.alt"
          @load="handleImageLoad"
          @error="handleImageError"
        />
        
        <div v-if="currentImage.caption" class="image-caption">
          {{ currentImage.caption }}
        </div>
      </div>
      
      <button 
        v-if="images.length > 1"
        class="nav-button nav-next"
        @click="nextImage"
        :disabled="currentIndex === images.length - 1"
      >
        <RightOutlined />
      </button>
    </div>
    
    <div class="gallery-thumbnails" v-if="images.length > 1">
      <div 
        v-for="(image, index) in images"
        :key="index"
        class="thumbnail"
        :class="{ active: index === currentIndex }"
        @click="setCurrentImage(index)"
      >
        <img :src="image.thumbnail || image.url" :alt="image.alt" />
      </div>
    </div>
    
    <div class="gallery-actions">
      <a-button @click="downloadImage">
        <DownloadOutlined /> Download
      </a-button>
      <a-button @click="$emit('close')">
        Close
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { LeftOutlined, RightOutlined, DownloadOutlined } from '@ant-design/icons-vue'

interface GalleryImage {
  url: string
  thumbnail?: string
  alt: string
  caption?: string
}

interface Props {
  images: GalleryImage[]
  initialIndex?: number
  title?: string
  popupId: string
}

const props = withDefaults(defineProps<Props>(), {
  initialIndex: 0,
  title: 'Image Gallery'
})

const emit = defineEmits(['close'])

const currentIndex = ref(props.initialIndex)

const currentImage = computed(() => props.images[currentIndex.value])

function nextImage(): void {
  if (currentIndex.value < props.images.length - 1) {
    currentIndex.value++
  }
}

function previousImage(): void {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

function setCurrentImage(index: number): void {
  currentIndex.value = index
}

function handleKeydown(event: KeyboardEvent): void {
  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      previousImage()
      break
    case 'ArrowRight':
      event.preventDefault()
      nextImage()
      break
  }
}

function handleImageLoad(): void {
  console.log('Image loaded successfully')
}

function handleImageError(): void {
  console.error('Failed to load image')
}

async function downloadImage(): Promise<void> {
  try {
    const response = await fetch(currentImage.value.url)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `image-${currentIndex.value + 1}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Download failed:', error)
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.image-gallery-popup {
  width: 90vw;
  height: 90vh;
  max-width: 1200px;
  max-height: 800px;
  display: flex;
  flex-direction: column;
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.gallery-content {
  flex: 1;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.nav-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.nav-button:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.7);
}

.nav-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.nav-previous {
  left: 16px;
}

.nav-next {
  right: 16px;
}

.image-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 80px;
}

.image-container img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.image-caption {
  margin-top: 16px;
  text-align: center;
  color: #595959;
  font-style: italic;
}

.gallery-thumbnails {
  display: flex;
  gap: 8px;
  padding: 16px 0;
  overflow-x: auto;
  border-top: 1px solid #f0f0f0;
}

.thumbnail {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.thumbnail.active {
  border-color: #8b5cf6;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}
</style>
```

## Common Troubleshooting Issues

### 1. Popup Not Showing

**Problem**: Popup doesn't appear when triggered

**Solutions**:
```typescript
// Check if PopupManager is mounted in your app
// App.vue
<template>
  <div id="app">
    <router-view />
    <!-- Make sure this is included -->
    <PopupManager />
  </div>
</template>

// Verify store is properly initialized
// main.ts
import { createPinia } from 'pinia'
const pinia = createPinia()
app.use(pinia)

// Check for component loading errors
async function showPopup() {
  try {
    const PopupComponent = await import('@/components/popup/MyPopup.vue')
    console.log('Component loaded:', PopupComponent.default)
    
    await popupStore.show({
      component: PopupComponent.default,
      title: 'Test Popup'
    })
  } catch (error) {
    console.error('Failed to load popup:', error)
  }
}
```

### 2. Z-Index Issues

**Problem**: Popups appear behind other elements

**Solutions**:
```css
/* Ensure popup container has high z-index */
.popup-manager {
  z-index: 9999 !important;
}

/* Check for competing z-index values */
.some-other-element {
  z-index: 1000; /* Lower than popup base z-index */
}

/* Use CSS custom properties for dynamic z-index */
.base-popup-overlay {
  z-index: var(--popup-z-index, 1000);
}
```

### 3. Memory Leaks

**Problem**: Popups not properly cleaned up

**Solutions**:
```typescript
// Ensure proper cleanup in components
import { onUnmounted } from 'vue'

export default {
  setup() {
    const popupStore = usePopupManagerStore()
    
    // Clean up on component unmount
    onUnmounted(() => {
      popupStore.hideAll()
    })
    
    // Clear intervals/timeouts
    let interval: number
    
    onUnmounted(() => {
      if (interval) {
        clearInterval(interval)
      }
    })
  }
}

// Monitor popup store for memory leaks
// Add to popup store
function debugPopupCount(): void {
  console.log('Active popups:', popups.value.size)
  console.log('Visible popups:', visiblePopups.value.length)
}
```

### 4. Event Handling Issues

**Problem**: Events not propagating correctly

**Solutions**:
```vue
<!-- Ensure proper event handling -->
<template>
  <BasePopup @close="handleClose" @cancel="handleCancel">
    <!-- Use .stop to prevent event bubbling when needed -->
    <div @click.stop>
      <button @click="handleButtonClick">Click me</button>
    </div>
  </BasePopup>
</template>

<script setup>
// Handle events properly
function handleClose(result?: any): void {
  console.log('Popup closed with result:', result)
  // Don't forget to emit to parent
  emit('close', result)
}

function handleCancel(): void {
  console.log('Popup cancelled')
  emit('cancel')
}
</script>
```

### 5. Responsive Design Issues

**Problem**: Popups don't work well on mobile

**Solutions**:
```css
/* Mobile-responsive popup styles */
@media (max-width: 768px) {
  .base-popup-container {
    width: 95vw !important;
    height: 95vh !important;
    max-width: none !important;
    max-height: none !important;
    margin: 0 !important;
  }
  
  .base-popup-overlay {
    padding: 8px !important;
  }
}

/* Touch-friendly button sizes */
.popup-actions button {
  min-height: 44px;
  min-width: 44px;
}
```

### 6. Performance Issues

**Problem**: Slow popup rendering or animations

**Solutions**:
```typescript
// Lazy load popup components
const PopupComponent = defineAsyncComponent({
  loader: () => import('@/components/popup/HeavyPopup.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorComponent,
  delay: 200,
  timeout: 3000
})

// Optimize animations
// Use transform instead of changing layout properties
.popup-enter-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.popup-enter-from {
  transform: scale(0.9) translateY(-20px);
  opacity: 0;
}

// Debounce rapid popup triggers
import { debounce } from 'lodash-es'

const debouncedShowPopup = debounce(showPopup, 300)
```

### 7. TypeScript Issues

**Problem**: Type errors with popup components

**Solutions**:
```typescript
// Define proper types for popup props
interface PopupProps {
  popupId: string
  [key: string]: any
}

// Use generic types for type-safe popup results
interface PopupResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

async function showTypedPopup<T>(
  component: Component,
  props?: Record<string, any>
): Promise<PopupResult<T>> {
  try {
    const result = await popupStore.show({
      component,
      props
    })
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Extend popup store types if needed
declare module '@/store/popup_manager' {
  interface PopupConfig {
    customProperty?: string
  }
}
```

## Performance Optimization Tips

1. **Lazy Loading**: Always use dynamic imports for popup components
2. **Component Caching**: Cache frequently used popup components
3. **Event Delegation**: Use event delegation for better performance
4. **Animation Optimization**: Use CSS transforms instead of layout changes
5. **Memory Management**: Properly clean up event listeners and timers
6. **Bundle Splitting**: Split popup components into separate chunks

## Best Practices Summary

1. Always handle both success and error cases when showing popups
2. Use TypeScript for better type safety
3. Implement proper cleanup in component lifecycle hooks
4. Test popup behavior on different screen sizes
5. Provide keyboard navigation support
6. Use semantic HTML for accessibility
7. Implement proper loading and error states
8. Follow consistent naming conventions
9. Document popup component APIs clearly
10. Test popup interactions thoroughly
