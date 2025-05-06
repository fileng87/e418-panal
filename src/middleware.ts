import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// --- Helper Function to get Client IP ---

function getClientIp(request: NextRequest): string | undefined {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const firstIp = xff.split(',')[0].trim();
    console.log(`IP found from x-forwarded-for: ${firstIp}`);
    return firstIp; // 直接回傳找到的第一個 IP
  }

  // --- 本地開發/非生產環境繞過 ---
  // (返回 TEACHER_IPS 列表中的第一個 IP，如果存在)
  if (process.env.NODE_ENV !== 'production' && process.env.TEACHER_IPS) {
    const firstTeacherIp = process.env.TEACHER_IPS.split(',')[0]?.trim();
    if (firstTeacherIp) {
      console.warn(
        `Non-production mode: Returning first TEACHER_IP (${firstTeacherIp}) from list for testing. Remove before deployment!`
      );
      return firstTeacherIp;
    } else {
      console.error(
        `Non-production mode: TEACHER_IPS is set but seems empty or invalid.`
      );
    }
  }
  // --------------------

  console.warn(
    'x-forwarded-for header not found and not in non-production mode with TEACHER_IPS set. Cannot determine client IP.'
  );
  return undefined; // 未找到 IP
}
// ------------------------------------

export function middleware(request: NextRequest) {
  // 讀取逗號分隔的 IP 列表
  const teacherIpsString = process.env.TEACHER_IPS;
  const clientIp = getClientIp(request);
  const { pathname } = request.nextUrl;

  console.log(
    `Attempting request from IP: ${clientIp}, Path: ${pathname}, Allowed Teacher IPs: ${teacherIpsString}`
  );

  if (!teacherIpsString) {
    console.error('TEACHER_IPS environment variable is not set or empty.');
    return new Response('Server configuration error', { status: 500 });
  }

  // 將字串分割為陣列，並去除空白
  const allowedTeacherIps = teacherIpsString
    .split(',')
    .map((ip) => ip.trim())
    .filter((ip) => ip); // filter(ip => ip) 確保移除空字串

  if (allowedTeacherIps.length === 0) {
    console.error(
      'TEACHER_IPS environment variable is set, but contains no valid IPs after splitting.'
    );
    return new Response(
      'Server configuration error: No valid teacher IPs configured',
      { status: 500 }
    );
  }

  // -- IP 檢查：檢查 clientIp 是否在允許的列表中 --
  // 確保 clientIp 存在才進行比較
  const isTeacherIp = clientIp ? allowedTeacherIps.includes(clientIp) : false;

  if (isTeacherIp) {
    // --- 教師機 IP 邏輯 ---
    console.log(`Teacher IP detected (${clientIp} is in allowed list).`);
    if (pathname === '/') {
      console.log('Redirecting / to /teacher for teacher');
      const url = request.nextUrl.clone();
      url.pathname = '/teacher';
      return NextResponse.redirect(url);
    }
    console.log('Allowing teacher access to:', pathname);
    return NextResponse.next();
  } else {
    // --- 非教師機 IP (或無法確定 IP) 邏輯 ---
    console.log(
      `Non-teacher IP detected or IP mismatch (Client: ${clientIp}).`
    );
    if (pathname === '/') {
      console.log('Allowing non-teacher access to /');
      return NextResponse.next();
    } else {
      console.log(
        `Blocking non-teacher access to ${pathname}, redirecting to /forbidden`
      );
      const url = request.nextUrl.clone();
      url.pathname = '/forbidden';
      return NextResponse.redirect(url);
    }
  }
}

// Middleware Matcher: 指定哪些路徑需要執行 Middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - forbidden (the forbidden page itself)
     * (Remove paths that NEED protection, like /teacher, /adguard)
     */
    '/((?!_next/static|_next/image|favicon.ico|forbidden).*)',
  ],
};
