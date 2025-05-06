import axios from 'axios';
import { NextResponse } from 'next/server';

// 介面定義 AdGuard Home /control/status 回應的結構 (可能需要根據實際 API 調整)
interface AdGuardApiResponse {
  protection_enabled: boolean;
  running: boolean;
  version: string;
  language: string;
  // ... 其他可能的欄位
}

export async function GET() {
  const adguardUrl = process.env.ADGUARD_URL; // 例如 http://192.168.1.100:3000
  const adguardUser = process.env.ADGUARD_USERNAME;
  const adguardPass = process.env.ADGUARD_PASSWORD;

  if (!adguardUrl || !adguardUser || !adguardPass) {
    console.error(
      'AdGuard Home 環境變數未設定 (ADGUARD_URL, ADGUARD_USERNAME, ADGUARD_PASSWORD)'
    );
    return NextResponse.json(
      { message: 'AdGuard Home 設定不完整' },
      { status: 500 }
    );
  }

  // 確保 URL 結尾沒有斜線，並加上 API 路徑
  const apiUrl = `${adguardUrl.replace(/\/$/, '')}/control/status`;
  console.log(`Fetching AdGuard status from: ${apiUrl}`);

  try {
    const response = await axios.get<AdGuardApiResponse>(apiUrl, {
      auth: {
        username: adguardUser,
        password: adguardPass,
      },
      timeout: 5000, // 設定 5 秒超時
    });

    // 直接回傳從 AdGuard API 獲取的數據
    console.log('Successfully fetched AdGuard status:', response.data);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching AdGuard status:', error);
    if (axios.isAxiosError(error)) {
      console.error(
        'Axios error details:',
        error.response?.status,
        error.response?.data
      );
      let errorMessage = `請求 AdGuard API 失敗: ${error.message}`;
      if (error.response?.status === 401) {
        errorMessage = 'AdGuard Home 驗證失敗，請檢查帳號密碼。';
      } else if (error.response?.status) {
        errorMessage = `AdGuard Home API 回應錯誤: ${error.response.status}`;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = '連線 AdGuard Home 超時。';
      }
      return NextResponse.json(
        { message: errorMessage },
        { status: error.response?.status || 500 }
      );
    }
    // 其他非 Axios 錯誤
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { message: `獲取 AdGuard 狀態時發生內部錯誤: ${message}` },
      { status: 500 }
    );
  }
}
