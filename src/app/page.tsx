'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
  Cable,
  ClipboardCheck,
  Megaphone,
  PowerOff,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-2xl card-glow-border"
      >
        <Card className="shadow-xl border-none bg-card p-6 rounded-lg relative z-[1]">
          <CardHeader className="border-b border-border/30 pb-4 mb-6">
            <CardTitle className="text-3xl font-bold tracking-tight text-primary mb-1">
              E418 教室使用規則
            </CardTitle>
            <CardDescription className="pt-1 text-muted-foreground/80">
              請各位使用者共同維護教室環境與設備。
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2">
            <ul className="space-y-4">
              <li className="flex items-start">
                <Sparkles className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-sky-500 dark:text-sky-400" />
                <span className="text-base leading-relaxed text-foreground">
                  請保持教室整潔，離開時將個人物品帶走。
                </span>
              </li>
              <li className="flex items-start">
                <Cable className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-orange-500 dark:text-orange-400" />
                <span className="text-base leading-relaxed text-foreground">
                  請勿隨意更動教室設備線路與設定；若有調整，離開前請務必恢復原狀。
                </span>
              </li>
              <li className="flex items-start">
                <ClipboardCheck className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-green-500 dark:text-green-400" />
                <span className="text-base leading-relaxed text-foreground">
                  若需使用特殊軟體或設備，請提前申請。
                </span>
              </li>
              <li className="flex items-start">
                <PowerOff className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-red-500 dark:text-red-400" />
                <span className="text-base leading-relaxed text-foreground">
                  使用完畢後，請確實關閉電腦設備。
                </span>
              </li>
              <li className="flex items-start">
                <Megaphone className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-purple-500 dark:text-purple-400" />
                <span className="text-base leading-relaxed text-foreground">
                  如遇任何問題，請聯繫管理人員。
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
