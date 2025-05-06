import { Button } from '@/components/ui/button';
import { Home, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 relative z-10 gap-4 text-center">
      <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
      <h1 className="text-3xl font-bold text-destructive">禁止訪問</h1>
      <p className="text-muted-foreground mb-6">
        抱歉，您目前使用的網路位址沒有權限訪問此頁面。
      </p>
      <Link href="/" passHref>
        <Button variant="outline">
          <Home className="mr-2 h-4 w-4" /> 返回主頁
        </Button>
      </Link>
    </main>
  );
}
