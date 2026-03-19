# AI Bridge UI — Image Crawler

Ứng dụng web cho phép tìm kiếm và tải ảnh hàng loạt từ Bing Images. Gồm 3 thành phần chính:

| Thành phần | Công nghệ | Port |
|---|---|---|
| **Frontend** | React + Vite + TypeScript + shadcn/ui | `5173` |
| **Backend** | Express.js (Node.js) | `3001` |
| **Crawler (Scraper)** | Python Flask + Selenium + Chrome (Docker) | `5000` |

---

## Yêu cầu

- **Node.js** ≥ 18
- **Docker Desktop** (đã cài và đang chạy)

---

## Cách chạy ở local

### 1. Crawler (Scraper) — Docker

Scraper chạy trong Docker container vì cần Chrome + ChromeDriver.

```bash
# Di chuyển vào thư mục scraper
cd backend/scraper

# Build Docker image
docker build -t image-scraper .

# Chạy container
docker run -d --name image-scraper -p 5000:5000 image-scraper
```

Kiểm tra scraper đã chạy:

```bash
curl http://localhost:5000/health
# Kết quả: {"status":"ok"}
```

> **Lưu ý:** Nếu muốn dừng/xóa container:
> ```bash
> docker stop image-scraper
> docker rm image-scraper
> ```

---

### 2. Frontend + Backend — Một lệnh duy nhất

Sau khi Docker Scraper đã chạy, chỉ cần **1 lệnh** để khởi động cả Frontend và Backend:

```bash
# Cài dependencies (lần đầu)
npm install
cd backend && npm install && cd ..

# Chạy cả Frontend + Backend
npm run dev:all
```

Lệnh này sẽ khởi động đồng thời:
- **[frontend]** Vite → `http://localhost:5173` — log màu **cyan**
- **[backend]** Express → `http://localhost:3001` — log màu **green**

> Nhấn `Ctrl+C` để dừng cả hai service cùng lúc.

Nếu chỉ muốn chạy riêng từng service:

```bash
npm run dev          # Chỉ Frontend
npm run dev:backend  # Chỉ Backend
```

#### API Endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/crawl` | Tìm kiếm ảnh — body: `{ keyword, limit }` |
| `GET` | `/api/proxy-image?url=...` | Proxy ảnh (tránh CORS) |
| `POST` | `/api/download` | Tải ảnh đã chọn — body: `{ keyword, imageUrls }` |

#### Biến môi trường (tuỳ chọn)

| Biến | Mặc định | Mô tả |
|---|---|---|
| `PORT` | `3001` | Port của backend |
| `SCRAPER_URL` | `http://localhost:5000` | URL đến scraper service |

> Vite đã được cấu hình proxy `/api` → `http://localhost:3001`, nên frontend gọi API trực tiếp qua relative path.

---

## Cấu trúc dự án

```
ai-bridge-ui/
├── src/                    # Frontend React source
├── public/                 # Static assets
├── backend/
│   ├── server.js           # Express.js entry point
│   ├── routes/
│   │   └── crawl.js        # API routes (crawl, proxy, download)
│   ├── downloads/          # Thư mục lưu ảnh đã tải
│   └── scraper/
│       ├── Dockerfile      # Docker config cho scraper
│       ├── app.py          # Flask API (Selenium + Bing scraping)
│       └── requirements.txt
├── vite.config.ts          # Vite config (proxy, test)
├── package.json            # Frontend dependencies
└── README.md
```

---

## Scripts

| Lệnh | Mô tả |
|---|---|
| `npm run dev:all` | **Chạy cả Frontend + Backend** |
| `npm run dev` | Chỉ chạy frontend dev server |
| `npm run dev:backend` | Chỉ chạy backend server |
| `npm run build` | Build production |
| `npm run test` | Chạy unit tests |
| `npm run lint` | Kiểm tra linting |
| `npm run format` | Format code với Prettier |

---

## Thêm shadcn/ui components

```bash
npx shadcn@latest add button
```

Components sẽ được thêm vào `src/components/ui/`.
