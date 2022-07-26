import Storage from '@react-native-async-storage/async-storage'

interface StorageProps {
  key: string
  value?: {} | []
}

async function setStorage({ key, value }: StorageProps): Promise<void> {
  const currentData = await getStorage({ key })
  const dataToStorage = {...currentData, ...value}

  return await Storage.setItem(key, JSON.stringify(dataToStorage))
}

async function getStorage({ key }: StorageProps): Promise<Object> {
  const data = await Storage.getItem(key)

  if (!data) {
    return Promise.resolve({})
  }
  return JSON.parse(data)
}

async function deleteStore({ key }: StorageProps): Promise<void> {
  return await Storage.removeItem(key)
}

export { setStorage, getStorage, deleteStore }
