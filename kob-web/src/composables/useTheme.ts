import type { GlobalThemeOverrides } from 'naive-ui'
import { commonDark, commonLight } from 'naive-ui'
import { generatePrimaryColor } from '~/utils'
import { appLayout } from '~/config'

export const isDark = useDark()
export const toggleDark = useToggle(isDark)

export function useThemeOverrides(): GlobalThemeOverrides {
  const primaryColorOverrides = generatePrimaryColor(appLayout.primaryColor)

  return {
    common: {
      ...primaryColorOverrides,
    },
    LoadingBar: {
      colorLoading: appLayout.primaryColor,
    },
  }
}

const colorPropertyMap: { [key: string]: string } = {
  primaryColor: '--primary-color',
  primaryColorHover: '--primary-color-hover',
  primaryColorPressed: '--primary-color-pressed',
  primaryColorSuppl: '--primary-color-suppl',
  infoColor: '--info-color',
  infoColorHover: '--info-color-hover',
  infoColorPressed: '--info-color-pressed',
  infoColorSuppl: '--info-color-suppl',
  warningColor: '--warning-color',
  warningColorHover: '--warning-color-hover',
  warningColorPressed: '--warning-color-pressed',
  warningColorSuppl: '--warning-color-suppl',
  errorColor: '--error-color',
  errorColorHover: '--error-color-hover',
  errorColorPressed: '--error-color-pressed',
  errorColorSuppl: '--error-color-suppl',
  successColor: '--success-color',
  successColorHover: '--success-color-hover',
  successColorPressed: '--success-color-pressed',
  successColorSuppl: '--success-color-suppl',
}

/**
 * 将 `naive ui` 的通用颜色，并写入 `body`
 */
export function writeThemeColorsToBody() {
  const primaryColorOverrides = generatePrimaryColor(appLayout.primaryColor)

  const colors: any = isDark.value
    ? commonDark
    : commonLight

  const mergedColors = {
    ...colors,
    ...primaryColorOverrides,
  }

  Object.entries(colorPropertyMap).forEach(([key, value]) => {
    document.body.style.setProperty(value, mergedColors[key])
  })
}

watch(isDark, writeThemeColorsToBody)
