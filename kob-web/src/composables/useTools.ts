import dayjs from 'dayjs'
import type { ConfigProviderProps } from 'naive-ui'
import {
  createDiscreteApi,
  darkTheme,
  lightTheme,
} from 'naive-ui'
import { appMeta } from '~/config'

/**
 * 创建页面 `head` 数据
 */
export function useHeadMeta() {
  const { appShortName } = appMeta
  useHead({
    title: appShortName,
    link: [
      {
        rel: 'icon',
        href: '/favicon.ico',
      },
    ],
  })
}

export {
  dayjs,
}

/**
 * 格式化时间
 */
export function formatDate({
  date = new Date(),
  pattern = 'YYYY-MM-DD HH:mm:ss',
}: {
  date?: Date | string | number
  pattern?: string
}) {
  return dayjs(date).format(pattern)
}

/**
 * 封装 `loading` 通用方法
 */
export function useLoading(initValue = false) {
  const {
    bool: loading,
    setBool: setLoading,
    setTrue: startLoading,
    setFalse: endLoading,
    toggle: toggleLoading,
  } = useBoolean(initValue)

  return {
    loading,
    setLoading,
    startLoading,
    endLoading,
    toggleLoading,
  }
}

export function useGlobalNaiveApi() {
  const configProviderProps = computed<ConfigProviderProps>(() => {
    return {
      theme: isDark.value
        ? darkTheme
        : lightTheme,
    }
  })

  const {
    dialog,
    message,
    notification,
    loadingBar,
  } = createDiscreteApi(
    ['message', 'dialog', 'notification', 'loadingBar'],
    { configProviderProps },
  )

  return {
    dialog,
    message,
    notification,
    loadingBar,
  }
}

