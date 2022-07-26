import axios, { AxiosRequestConfig } from "axios";

import { getStorage } from './storage'

const api = axios.create({
  baseURL: 'https://api.twitch.tv/helix'
})

interface TokenProps {
  accessToken: string
}

api.interceptors.request.use(async config => {
  const { accessToken } = await getStorage({ key: '@streamData:user' }) as TokenProps
  if (accessToken) {
    const { headers } = config
    const configWithToken = {
      ...config,
      headers: {
        ...headers,
        Authorization: `Bearer ${accessToken}`,
        "Client-id": 'a03q5t3ym2lyy45u4o9f0170eai09z'

      }
    }
    return configWithToken
  }
  return config
})

export { api }
