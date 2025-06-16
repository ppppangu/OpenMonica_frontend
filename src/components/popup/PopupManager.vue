<template>
  <teleport to="body">
    <div v-if="hasVisiblePopups" class="popup-manager">
      <transition-group
        name="popup"
        tag="div"
        class="popup-stack"
      >
        <BasePopup
          v-for="popup in visiblePopups"
          :key="popup.id"
          :id="popup.id"
          :visible="popup.visible"
          :title="popup.title"
          :width="popup.width"
          :height="popup.height"
          :closable="popup.closable"
          :mask-closable="popup.maskClosable"
          :keyboard="popup.keyboard"
          :centered="popup.centered"
          :z-index="calculateZIndex(popup)"
          :class-name="popup.className"
          :loading="popup.loading"
          @close="handleClose(popup.id)"
          @cancel="handleCancel(popup.id)"
          @overlay-click="handleOverlayClick(popup.id)"
        >
          <component
            v-if="popup.component"
            :is="popup.component"
            v-bind="popup.props || {}"
            :popup-id="popup.id"
            @close="handleClose(popup.id)"
            @cancel="handleCancel(popup.id)"
            @ok="handleOk(popup.id, $event)"
          />
          <div v-else class="popup-error">
            Component not found
          </div>

          <template v-if="popup.props?.footerSlot" #footer="slotProps">
            <component
              :is="popup.props.footerSlot"
              v-bind="slotProps"
              :popup-id="popup.id"
            />
          </template>
        </BasePopup>
      </transition-group>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePopupManagerStore } from '../../store/popup_manager'
import BasePopup from './BasePopup.vue'

const popupStore = usePopupManagerStore()

// Computed properties
const hasVisiblePopups = computed(() => popupStore.hasVisiblePopups)
const visiblePopups = computed(() => popupStore.visiblePopups)

// Methods
function calculateZIndex(popup: any): number {
  return popupStore.calculateZIndex(popup)
}

function handleClose(id: string): void {
  popupStore.hide(id)
}

function handleCancel(id: string): void {
  popupStore.cancel(id)
}

function handleOk(id: string, result?: any): void {
  popupStore.hide(id, result)
}

function handleOverlayClick(id: string): void {
  popupStore.handleBackgroundClick(id)
}
</script>

<style scoped>
.popup-manager {
  position: relative;
  z-index: 1000;
}

.popup-stack {
  position: relative;
}

/* Transition animations */
.popup-enter-active,
.popup-leave-active {
  transition: all 0.3s ease;
}

.popup-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(-20px);
}

.popup-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(-20px);
}

.popup-enter-to,
.popup-leave-from {
  opacity: 1;
  transform: scale(1) translateY(0);
}

/* Stagger animation for multiple popups */
.popup-stack > * {
  transition-delay: calc(var(--popup-index, 0) * 0.1s);
}

.popup-error {
  padding: 20px;
  text-align: center;
  color: #ff4d4f;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  margin: 20px;
}
</style>
