import axios from 'axios';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const adguardUrl = process.env.ADGUARD_URL;
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

  try {
    const body = await request.json();
    const enable = body.enable;

    if (typeof enable !== 'boolean') {
      return NextResponse.json(
        { message: '請求格式錯誤，缺少 enable 參數' },
        { status: 400 }
      );
    }

    const apiUrl = `${adguardUrl.replace(/\/$/, '')}/control/protection`;
    console.log(
      `Sending request to ${apiUrl} to ${enable ? 'enable' : 'disable'} protection.`
    );

    const response = await axios.post(
      apiUrl,
      { enable: enable }, // AdGuard API 需要的請求體
      {
        auth: {
          username: adguardUser,
          password: adguardPass,
        },
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 8000, // 設定 8 秒超時 (操作可能比獲取狀態慢)
      }
    );

    // AdGuard API 成功時通常回傳 200 OK，沒有特定內容
    if (response.status === 200) {
      console.log(
        `Successfully ${enable ? 'enabled' : 'disabled'} AdGuard protection.`
      );
      return NextResponse.json({
        message: `AdGuard 保護已成功 ${enable ? '開啟' : '關閉'}`,
      });
    } else {
      // 理論上 axios 會對非 2xx 狀態拋出錯誤，但以防萬一
      console.error(
        'Unexpected success status from AdGuard API:',
        response.status
      );
      return NextResponse.json(
        { message: 'AdGuard API 回應非預期成功狀態' },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Error toggling AdGuard protection:', error);
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
    // 其他錯誤
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { message: `切換 AdGuard 保護時發生內部錯誤: ${message}` },
      { status: 500 }
    );
  }
}
