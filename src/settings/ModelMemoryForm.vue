<template>
  <div id="container-model-memory" class="container-model-memory">
    <div class="settings-section-header">
      <div class="settings-section-title-group">
        <h2 class="settings-section-title">模型记忆</h2>
        <div id="modelMemoryAutoSaveIndicator" class="auto-save-indicator">
          {{ saveStatus }}
        </div>
      </div>
    </div>
    <div class="settings-section-content">
      <p class="settings-section-description">
        AI对您的了解和记忆。修改后1秒内自动保存。
      </p>
      <div class="settings-form">
        <textarea
          v-model="modelMemory"
          @input="onInput"
          class="settings-textarea settings-textarea-blue"
          placeholder="AI将在这里记录对您的了解..."
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useUserStore } from "../store/user_info";

// 使用用户store
const userStore = useUserStore();

// 响应式数据
const modelMemory = ref("");
const saveStatus = ref("");

// 自动保存定时器
let saveTimeout: NodeJS.Timeout;

// 自动保存状态显示
function showSaveStatus(status: "saving" | "saved" | "error") {
  switch (status) {
    case "saving":
      saveStatus.value = "保存中...";
      break;
    case "saved":
      saveStatus.value = "已保存";
      setTimeout(() => {
        saveStatus.value = "";
      }, 2000);
      break;
    case "error":
      saveStatus.value = "保存失败";
      setTimeout(() => {
        saveStatus.value = "";
      }, 3000);
      break;
  }
}

// 获取模型记忆数据
async function getModelMemory(): Promise<string> {
  try {
    const user_id = userStore.user?.id;
    const token = userStore.user?.token;
    if (!user_id) {
      console.error("用户ID不存在");
      return "";
    }

    const formData = new FormData();
    formData.append("token", token || "");
    formData.append("user_id", user_id);

    const response = await fetch("/user/settings/get_model_memory", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const text = await response.text();

      // 检查响应是否为空
      if (!text || text.trim() === "") {
        return "";
      }

      try {
        const data = JSON.parse(text);

        // 如果data本身就是字符串，直接返回
        if (typeof data === "string") {
          return data;
        }

        // 如果data是对象，尝试获取data字段
        return data?.data || "";
      } catch (parseError) {
        // 如果JSON解析失败，可能API直接返回了字符串内容
        // 去掉字符串两端的引号（如果有的话）
        const cleanText = text.replace(/^"(.*)"$/, "$1");
        return cleanText;
      }
    } else {
      console.error("获取模型记忆失败:", response.status, response.statusText);
      return "";
    }
  } catch (error) {
    console.error("获取模型记忆失败:", error);
    return "";
  }
}

// 保存模型记忆
async function saveModelMemory(value: string): Promise<boolean> {
  try {
    const user_id = userStore.user?.id;
    const token = userStore.user?.token;
    if (!user_id) {
      console.error("用户ID不存在");
      return false;
    }

    const formData = new FormData();
    formData.append("user_id", user_id);
    formData.append("token", token || "");
    formData.append("new_text", value);

    const response = await fetch("/user/settings/update_model_memory", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const result = await response.json();
      return true;
    } else {
      console.error("模型记忆保存失败:", response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error("模型记忆保存失败:", error);
    return false;
  }
}

// 输入处理
function onInput() {
  clearTimeout(saveTimeout);
  showSaveStatus("saving");

  saveTimeout = setTimeout(async () => {
    const success = await saveModelMemory(modelMemory.value);
    showSaveStatus(success ? "saved" : "error");
  }, 1000);
}

// 初始化数据
async function initData() {
  const modelMemoryData = await getModelMemory();
  modelMemory.value = modelMemoryData;
}

// 组件挂载时初始化
onMounted(async () => {
  // 初始化用户store
  await userStore.initializeFromStorage();

  // 检查用户是否已登录
  if (!userStore.isLoggedIn) {
    console.log("User not authenticated, redirecting to login...");
    window.location.href = "/src/login/signin.html";
    return;
  }

  // 初始化数据
  await initData();
});
</script>
