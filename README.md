# 🛠️ Katalog Open Source IT Tools

Website katalog tool IT open-source yang komprehensif. Dibangun dengan **NestJS**, **MongoDB**, **Next.js**, **MinIO**, dan **Docker**.

![Stack](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)
![Stack](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![Stack](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)
![Stack](https://img.shields.io/badge/MinIO-C72E49?style=flat&logo=minio&logoColor=white)
![Stack](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)

## ✨ Fitur

- **📦 Data Ingestion** — Cron job otomatis untuk fetch data dari RapidAPI + seed data bawaan
- **🖼️ Image Storage** — Gambar icon didownload dari sumber, diupload ke MinIO, URL MinIO disimpan di MongoDB
- **✏️ CMS Editing** — Edit tool via modal (PATCH endpoint) langsung dari UI
- **🔍 Search & Filter** — Pencarian full-text + filter kategori dan tags
- **🤖 AI Recommendation** — Rekomendasi tool menggunakan keyword matching + MongoDB Atlas Vector Search
- **📚 Swagger API Docs** — Dokumentasi API interaktif
- **🐳 Docker** — Satu command untuk menjalankan semua service
- **☁️ GitHub Codespace** — Environment siap pakai dengan `.devcontainer`

## 🚀 Quick Start

### Menggunakan Docker Compose (Recommended)

```bash
# Clone repository
git clone <repo-url>
cd Tugas_Kelompok_Revisi

# Jalankan semua service
docker-compose up -d

# Tunggu semua service ready (~30 detik)
docker-compose ps
```

**Akses:**
| Service | URL |
|---------|-----|
| Frontend (Next.js) | http://localhost:3000 |
| Backend API (NestJS) | http://localhost:3001 |
| Swagger Docs | http://localhost:3001/api/docs |
| MinIO Console | http://localhost:9001 |

### Development Mode (Lokal)

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Pastikan MongoDB & MinIO sudah berjalan (via Docker)
docker-compose up -d mongodb minio

# Jalankan backend
cd backend
npm run start:dev

# Jalankan frontend (terminal baru)
cd frontend
npm run dev
```

### Menggunakan GitHub Codespace

1. Buka repository di GitHub
2. Klik **Code** → **Codespaces** → **Create codespace**
3. Tunggu environment selesai di-setup (otomatis install dependencies)
4. Jalankan: `cd backend && npm run start:dev`
5. Di terminal baru: `cd frontend && npm run dev`

## 📚 API Endpoints

### Tools CRUD
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/tools` | List tools (search, filter, pagination) |
| `GET` | `/api/tools/categories` | List kategori unik |
| `GET` | `/api/tools/:id` | Get tool by ID |
| `PATCH` | `/api/tools/:id` | Update tool (CMS edit) |
| `DELETE` | `/api/tools/:id` | Hapus tool |

#### Query Parameters (GET /api/tools)
- `?search=nmap` — Pencarian judul/deskripsi
- `?category=Network Security` — Filter kategori
- `?tags=scanner,network` — Filter tags
- `?page=1&limit=20` — Pagination

### AI Recommendation
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/recommend` | Dapatkan rekomendasi AI |

**Request body:**
```json
{
  "question": "Apa tool yang bagus untuk port scanning?"
}
```

### Data Ingestion
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/ingestion/trigger` | Trigger ingestion manual |

## 🔍 MongoDB Atlas Vector Search Setup

Untuk rekomendasi AI yang lebih akurat, gunakan MongoDB Atlas Vector Search:

### 1. Buat Cluster di MongoDB Atlas
- Buat free cluster (M0) atau berbayar (M10+)
- Update `MONGO_URI` di `.env` dengan connection string Atlas

### 2. Buat Vector Search Index
Di Atlas UI, buka **Atlas Search** → **Create Index** → pilih **JSON Editor**:

```json
{
  "type": "vectorSearch",
  "fields": [
    {
      "path": "embedding",
      "type": "vector",
      "numDimensions": 100,
      "similarity": "cosine"
    }
  ]
}
```

Beri nama index: `vector_index`

### 3. Keuntungan Vector Search vs Text Search
| Aspek | Text Search | Vector Search |
|-------|-------------|---------------|
| Akurasi | Cocokkan kata literal | Pahami makna semantik |
| Sinonim | ❌ Tidak support | ✅ Otomatis |
| Multi-bahasa | ❌ Terbatas | ✅ Support |
| Typo tolerance | ❌ Tidak | ✅ Lebih toleran |
| Setup | Mudah (default) | Perlu Atlas + Index |

## 🖼️ Alur Penyimpanan Gambar (MinIO)

```
RapidAPI → Download Image → Upload ke MinIO Bucket → Simpan URL MinIO ke MongoDB
```

1. Saat ingestion, gambar TIDAK disimpan URL asli dari RapidAPI
2. Gambar didownload ke buffer
3. Buffer diupload ke MinIO bucket `tool-icons`
4. URL MinIO internal (`http://minio:9000/tool-icons/...`) disimpan di MongoDB

## 🏗️ Struktur Proyek

```
├── backend/                # NestJS API
│   ├── src/
│   │   ├── tools/          # CRUD + Search + Filter
│   │   ├── ingestion/      # Cron job + RapidAPI
│   │   ├── minio/          # Image storage
│   │   └── recommend/      # AI recommendation
│   └── Dockerfile
├── frontend/               # Next.js + Tailwind CSS
│   ├── src/
│   │   ├── app/            # Pages
│   │   ├── components/     # UI components
│   │   └── lib/            # API client
│   └── Dockerfile
├── .devcontainer/          # GitHub Codespace
├── docker-compose.yml      # Orchestration
└── README.md
```

## 🔧 Environment Variables

Salin `.env.example` ke `.env` di folder `backend/`:

```bash
cp backend/.env.example backend/.env
```

Edit sesuai kebutuhan (RapidAPI key, MongoDB Atlas URI, dll).

## 👥 Tim

Tugas Kelompok — Katalog Open Source IT Tools
