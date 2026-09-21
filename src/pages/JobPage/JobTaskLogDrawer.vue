<template>
  <n-drawer
    v-model:show="visible"
    to="#main_content"
    :width="900"
    :block-scroll="false"
    :trap-focus="false"
    @after-leave="resetState"
  >
    <n-drawer-content :title="drawerTitle" closable>
      <n-space class="log-toolbar" align="center" wrap>
        <n-tag size="small" :type="statusTagType" round>
          {{ taskStatus || '-' }}
        </n-tag>
        <span>{{ t('task.instanceAddr') }}：{{ instanceAddr || '-' }}</span>
        <n-select
          v-if="attemptOptions.length > 1"
          class="attempt-select"
          v-model:value="selectedAttempt"
          :options="attemptOptions"
          :disabled="loading"
          @update:value="handleAttemptChange"
        />
        <n-space align="center" size="small">
          <span>{{ t('task.autoRefreshLog') }}</span>
          <n-switch
            v-model:value="autoRefresh"
            @update:value="handleAutoRefresh"
          />
        </n-space>
        <n-button size="small" :loading="loading" @click="loadLog(false)">
          {{ t('common.refresh') }}
        </n-button>
        <n-button size="small" :loading="loading" @click="loadLog(true)">
          {{ t('task.reloadLog') }}
        </n-button>
      </n-space>
      <n-alert v-if="isEnd" class="log-status" type="success" :bordered="false">
        {{ t('task.logFinished') }}
      </n-alert>
      <n-log
        ref="logRef"
        class="task-log"
        :log="logContent"
        :loading="loading"
        :rows="32"
        trim
      />
      <template #footer>
        <n-button @click="visible = false">{{ t('common.return') }}</n-button>
      </template>
    </n-drawer-content>
  </n-drawer>
</template>

<script setup>
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { jobApi } from '@/api/job';
import { handleApiResult, printApiError } from '@/utils/request';

const { t } = useI18n();
const visible = ref(false);
const loading = ref(false);
const autoRefresh = ref(true);
const logContent = ref('');
const fromLineNum = ref(1);
const isEnd = ref(false);
const selectedAttempt = ref(0);
const taskInfo = ref(null);
const taskStatus = ref('');
const instanceAddr = ref('');
const logRef = ref(null);
let timerId = null;
let requestVersion = 0;

const drawerTitle = computed(() => {
  const taskId = taskInfo.value?.taskId || '';
  return `${t('task.executionLog')} #${taskId}`;
});

const attemptOptions = computed(() => {
  const retryLogs = Array.isArray(taskInfo.value?.tryLogs)
    ? taskInfo.value.tryLogs
    : [];
  return Array.from({ length: retryLogs.length + 1 }, (_, index) => ({
    value: index,
    label: t('task.attemptNumber', { number: index + 1 }),
    disabled: index === retryLogs.length && !taskInfo.value?.instanceAddr
  }));
});

const statusTagType = computed(() => {
  if (taskStatus.value === 'SUCCESS') return 'success';
  if (taskStatus.value === 'FAIL') return 'error';
  if (taskStatus.value === 'RUNNING') return 'warning';
  return 'info';
});

const clearTimer = () => {
  if (timerId !== null) {
    window.clearTimeout(timerId);
    timerId = null;
  }
};

const scheduleNextLoad = () => {
  clearTimer();
  if (visible.value && autoRefresh.value && !isEnd.value) {
    timerId = window.setTimeout(() => loadLog(false), 3000);
  }
};

const scrollToBottom = () => {
  nextTick(() => logRef.value?.scrollTo({ position: 'bottom' }));
};

const normalizeLogContent = (content) =>
  content.replace(/<br\s*\/?\s*>/gi, '\n');

const loadLog = async (reset) => {
  if (!visible.value || loading.value || !taskInfo.value) return;
  if (reset) {
    logContent.value = '';
    fromLineNum.value = 1;
    isEnd.value = false;
  }
  clearTimer();
  loading.value = true;
  const version = ++requestVersion;
  try {
    const response = await jobApi.getJobTaskLog({
      jobId: taskInfo.value.jobId,
      taskId: taskInfo.value.taskId,
      fromLineNum: fromLineNum.value,
      attempt: selectedAttempt.value
    });
    const result = handleApiResult(response);
    if (!result || version !== requestVersion || !visible.value) return;
    if (
      result.logContent &&
      result.toLineNum >= result.fromLineNum &&
      result.fromLineNum === fromLineNum.value
    ) {
      logContent.value += normalizeLogContent(result.logContent);
      fromLineNum.value = result.toLineNum + 1;
      scrollToBottom();
    }
    taskStatus.value = result.taskStatus;
    instanceAddr.value = result.instanceAddr;
    isEnd.value = result.isEnd;
    if (isEnd.value) autoRefresh.value = false;
  } catch (error) {
    printApiError(error);
    autoRefresh.value = false;
  } finally {
    if (version === requestVersion) {
      loading.value = false;
      scheduleNextLoad();
    }
  }
};

const handleAttemptChange = () => loadLog(true);

const handleAutoRefresh = (enabled) => {
  if (enabled) scheduleNextLoad();
  else clearTimer();
};

const open = (task) => {
  clearTimer();
  requestVersion += 1;
  taskInfo.value = task;
  taskStatus.value = task.status;
  instanceAddr.value = task.instanceAddr || '';
  const retryLogCount = Array.isArray(task.tryLogs) ? task.tryLogs.length : 0;
  selectedAttempt.value = task.instanceAddr
    ? retryLogCount
    : Math.max(0, retryLogCount - 1);
  logContent.value = '';
  fromLineNum.value = 1;
  isEnd.value = false;
  autoRefresh.value = task.status === 'RUNNING';
  visible.value = true;
  nextTick(() => loadLog(false));
};

const resetState = () => {
  clearTimer();
  requestVersion += 1;
  loading.value = false;
  taskInfo.value = null;
  logContent.value = '';
  fromLineNum.value = 1;
};

watch(visible, (show) => {
  if (!show) clearTimer();
});

onUnmounted(clearTimer);

defineExpose({ open });
</script>

<style scoped>
.log-toolbar {
  margin-bottom: 12px;
}

.attempt-select {
  width: 140px;
}

.log-status {
  margin-bottom: 8px;
}

.task-log {
  border: 1px solid #e5e7eb;
  border-radius: 4px;
}
</style>
