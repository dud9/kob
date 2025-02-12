import type { DataTableColumns } from 'naive-ui';
import { Paw } from '@vicons/ionicons5';
import { NAvatar, NButton, NEllipsis, NIcon, NIconWrapper, NTag } from 'naive-ui';
import defaultAvatar from '~/assets/default-avatar.png';
import type { Record } from '~/types';

interface ColumnOptions {
  createRowNumber?: (rowIndex: number) => number
  canDelete?: (aId: number, bId: number) => boolean
  checkVideo?: (record: Record) => void | Promise<void>
  onRemoveRecord?: (record: Record) => void | Promise<void>
}

export function createColumns({
  createRowNumber,
  canDelete,
  checkVideo,
  onRemoveRecord,
}: ColumnOptions): DataTableColumns<Record> {
  return [
    {
      key: 'id',
      title: '序号',
      align: 'center',
      render: (_, rowIndex) => createRowNumber?.(rowIndex),
    },
    {
      title: '玩家A',
      key: 'aId',
      align: 'center',
      render: ({ aAvatar, aName, loser }) =>
        renderPlayer(aAvatar, aName, !!loser && !['all', 'A'].includes(loser)),
    },
    {
      title: '玩家B',
      key: 'bId',
      align: 'center',
      render: ({ bAvatar, bName, loser }) =>
        renderPlayer(bAvatar, bName, !!loser && !['all', 'B'].includes(loser)),
    },
    {
      title: '对局模式',
      key: 'mode',
      align: 'center',
      render: ({ mode }) => h(
        NTag,
        { type: mode === 'match' ? 'error' : 'warning' },
        () => mode === 'match' ? '匹配对战' : '人机试炼',
      ),
    },
    {
      title: '对战结果',
      key: 'loser',
      align: 'center',
      render: ({ loser }) => {
        const resultMap = {
          A: '玩家B获胜',
          B: '玩家A获胜',
          all: '平局',
        };
        return resultMap[loser as keyof typeof resultMap] ?? '-';
      },
    },
    {
      title: '对战时间',
      key: 'description',
      align: 'center',
      render: ({ createTime }) => formatDate({ date: createTime }),
    },
    {
      title: '操作',
      key: 'actions',
      align: 'center',
      render: (row) => {
        const btnArray = [
          h(
            NButton,
            {
              size: 'small',
              type: 'primary',
              textColor: 'white',
              onClick: () => checkVideo?.(row),
            },
            { default: () => '查看录像' },
          ),
        ];

        if (canDelete?.(row.aId, row.bId)) {
          btnArray.push(
            h(
              NButton,
              {
                size: 'small',
                type: 'error',
                textColor: 'white',
                style: { marginLeft: '10px' },
                onClick: () => onRemoveRecord?.(row),
              },
              { default: () => '删除' },
            ),
          );
        }

        return h('div', {}, btnArray);
      },
    },
  ];
}

function renderPlayer(avatar?: string, name?: string, win = false) {
  const widgets = [
    h(NAvatar, {
      size: 'small',
      round: true,
      src: avatar ?? defaultAvatar,
    }),
    h(NEllipsis, {
      maxWidth: '200px',
      style: { marginLeft: '10px' },
    }, () => name),
  ];

  if (win) {
    widgets.push(h(NIconWrapper, {
      size: 24,
      borderRadius: 10,
      color: '#886BFA',
      iconColor: 'white',
      style: { marginLeft: '10px' },
    }, () => h(NIcon, {
      size: 16,
      component: Paw,
    })));
  }

  return h('div', {
    style: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
  }, widgets);
}
