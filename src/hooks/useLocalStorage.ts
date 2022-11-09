export const useLocalStorage = <T>(k: string) => {
  const getLocalData = (): T | undefined => {
    const value = localStorage.getItem(k);
    return value !== null ? JSON.parse(value) : undefined;
  };

  const setLocalData = (value: T) => {
    localStorage.setItem(k, JSON.stringify(value));
  };

  const clearLocalData = () => {
    localStorage.removeItem(k);
  };

  return { getLocalData, setLocalData, clearLocalData };
};
