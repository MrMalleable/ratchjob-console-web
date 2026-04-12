<template>
  <div class="wrap">
    <div class="header">
      <div class="title">
        <span>{{ t('menu.namespace_management') }}</span>
      </div>
      <div class="header-button">
        <n-space align="baseline">
          <n-button tertiary @click="doLoadNamespace">
            {{ t('common.refresh') }}
          </n-button>
          <n-button
            v-if="webResources.canUpdateNamespace"
            type="info"
            @click="showCreate"
          >
            {{ t('namespace.new_namespace') }}
          </n-button>
        </n-space>
      </div>
    </div>
    <div class="content-wrap">
      <div class="form-container">
        <n-data-table
          remote
          ref="table"
          :scroll-x="600"
          :bordered="false"
          :columns="columns"
          :data="dataRef"
          :loading="loadingRef"
          :row-key="rowKey"
        />
      </div>
    </div>
    <n-drawer
      to="#main_content"
      :block-scroll="false"
      :trap-focus="false"
      v-model:show="useForm"
      default-width="600"
      resizable
    >
      <n-drawer-content :title="drawerTitle" closable>
        <n-form label-placement="left" label-width="auto">
          <n-form-item :label="t('namespace.namespaceId')" path="namespaceId">
            <n-input
              v-model:value="modelRef.namespaceId"
              :placeholder="t('namespace.namespaceId_or')"
              :disabled="modelRef.mode === 'update'"
              clearable
            />
          </n-form-item>
          <n-form-item
            :label="t('namespace.namespaceName')"
            path="namespaceName"
          >
            <n-input
              v-model:value="modelRef.namespaceName"
              :placeholder="t('namespace.namespaceName')"
              clearable
            />
          </n-form-item>
        </n-form>
        <template #footer>
          <n-space align="baseline">
            <n-button text @click="closeForm">
              {{ t('common.return') }}
            </n-button>
            <n-button type="primary" @click="submit">
              {{ t('common.confirm') }}
            </n-button>
          </n-space>
        </template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { createColumns } from '@/pages/NamespacePage/NamespaceColumns.jsx';
import { useWebResources } from '@/data/resources';
import { namespaceStore } from '@/data/namespace';
import namespaceApi from '@/api/namespace';
import {
  handleApiResult,
  printApiSuccess,
  printApiError
} from '@/utils/request';
import * as constant from '@/types/constant';

const { t } = useI18n();
const webResources = useWebResources();

const defaultModel = {
  namespaceId: '',
  namespaceName: '',
  mode: constant.FORM_MODE_CREATE
};

const loadingRef = ref(false);
const useForm = ref(false);
const modelRef = ref({ ...defaultModel });
const dataRef = ref([]);

const drawerTitle = computed(() => {
  return modelRef.value.mode === constant.FORM_MODE_CREATE
    ? t('namespace.add_namespace')
    : t('namespace.edit_namespace');
});

const rowKey = function (rowData) {
  return rowData.namespaceId || 'default';
};

const doLoadNamespace = function () {
  loadingRef.value = true;
  namespaceApi
    .queryList()
    .then(handleApiResult)
    .then((list) => {
      dataRef.value = list || [];
      namespaceStore.setLastList(list || []);
      loadingRef.value = false;
    })
    .catch((err) => {
      printApiError(err);
      dataRef.value = [];
      loadingRef.value = false;
    });
};

const showCreate = function () {
  modelRef.value = {
    mode: constant.FORM_MODE_CREATE,
    ...defaultModel
  };
  useForm.value = true;
};

const showUpdate = function (row) {
  modelRef.value = {
    mode: constant.FORM_MODE_UPDATE,
    namespaceId: row.namespaceId,
    namespaceName: row.namespaceName
  };
  useForm.value = true;
};

const removeItem = function (row) {
  namespaceApi
    .delete({
      namespaceId: row.namespaceId
    })
    .then(handleApiResult)
    .then(printApiSuccess)
    .then(() => {
      doLoadNamespace();
    })
    .catch(printApiError);
};

const closeForm = function () {
  useForm.value = false;
};

const submit = function () {
  if (!modelRef.value.namespaceName) {
    window.$message?.error(
      t('namespace.namespaceName') + ' ' + t('common.required')
    );
    return;
  }

  const param = {
    id: modelRef.value.namespaceId,
    name: modelRef.value.namespaceName
  };

  const apiCall =
    modelRef.value.mode === constant.FORM_MODE_CREATE
      ? namespaceApi.add({
          namespaceId: modelRef.value.namespaceId,
          namespaceName: modelRef.value.namespaceName
        })
      : namespaceApi.update({
          namespaceId: modelRef.value.namespaceId,
          namespaceName: modelRef.value.namespaceName
        });

  apiCall
    .then(handleApiResult)
    .then(printApiSuccess)
    .then(() => {
      useForm.value = false;
      doLoadNamespace();
    })
    .catch(printApiError);
};

const columns = createColumns({ showUpdate, remove: removeItem, webResources });

onMounted(() => {
  doLoadNamespace();
});
</script>

<style scoped>
.wrap {
  position: relative;
  width: 100%;
  height: 100%;
  background: #efefef;
}

.content-wrap {
  padding: 10px 10px 10px 10px;
  background: #efefef;
}

.form-container {
  display: flex;
  flex-direction: column;
  position: relative;
  background: #ffffff;
  border-radius: 8px;
  padding: 16px 8px;
}

.header {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 40px;
  border-bottom: #ccc 1px solid;
  background: #fff;
  padding-right: 3px;
}

.title {
  flex: 1 1 auto;
  font: 14/1.25;
  line-height: 40px;
  padding-left: 15px;
}

.header-button {
  flex: 0 0 auto;
}
</style>
