"use client"

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Ban, Wrench, Settings, ListChecks } from 'lucide-react'; // 移除 Info
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function TeacherHomePage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 relative z-10 gap-8">
             {/* 說明卡片 */} 
             <motion.div
                 initial={{ opacity: 0, y: 20, scale: 0.95 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 transition={{ duration: 0.6, ease: "easeOut" }}
                 className="w-full max-w-xl card-glow-border"
             >
                 <Card className="shadow-xl border-none bg-card p-6 rounded-lg relative z-[1]">
                     <CardHeader className="border-b pb-4 text-center md:text-left">
                         <CardTitle className="text-3xl font-bold tracking-tight text-primary mb-1">教師管理面板</CardTitle>
                         <CardDescription className="pt-1 text-muted-foreground">歡迎回來！請選擇您要管理的項目。</CardDescription>
                     </CardHeader>
                     <CardContent className="px-2 pt-4">
                          {/* 讓小標題更突出 */} 
                         <p className="text-base font-semibold mb-4 text-foreground">面板功能：</p>
                         <ul className="space-y-4"> {/* 稍微增加列表間距 */} 
                             <li className="flex items-start gap-3"> {/* 使用 gap 替代 mr */} 
                                 <Settings className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500 dark:text-blue-400" />
                                  {/* 調整列表文字顏色 */} 
                                 <span className="text-base leading-relaxed text-muted-foreground">集中管理 e418 教室的各項網路服務與設定。</span>
                             </li>
                             <li className="flex items-start gap-3">
                                 <ListChecks className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-500 dark:text-teal-400" />
                                 <span className="text-base leading-relaxed text-muted-foreground">提供直觀的操作介面，簡化日常管理任務。</span>
                             </li>
                             <li className="flex items-start gap-3">
                                 <Ban className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-500 dark:text-orange-400" />
                                 <span className="text-base leading-relaxed text-muted-foreground">目前包含「網站封鎖器」功能，未來將持續擴充。</span>
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
                    <Button variant="outline">
                        <Ban className="mr-2 h-4 w-4" /> 網站封鎖器
                    </Button>
                </Link>
                <Link href="/some-other-tool" passHref>
                     <Button variant="outline" disabled>
                        <Wrench className="mr-2 h-4 w-4" /> 其他工具 (待開發)
                    </Button>
                </Link>
            </motion.div>
        </main>
    );
} 