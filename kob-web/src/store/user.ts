import type { LoginState, User } from '~/types'
import defaultAvatar from '~/assets/avatar.jpg'
import { getToken, removeToken, setToken } from '~/utils'

/** 存储 `token` 的键 */
const TOKEN_KEY = 'jwt_token'

export const useUserStore = defineStore(
  'userStore',
  () => {
    const user = ref<User>()
    // 是否登录
    const hasLogin = ref(false)
    // 是否打开登录 / 注册 `Modal`
    const authModalVisible = ref(false)

    function getUserToken() {
      return getToken(TOKEN_KEY)
    }

    function setUserToken(token: string) {
      setToken(TOKEN_KEY, token)
    }

    /**
     * 判断是否登录 && `token` 是否过期
     * `token` 过期需要清空
     * @return
     *  - `hasLogin` - 已经登录 & `token` 未过期
     *  - `notLogin` - 未登录
     *  - `expire` - `token `过期
     */
    async function checkLoginState(): Promise<LoginState> {
      const token = getUserToken()
      if (!token) {
        hasLogin.value = false
        return 'notLogin'
      }

      const { code, data } = await UserApi.getLoginUserInfo()
      const validation = code !== 0 || !data
      hasLogin.value = !validation
      return validation
        ? 'expire'
        : 'hasLogin'
    }

    async function updateUser() {
      const { code, data } = await UserApi.getLoginUserInfo()
      if (code !== 0 || !data)
        return
      if (!data.avatar)
        data.avatar = defaultAvatar
      user.value = data
    }

    function removeUser() {
      user.value = undefined
    }

    function setAuthModalVisible(value: boolean) {
      authModalVisible.value = value
    }

    function login(token: string) {
      hasLogin.value = true
      updateUser()
      setUserToken(token)
    }

    function logout() {
      hasLogin.value = false
      removeUser()
      removeToken(TOKEN_KEY)
    }

    return {
      user,
      hasLogin,
      authModalVisible,
      updateUser,
      removeUser,
      getUserToken,
      setUserToken,
      login,
      logout,
      checkLoginState,
      setAuthModalVisible,
    }
  },
  {
    persist: {
      enabled: true,
    },
  },
)
