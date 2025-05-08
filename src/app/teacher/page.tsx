'use client';

import { Button } from '@/components/ui/button';
// 移除 Info (此註解似乎已過時，Info 仍被使用)
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAdGuardStatus } from '@/hooks/useAdGuardStatus';
// 匯入新的 Hook
import { motion } from 'framer-motion';
// 從 lucide-react 移除未使用的 ListChecks，保留 Ban, Info, Settings, Wrench
import { Ban, Info, Settings, Wrench } from 'lucide-react';
import Link from 'next/link';

export default function TeacherHomePage() {
  const {
    data: adguardApiStatus,
    isLoading: isLoadingAdguardStatus,
    isError: isAdguardStatusError,
    error: adguardStatusError,
  } = useAdGuardStatus();

  const getStatusText = () => {
    if (isLoadingAdguardStatus) return '載入中...';
    if (isAdguardStatusError) return '連線失敗';
    if (adguardApiStatus?.running) return '運行中';
    return '已停用/離線';
  };

  const getStatusClass = () => {
    if (isLoadingAdguardStatus) return 'bg-gray-400 animate-pulse';
    if (isAdguardStatusError) return 'bg-red-500';
    if (adguardApiStatus?.running) return 'bg-green-500';
    return 'bg-red-500';
  };

  const getStatusTitle = () => {
    if (isLoadingAdguardStatus) return '服務狀態: 載入中...';
    if (isAdguardStatusError) return '服務狀態: 無法連接服務';
    if (adguardApiStatus?.running) return '服務狀態: 運行中';
    return '服務狀態: 已停用/離線';
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 relative z-10 gap-8">
      {/* 說明卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-xl card-glow-border"
      >
        <Card className="shadow-xl border-none bg-card p-6 rounded-lg relative z-[1]">
          <CardHeader className="border-b pb-4 text-center md:text-left">
            <CardTitle className="text-3xl font-bold tracking-tight text-primary mb-1">
              教師管理面板
            </CardTitle>
            <CardDescription className="pt-1 text-muted-foreground">
              歡迎使用！請選擇您要管理的項目。
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 pt-4">
            {/* 讓小標題更突出 */}
            <p className="text-base font-semibold mb-4 text-foreground">
              面板功能與提醒：
            </p>
            <ul className="space-y-4">
              {' '}
              {/* 稍微增加列表間距 */}
              <li className="flex items-start gap-3">
                {' '}
                {/* 使用 gap 替代 mr */}
                <Settings className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500 dark:text-blue-400" />
                {/* 調整列表文字顏色 */}
                <span className="text-base leading-relaxed text-muted-foreground">
                  這裡可以幫您統一調整教室裡電腦和網路的一些設定。
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Ban className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-500 dark:text-orange-400" />
                <span className="text-base leading-relaxed text-muted-foreground">
                  我們會持續增加和改進這裡的功能，讓管理更方便。
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-500 dark:text-yellow-400" />
                <span className="text-base leading-relaxed text-muted-foreground">
                  <strong>重要提醒：</strong>
                  本教室電腦均已安裝還原系統，個人檔案或需永久保存的資料，請務必存放於{' '}
                  <strong>隨身碟 或 D槽</strong>，以免遺失。
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </motion.div>

      {/* 教師專用導覽按鈕 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex gap-4 mt-6" // 稍微調整上方間距
      >
        <Link href="/adguard" passHref>
          <Button variant="outline" className="flex items-center">
            <Ban className="mr-2 h-4 w-4" /> 網站封鎖器
            <span
              title={getStatusTitle()}
              className={`ml-2 h-2.5 w-2.5 rounded-full inline-block ${getStatusClass()}`}
            ></span>
          </Button>
        </Link>
        <Link
          href="/some-other-tool"
          onClick={(e) => {
            e.preventDefault();
          }}
          aria-disabled="true"
          tabIndex={-1}
          className="cursor-not-allowed"
        >
          <Button variant="outline" disabled className="flex items-center">
            <Wrench className="mr-2 h-4 w-4" /> 其他工具 (待開發)
            <span
              title="服務狀態: 待開發"
              className="ml-2 h-2.5 w-2.5 rounded-full inline-block bg-gray-400"
            ></span>
          </Button>
        </Link>
      </motion.div>
    </main>
  );
}
