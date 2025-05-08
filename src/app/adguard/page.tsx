'use client';

import { useEffect, useState } from 'react';

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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { AdGuardStatus, useAdGuardStatus } from '@/hooks/useAdGuardStatus';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, BookUser, ListFilter, Save } from 'lucide-react';
import Link from 'next/link';

interface AdGuardFilter {
  id: number;
  url: string;
  name: string;
  rules_count: number;
  last_updated: string;
  enabled: boolean;
}

interface FiltersData {
  allFilters: AdGuardFilter[];
  userRules: string[];
}

// Define a more specific type for the API response
interface ToggleApiResponse {
  message: string;
}

// --- API request functions ---
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

// API function to update a single filter's state via our new backend route
const updateSingleAdGuardFilter = async (
  filterToUpdate: AdGuardFilter
): Promise<any> => {
  console.log(
    `Frontend: Requesting update for filter: ${filterToUpdate.name}, enabled: ${filterToUpdate.enabled}`
  );
  // We only need to send the parts our backend API /api/adguard/filters/update expects
  const payload = {
    url: filterToUpdate.url,
    name: filterToUpdate.name,
    enabled: filterToUpdate.enabled,
  };
  const { data } = await axios.post('/api/adguard/filters/update', payload);
  return data;
};

export default function AdGuardPage() {
  const queryClient = useQueryClient();
  // 本地狀態管理過濾器的勾選狀態
  const [localFilters, setLocalFilters] = useState<AdGuardFilter[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSavingMultiple, setIsSavingMultiple] = useState(false); // For global saving state

  const {
    data: status,
    isLoading: isLoadingStatus,
    isError: isStatusError,
    error: statusError,
  } = useAdGuardStatus();

  const {
    data: filtersData,
    isLoading: isLoadingFilters,
    isError: isFiltersError,
    error: filtersErrorData,
  } = useQuery<FiltersData, Error>({
    queryKey: ['adguardFilters'],
    queryFn: fetchAdGuardFilters,
  });

  // 當從 API 獲取到 filtersData 時，初始化 localFilters
  useEffect(() => {
    if (filtersData?.allFilters) {
      setLocalFilters(JSON.parse(JSON.stringify(filtersData.allFilters))); // 深拷貝
      setHasChanges(false);
    }
  }, [filtersData]);

  // 檢查是否有變更
  useEffect(() => {
    if (
      filtersData?.allFilters &&
      localFilters.length > 0 &&
      filtersData.allFilters.length === localFilters.length
    ) {
      try {
        const originalSorted = [...filtersData.allFilters]
          .sort((a, b) => a.id - b.id)
          .map((f) => ({ id: f.id, enabled: f.enabled }));
        const currentSorted = [...localFilters]
          .sort((a, b) => a.id - b.id)
          .map((f) => ({ id: f.id, enabled: f.enabled }));
        setHasChanges(
          JSON.stringify(originalSorted) !== JSON.stringify(currentSorted)
        );
      } catch (e) {
        console.error('Error comparing filter states:', e);
        setHasChanges(true); // Fallback to true if comparison fails
      }
    } else if (
      filtersData?.allFilters &&
      localFilters.length !== filtersData.allFilters.length &&
      localFilters.length > 0
    ) {
      // If lengths are different after initial load, consider it a change (e.g. filters were added/removed on server)
      setHasChanges(true);
    }
  }, [localFilters, filtersData]);

  const { mutate: toggleProtection, isPending: isTogglingProtection } =
    useMutation<ToggleApiResponse, Error, boolean>({
      mutationFn: toggleAdGuardProtection,
      onSuccess: (apiResponse) => {
        queryClient.invalidateQueries({ queryKey: ['adguardStatus'] });
        console.log(
          'AdGuard protection toggled successfully, refetching status. Message:',
          apiResponse.message
        );
      },
      onError: (error) => {
        console.error('Error toggling AdGuard protection:', error.message);
      },
    });

  // Renamed from applyFilterChanges to reflect single filter update
  const {
    mutateAsync: updateFilterMutation,
    isPending: isUpdatingSingleFilter,
  } = useMutation<any, Error, AdGuardFilter>({
    mutationFn: updateSingleAdGuardFilter,
    // onSuccess/onError can be handled per call or globally if needed
  });

  const handleToggleProtection = (enabled: boolean) => {
    if (!status || isTogglingProtection) return;
    toggleProtection(enabled);
  };

  const handleFilterChange = (
    filterId: number,
    checked: boolean | 'indeterminate'
  ) => {
    if (typeof checked === 'boolean') {
      // Only proceed if not indeterminate
      setLocalFilters((prevFilters) =>
        prevFilters.map((filter) =>
          filter.id === filterId ? { ...filter, enabled: checked } : filter
        )
      );
    }
  };

  const handleSaveChanges = async () => {
    if (!filtersData?.allFilters) {
      console.error(
        'Cannot save changes, original filters data is not available.'
      );
      return;
    }
    setIsSavingMultiple(true);

    const changedFilters: AdGuardFilter[] = [];
    for (let i = 0; i < localFilters.length; i++) {
      const local = localFilters[i];
      const original = filtersData.allFilters.find((of) => of.id === local.id);
      if (original && original.enabled !== local.enabled) {
        changedFilters.push(local);
      }
      // Also consider filters that might be in localFilters but not in original (newly added by some other means - less likely here)
      // Or filters in original but not in local (deleted - also less likely for this UI)
    }

    if (changedFilters.length === 0) {
      console.log('No actual changes to save.');
      setIsSavingMultiple(false);
      setHasChanges(false); // Ensure hasChanges is reset if no actual diffs
      return;
    }

    console.log(`Found ${changedFilters.length} filters to update.`);

    try {
      // Sequentially update filters to avoid overwhelming the backend or AdGuard Home
      for (const filterToUpdate of changedFilters) {
        console.log(
          `Attempting to update filter: ${filterToUpdate.name} to enabled: ${filterToUpdate.enabled}`
        );
        await updateFilterMutation(filterToUpdate); // Call mutateAsync
        console.log(`Successfully updated filter: ${filterToUpdate.name}`);
      }
      console.log('All changed filters processed.');
      // After all successful updates:
      queryClient.invalidateQueries({ queryKey: ['adguardFilters'] }); // Refetch to get the true state from server
      queryClient.invalidateQueries({ queryKey: ['adguardStatus'] });
      // setHasChanges will be naturally set to false once filtersData is refetched and useEffect runs
      // Toast success message here
    } catch (error) {
      console.error('One or more filter updates failed:', error);
      // Toast error message here - inform user that some changes might not have been saved
      // Optionally, try to refetch filters anyway to see what state the server is in
      queryClient.invalidateQueries({ queryKey: ['adguardFilters'] });
    } finally {
      setIsSavingMultiple(false);
    }
  };

  const isLoading = isLoadingStatus || isLoadingFilters;
  // isApplyingChanges is now isSavingMultiple or individual isUpdatingSingleFilter if we expose that
  const currentOverallSavingStatus = isSavingMultiple || isUpdatingSingleFilter;

  const generalError = isStatusError
    ? statusError?.message
    : isFiltersError
      ? filtersErrorData?.message
      : null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 relative z-10 gap-8">
      {/* 返回主頁按鈕 - 移至卡片上方並靠左 */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-lg flex justify-start"
      >
        <Button variant="outline" asChild>
          <Link href="/teacher">
            <ArrowLeft className="mr-2 h-4 w-4" /> 返回主頁
          </Link>
        </Button>
      </motion.div>

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
              ) : isStatusError ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-destructive text-sm"
                >
                  服務狀態: 無法連接服務
                </motion.p>
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
                    disabled={isTogglingProtection || isLoadingStatus}
                    aria-label="Toggle Website Blocking"
                  />
                </motion.div>
              ) : (
                !generalError && (
                  <p className="text-muted-foreground">無法載入保護狀態。</p>
                )
              )}
            </div>

            {generalError && !isStatusError && !isLoading && (
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
                  <Skeleton className="h-8 w-full mt-2" />
                  <Skeleton className="h-8 w-full mt-2" />
                </div>
              ) : localFilters && localFilters.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="manage-filters">
                      <AccordionTrigger>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <ListFilter className="h-4 w-4" />
                            <span>管理過濾器列表 ({localFilters.length})</span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pr-1">
                          {localFilters.map((filter) => (
                            <div
                              key={filter.id || filter.url}
                              className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
                            >
                              <Checkbox
                                id={`filter-${filter.id}`}
                                checked={filter.enabled}
                                onCheckedChange={(
                                  checked: boolean | 'indeterminate'
                                ) => {
                                  handleFilterChange(filter.id, checked);
                                }}
                                disabled={
                                  currentOverallSavingStatus || isLoadingFilters
                                }
                              />
                              <label
                                htmlFor={`filter-${filter.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-grow cursor-pointer"
                                title={`ID: ${filter.id}\nURL: ${filter.url}\n上次更新: ${filter.last_updated || '未知'}\n規則數: ${filter.rules_count || '未知'}`}
                              >
                                {filter.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AnimatePresence>
                      {hasChanges && (
                        <motion.div
                          className="flex justify-end"
                          initial={{
                            opacity: 0,
                            height: 0,
                            marginTop: 0,
                            marginBottom: 0,
                          }}
                          animate={{
                            opacity: 1,
                            height: 'auto',
                            marginTop: '1rem',
                            marginBottom: '0rem',
                          }}
                          exit={{
                            opacity: 0,
                            height: 0,
                            marginTop: 0,
                            marginBottom: 0,
                            transition: { duration: 0.2 },
                          }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          style={{ overflow: 'hidden' }}
                        >
                          <Button
                            size="sm"
                            onClick={handleSaveChanges}
                            disabled={currentOverallSavingStatus || isLoading}
                          >
                            <Save className="mr-2 h-4 w-4" />
                            {currentOverallSavingStatus
                              ? '儲存中...'
                              : '套用變更'}
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AccordionItem value="custom-rules">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <BookUser className="h-4 w-4" />
                          <span>
                            自訂規則 ({filtersData?.userRules.length ?? 0})
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {filtersData?.userRules &&
                        filtersData.userRules.length > 0 ? (
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
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
