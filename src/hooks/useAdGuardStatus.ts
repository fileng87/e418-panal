import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export interface AdGuardStatus {
  protection_enabled: boolean;
  running: boolean;
  version: string;
  // 可以添加更多從 AdGuard API 獲取的資訊
}

const fetchAdGuardStatus = async (): Promise<AdGuardStatus> => {
  const { data } = await axios.get('/api/adguard/status');
  return data;
};

export const useAdGuardStatus = () => {
  return useQuery<AdGuardStatus, Error>({
    queryKey: ['adguardStatus'],
    queryFn: fetchAdGuardStatus,
  });
};
