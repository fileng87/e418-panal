import axios from 'axios';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface FilterUpdatePayload {
  url: string; // The original URL of the filter to identify it
  name: string; // The name of the filter (usually kept the same)
  enabled: boolean; // The new enabled state
  // whitelist is false by default for normal blocklists
}

export async function POST(request: NextRequest) {
  const adguardUrl = process.env.ADGUARD_URL;
  const adguardUser = process.env.ADGUARD_USERNAME;
  const adguardPass = process.env.ADGUARD_PASSWORD;

  if (!adguardUrl || !adguardUser || !adguardPass) {
    console.error('AdGuard Home 環境變數未設定 (update filter)');
    return NextResponse.json(
      { message: 'AdGuard Home 設定不完整' },
      { status: 500 }
    );
  }

  try {
    const filterToUpdate: FilterUpdatePayload = await request.json();

    if (
      !filterToUpdate ||
      typeof filterToUpdate.url !== 'string' ||
      typeof filterToUpdate.name !== 'string' ||
      typeof filterToUpdate.enabled !== 'boolean'
    ) {
      return NextResponse.json({ message: '無效的請求資料' }, { status: 400 });
    }

    const apiUrl = `${adguardUrl.replace(/\/$/, '')}/control/filtering/set_url`;
    console.log(
      `Updating AdGuard filter ${filterToUpdate.name} (${filterToUpdate.url}) to enabled: ${filterToUpdate.enabled} via: ${apiUrl}`
    );

    const adguardApiPayload = {
      url: filterToUpdate.url, // Identifier for the filter to be updated
      whitelist: false, // Assuming these are not whitelist filters
      data: {
        url: filterToUpdate.url, // Keep the URL the same unless changing it is a feature
        name: filterToUpdate.name, // Keep the name the same unless changing it is a feature
        enabled: filterToUpdate.enabled, // The new enabled state
      },
    };

    const response = await axios.post(apiUrl, adguardApiPayload, {
      auth: {
        username: adguardUser,
        password: adguardPass,
      },
      timeout: 7000, // 7 seconds timeout for this operation
    });

    console.log('AdGuard filter update API response status:', response.status);
    // AdGuard's set_url typically returns 200 OK with no body or an empty object on success
    return NextResponse.json({
      message: `過濾器 ${filterToUpdate.name} 更新成功。`,
    });
  } catch (error) {
    console.error('Error updating AdGuard filter:', error);
    if (axios.isAxiosError(error)) {
      let errorMessage = `請求 AdGuard API (set_url) 失敗: ${error.message}`;
      if (error.response?.status === 401) {
        errorMessage = 'AdGuard Home 驗證失敗，請檢查帳號密碼。';
      } else if (error.response?.status) {
        errorMessage = `AdGuard Home API (set_url) 回應錯誤: ${error.response.status}`;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = '連線 AdGuard Home (set_url) 超時。';
      }
      return NextResponse.json(
        { message: errorMessage, details: error.response?.data },
        { status: error.response?.status || 500 }
      );
    }
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { message: `更新 AdGuard 過濾器時發生內部錯誤: ${message}` },
      { status: 500 }
    );
  }
}
