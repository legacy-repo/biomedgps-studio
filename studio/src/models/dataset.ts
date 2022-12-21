import { useState, useCallback } from 'react'

export default () => {
  const [defaultDataset, setDefaultDataset] = useState<string>("");

  const setDataset = useCallback((dataset: string) => {
    setDefaultDataset((pre) => { return dataset })
  }, [])

  return {
    defaultDataset,
    setDataset
  }
};
