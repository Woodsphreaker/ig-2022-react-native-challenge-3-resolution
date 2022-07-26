import { api } from '../api';
import { generateRandom } from 'expo-auth-session/build/PKCE';
import { makeRedirectUri, revokeAsync, startAsync } from 'expo-auth-session';
import { getStorage, deleteStore } from '../storage'

interface AuthorizationResponse {
  params: {
    access_token: string,
    state: string,
    token_type: string,
  }
  type: 'success' | 'cancel' | 'error' | 'dismiss'
}

interface UserInfo {
  sub: string
}

interface UserData {
  id: number;
  name: string;
  email: string;
  photo: string;
  accessToken: string;
}

interface TokenProps {
  accessToken: string
}

const twitchEndpoints = {
  authorization: 'https://id.twitch.tv/oauth2/authorize',
  userInfo: 'https://id.twitch.tv/oauth2/userinfo',
  userData: 'https://api.twitch.tv/helix/users',
  revocation: 'https://id.twitch.tv/oauth2/revoke'
};

const AUTH_CONFIG = {
  url: twitchEndpoints.authorization,
  redirectUri: makeRedirectUri({ useProxy: true }),
  clientId: 'a03q5t3ym2lyy45u4o9f0170eai09z',
  responseType: 'token',
  state: generateRandom(30),
  forceVerify: true,
  scopes: encodeURIComponent("openid user:read:email user:read:follows"),
}

const createAuthUrl = () => {
  const { url, redirectUri, clientId, responseType, forceVerify, state, scopes } = AUTH_CONFIG
  return `${url}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&force_verify=${forceVerify}&state=${state}&scope=${scopes}`
}

const getAuthToken = async (): Promise<AuthorizationResponse> => {
  const authUrl = createAuthUrl()
  const response = await startAsync({ authUrl })
  return response as AuthorizationResponse
}

const getUserInfo = async (accessToken: string): Promise<UserInfo> => {
  const url = twitchEndpoints.userInfo
  const { data: userInfo } = await api.get(url, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`
    }
  })
  return {
    sub: userInfo.sub
  }
}

const getUserData = async ({ accessToken, userID }: { accessToken: string, userID: string }): Promise<UserData> => {
  const url = `${twitchEndpoints.userData}?id=${userID}`
  const { data: { data: [userData] } } = await api.get(url, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
      "Client-Id": AUTH_CONFIG.clientId
    }
  })

  return {
    id: userData.id,
    name: userData.display_name,
    email: userData.email,
    photo: userData.profile_image_url,
    accessToken
  }
}

const logoutWithTwitch = async (): Promise<void> => {
  const { accessToken } = await getStorage({ key: '@streamData:user' }) as TokenProps
  const url = twitchEndpoints.revocation
  await api.post(`${url}?token=${accessToken}&client_id${AUTH_CONFIG.clientId}`)
}


const authWithTwitch = async (): Promise<UserData> => {
  const { type, params } = await getAuthToken()

  if (type === 'success') {
    const userInfo = await getUserInfo(params.access_token)
    const userData = await getUserData({
      accessToken: params.access_token,
      userID: userInfo.sub
    })
    return userData
  }
  throw new Error("Ocorreu um erro ao tentar logar no app")
}


export { authWithTwitch, logoutWithTwitch }