'use client';

// import { useEffect, useState } from 'react'; // useState might still be needed for some local UI states
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ArrowLeft, BookUser, ListFilter } from 'lucide-react';
import Link from 'next/link';

// 假設的狀態類型
interface AdGuardStatus {
  protection_enabled: boolean;
  running: boolean;
  version: string;
  // 可以添加更多從 AdGuard API 獲取的資訊
}

interface AdGuardFilter {
  id: number;
  url: string;
  name: string;
  rules_count: number;
  last_updated: string;
}

interface FiltersData {
  enabledFilters: AdGuardFilter[];
  userRules: string[];
}

// Define a more specific type for the API response
interface ToggleApiResponse {
  message: string;
}

// --- API request functions ---
const fetchAdGuardStatus = async (): Promise<AdGuardStatus> => {
  const { data } = await axios.get('/api/adguard/status');
  return data;
};

const fetchAdGuardFilters = async (): Promise<FiltersData> => {
  const { data } = await axios.get('/api/adguard/filters');
  return data;
};

const toggleAdGuardProtection = async (
  enabled: boolean
): Promise<ToggleApiResponse> => {
  const { data } = await axios.post('/api/adguard/toggle', { enable: enabled });
  return data;
};

export default function AdGuardPage() {
  const queryClient = useQueryClient();

  const {
    data: status,
    isLoading: isLoadingStatus,
    isError: isStatusError,
    error: statusError,
  } = useQuery<AdGuardStatus, Error>({
    queryKey: ['adguardStatus'],
    queryFn: fetchAdGuardStatus,
  });

  const {
    data: filtersData,
    isLoading: isLoadingFilters,
    isError: isFiltersError,
    error: filtersErrorData,
  } = useQuery<FiltersData, Error>({
    queryKey: ['adguardFilters'],
    queryFn: fetchAdGuardFilters,
  });

  const { mutate: toggleProtection, isPending: isToggling } = useMutation<
    ToggleApiResponse,
    Error,
    boolean
  >({
    mutationFn: toggleAdGuardProtection,
    onSuccess: (apiResponse, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adguardStatus'] });
      console.log(
        'AdGuard protection toggled successfully, refetching status. Message:',
        apiResponse.message
      );
      console.log(`Attempted to set protection to: ${variables}`);
    },
    onError: (error) => {
      console.error('Error toggling AdGuard protection:', error.message);
      // Optionally, display a toast notification here
    },
  });

  const handleToggleProtection = (enabled: boolean) => {
    if (!status || isToggling) return;
    toggleProtection(enabled);
  };

  const isLoading = isLoadingStatus || isLoadingFilters;
  const generalError = isStatusError
    ? statusError?.message
    : isFiltersError
      ? filtersErrorData?.message
      : null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 relative z-10 gap-8">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-lg card-glow-border"
      >
        <Card className="shadow-xl border-none bg-card p-6 rounded-lg relative z-[1]">
          <CardHeader>
            <div className="flex items-center justify-between mb-1">
              <CardTitle className="text-2xl font-bold tracking-tight text-primary">
                網站封鎖器
              </CardTitle>
              {!isLoadingStatus &&
                status &&
                (status.running ? (
                  <Badge variant="success">運行中</Badge>
                ) : (
                  <Badge variant="destructive">已停止</Badge>
                ))}
              {isLoadingStatus && <Skeleton className="h-5 w-16 rounded-md" />}
            </div>
            <CardDescription>
              啟用或停用特定網站（如 AI 工具、遊戲網站）的存取限制
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="min-h-[36px]">
              {isLoadingStatus ? (
                <div className="flex items-center justify-between">
                  <Skeleton className="h-7 w-24" />
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
              ) : status ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="flex items-center justify-between"
                >
                  <Label htmlFor="protection-switch" className="text-lg">
                    網站封鎖
                  </Label>
                  <Switch
                    id="protection-switch"
                    checked={status.protection_enabled}
                    onCheckedChange={handleToggleProtection}
                    disabled={isToggling || isLoadingStatus}
                    aria-label="Toggle Website Blocking"
                  />
                </motion.div>
              ) : (
                !generalError && (
                  <p className="text-muted-foreground">無法載入保護狀態。</p>
                )
              )}
            </div>

            {generalError && !isLoading && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-destructive pt-2"
              >
                {generalError}
              </motion.p>
            )}

            <div className="pt-4 border-t border-border/30 min-h-[80px]">
              {isLoadingFilters ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : filtersData ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="enabled-filters">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <ListFilter className="h-4 w-4" />
                          <span>
                            已啟用的過濾器列表 (
                            {filtersData.enabledFilters.length})
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {filtersData.enabledFilters.length > 0 ? (
                          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                            {filtersData.enabledFilters.map((filter) => (
                              <li
                                key={filter.id || filter.url}
                                title={`URL: ${filter.url}\n上次更新: ${filter.last_updated || '未知'}\n規則數: ${filter.rules_count || '未知'}`}
                              >
                                {filter.name}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            沒有啟用的過濾器列表。
                          </p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="custom-rules">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <BookUser className="h-4 w-4" />
                          <span>自訂規則 ({filtersData.userRules.length})</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {filtersData.userRules.length > 0 ? (
                          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground whitespace-pre-wrap font-mono">
                            {filtersData.userRules.map((rule, index) => (
                              <li key={index}>{rule}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            沒有自訂規則。
                          </p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </motion.div>
              ) : (
                !generalError && (
                  <p className="text-muted-foreground">無法載入過濾器資訊。</p>
                )
              )}
            </div>

            <div className="flex justify-start pt-6">
              <Button variant="outline" asChild>
                <Link href="/teacher">
                  <ArrowLeft className="mr-2 h-4 w-4" /> 返回主頁
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}

// Helper function for Badge variant (assuming you have this set up in components/ui/badge)
declare module '@/components/ui/badge' {
  interface BadgeProps {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success'; // Add success variant if needed
  }
}
