# E418 教室管理面板

一個為 E418 教室建立的集中式網頁管理面板。

## 主要功能

- **服務整合:** 透過後端 API 路由代理，整合不同服務的 API (目前已實作 AdGuard Home 的狀態查詢、切換及過濾器列表查看)。
- **IP 訪問控制:** 使用 Next.js Middleware ([`src/middleware.ts`](mdc:src/middleware.ts)) 實現基於 IP 的訪問控制，區分教師與學生權限。
- **條件式路由:**
  - 教師 IP 訪問根目錄 `/` 會自動重定向到教師專用主頁 `/teacher`。
  - 非教師 IP 訪問根目錄 `/` 會看到公開的學生版主頁。
  - 非教師 IP 嘗試訪問 `/teacher` 或 `/adguard` 等管理頁面將被重定向至 `/forbidden`。
- **管理介面:** 提供視覺化的介面管理服務狀態 (例如：網站封鎖器開關)。
- **動態 UI:**
  - 整體採用深色主題。
  - 頁面背景包含動態光源效果。
  - 內容卡片使用旋轉邊框光暈效果。
  - 使用 Framer Motion 實現頁面與元件動畫。
  - 使用 shadcn/ui 元件庫及 Lucide 圖示。

## 技術堆疊

- **框架:** [Next.js](https://nextjs.org/) (App Router)
- **UI:** [shadcn/ui](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
- **動畫:** [Framer Motion](https://www.framer.com/motion/)
- **HTTP 客戶端:** [Axios](https://axios-http.com/) (用於後端 API)
- **圖示:** [Lucide React](https://lucide.dev/)
- **套件管理:** [pnpm](https://pnpm.io/)

## 環境變數設定

專案需要設定以下環境變數才能正常運作。請在專案根目錄建立一個 `.env.local` 檔案，並填入以下內容 (替換為您的實際值):

```bash
# .env.local

# AdGuard Home 設定
ADGUARD_URL=http://YOUR_ADGUARD_IP_OR_HOSTNAME:PORT
ADGUARD_USERNAME=your_adguard_username
ADGUARD_PASSWORD=your_adguard_password

# 教師 IP 位址 (允許多個，用逗號分隔，不要有空格)
TEACHER_IPS=YOUR_TEACHER_IP_1,YOUR_TEACHER_IP_2
```

## 開始使用

1.  **安裝依賴:**

    ```bash
    pnpm install
    ```

2.  **設定環境變數:**
    建立並填寫 `.env.local` 檔案 (參考上方說明)。

3.  **啟動開發伺服器:**

    ```bash
    pnpm dev
    ```

4.  在瀏覽器中開啟 [http://localhost:3000](http://localhost:3000)。

## 建置與 Linting

- **建置專案:**
  ```bash
  pnpm build
  ```
- **執行 Lint 檢查:**
  ```bash
  pnpm lint
  ```

## 部署

### 使用 Docker

您也可以使用 Docker 來建置和執行此應用程式。

1.  **建置 Docker 映像檔:**

    ```bash
    docker build -t e418-panel .
    ```

2.  **執行 Docker 容器:**

    **選項 A: 使用 `docker run` (需手動傳遞環境變數或使用 `--env-file`)**

    確保您的 `.env` 檔案存在且包含必要的環境變數。

    ```bash
    # 將 .env.local 檔案傳遞給容器
    docker run -d -p 3000:3000 --env-file .env --name e418-panel-app e418-panel
    ```

    或者，您可以逐一傳遞環境變數：

    ```bash
    docker run -d -p 3000:3000 \
      -e ADGUARD_URL="http://YOUR_ADGUARD_IP_OR_HOSTNAME:PORT" \
      -e ADGUARD_USERNAME="your_adguard_username" \
      -e ADGUARD_PASSWORD="your_adguard_password" \
      -e TEACHER_IPS="YOUR_TEACHER_IP_1,YOUR_TEACHER_IP_2" \
      --name e418-panel-app e418-panel
    ```

    **選項 B: 使用 `docker-compose` (推薦)**

    `docker-compose.yml` 檔案已經設定好從 `.env.local` 讀取環境變數。

    ```bash
    # 在背景啟動服務
    docker-compose up -d
    ```

3.  應用程式現在應該可以在 `http://<your-server-ip>:3000` 上訪問。

**注意:** 在生產環境部署時，請確保您的 `.env` 檔案具有正確的生產環境配置，並且不要將其包含在版本控制中。
