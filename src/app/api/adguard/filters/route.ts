import axios from 'axios';
import { NextResponse } from 'next/server';

// 介面定義 AdGuard Home /control/filtering/status 回應的部分結構
// (根據 API 文件調整，這裡僅列出可能相關的部分)
interface AdGuardFilter {
  url: string;
  name: string;
  last_updated: string;
  id: number;
  enabled: boolean;
  rules_count: number;
}

interface AdGuardFilteringStatus {
  filters: AdGuardFilter[];
  whitelist_filters: AdGuardFilter[];
  user_rules: string[];
  // ... 其他可能的欄位
}

export async function GET() {
  const adguardUrl = process.env.ADGUARD_URL;
  const adguardUser = process.env.ADGUARD_USERNAME;
  const adguardPass = process.env.ADGUARD_PASSWORD;

  if (!adguardUrl || !adguardUser || !adguardPass) {
    console.error('AdGuard Home 環境變數未設定');
    return NextResponse.json(
      { message: 'AdGuard Home 設定不完整' },
      { status: 500 }
    );
  }

  const apiUrl = `${adguardUrl.replace(/\/$/, '')}/control/filtering/status`;
  console.log(`Fetching AdGuard filters from: ${apiUrl}`);

  try {
    const response = await axios.get<AdGuardFilteringStatus>(apiUrl, {
      auth: { username: adguardUser, password: adguardPass },
      timeout: 7000, // 稍微增加超時時間
    });

    // 可以選擇只回傳需要的欄位，例如啟用的過濾器列表
    const enabledFilters =
      response.data.filters?.filter((f) => f.enabled) ?? [];
    // 過濾掉空字串的自訂規則
    const rawUserRules = response.data.user_rules ?? [];
    const userRules = rawUserRules.filter((rule) => rule && rule.trim() !== '');

    console.log(
      `Successfully fetched ${enabledFilters.length} enabled filters and ${userRules.length} non-empty user rules.`
    );
    return NextResponse.json({
      enabledFilters: enabledFilters,
      userRules: userRules, // 回傳過濾後的陣列
    });
  } catch (error) {
    console.error('Error fetching AdGuard filters:', error);
    if (axios.isAxiosError(error)) {
      let errorMessage = `請求 AdGuard API 失敗: ${error.message}`;
      if (error.response?.status === 401)
        errorMessage = 'AdGuard Home 驗證失敗。';
      else if (error.response?.status)
        errorMessage = `AdGuard Home API 回應錯誤: ${error.response.status}`;
      else if (error.code === 'ECONNABORTED')
        errorMessage = '連線 AdGuard Home 超時。';
      return NextResponse.json(
        { message: errorMessage },
        { status: error.response?.status || 500 }
      );
    }
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { message: `獲取 AdGuard 過濾器時發生內部錯誤: ${message}` },
      { status: 500 }
    );
  }
}
