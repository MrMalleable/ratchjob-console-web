import { NButton, NPopconfirm, NTag } from 'naive-ui';
import { useI18n } from 'vue-i18n';
import template from 'template_js';

export const createColumns = function ({ showUpdate, remove, webResources }) {
  const { t } = useI18n();
  const removeConfirmSlots = {
    trigger: () => {
      return (
        <NButton size="tiny" quaternary type="error">
          {t('common.delete')}
        </NButton>
      );
    }
  };

  const columns = [
    {
      title: t('namespace.namespaceName'),
      key: 'namespaceName'
    },
    {
      title: t('namespace.namespaceId'),
      key: 'namespaceId'
    },
    {
      title: t('common.operation'),
      key: 'type',
      fixed: 'right',
      render(row) {
        if (!row.namespaceId) {
          return (
            <NTag type="info" size="small">
              {t('namespace.retain_space')}
            </NTag>
          );
        }

        let editButton;
        let removePopconfirm;
        if (webResources.canUpdateNamespace) {
          editButton = (
            <NButton
              size="tiny"
              quaternary
              type="info"
              onClick={() => showUpdate(row)}
            >
              {t('common.edit')}
            </NButton>
          );
          removePopconfirm = (
            <NPopconfirm
              onPositiveClick={() => remove(row)}
              v-slots={removeConfirmSlots}
            >
              <span>
                {template(t('namespace.confirm_delete_info'), {
                  name: row.namespaceName,
                  id: row.namespaceId
                })}
              </span>
            </NPopconfirm>
          );
        } else {
          editButton = <span></span>;
          removePopconfirm = editButton;
        }

        return (
          <div>
            {editButton}
            {removePopconfirm}
          </div>
        );
      }
    }
  ];
  return columns;
};
