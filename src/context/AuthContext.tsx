import React, { useEffect, createContext, useContext, useState, ReactNode } from 'react';
import { Alert } from 'react-native'

import { setStorage, getStorage, deleteStore } from '../services/storage'

import { authWithTwitch, logoutWithTwitch } from '../services/AuthServices'

interface UserData {
  id: number;
  name: string;
  email: string;
  photo: string;
  authToken?: string;
}

export interface AuthContextData {
  user: UserData;
  isAuthenticated: boolean;
  isLoggingOut: boolean;
  isLoggingIn: boolean;
  signInWithTwitch: () => Promise<void>;
  revokeAccess: () => Promise<void>;
}

interface AuthProviderData {
  children: ReactNode;
}

const INITIAL_USER_DATA: UserData = {
  id: 0,
  name: '',
  email: '',
  photo: 'https://i.pravatar.cc/300',
}

const AuthContext = createContext({} as AuthContextData);

const AuthenticationProvider = ({ children }: AuthProviderData) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [user, setUser] = useState(INITIAL_USER_DATA);
  const [userToken, setUserToken] = useState('');

  function loginUser(userData: UserData) {
    const authenticate = () => {
      const { id, name, email, photo } = userData
      setUser({ id, name, email, photo })
      setIsAuthenticated(true)
    }
    const register = async () => {
      await deleteStore({ key: '@streamData:user' })
      await setStorage({ key: '@streamData:user', value: userData })
    }
    return { register, authenticate }
  }

  const logout = async (revokeAction: () => Promise<void>) => {
    setIsLoggingOut(true)
    try {
      if (typeof revokeAction === 'function') { 
        await revokeAction()
      }

      await deleteStore({ key: '@streamData:user' })
      setUser(INITIAL_USER_DATA)
      setIsAuthenticated(false)
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Erro', error.message)
      }
    } finally {
      setIsLoggingOut(false)
    }
  }

  const signInWithTwitch = async () => {
    setIsLoggingIn(true)
    try {
      const userData = await authWithTwitch()
      const { authenticate, register } = loginUser(userData)
      await register()
      authenticate()
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Erro', error.message)
      }
    }
    finally {
      setIsLoggingIn(false)
    }
  }

  const revokeAccess = async () => {
    logout(logoutWithTwitch)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoggingIn, isLoggingOut, signInWithTwitch, revokeAccess }}>
      {children}
    </AuthContext.Provider>
  )

}

export { AuthContext, AuthenticationProvider }