import { useContext } from 'react';
import { AuthContext, AuthContextData } from '../context/AuthContext'

const useAuth = (): AuthContextData => {
  return useContext(AuthContext);
}

export { useAuth }