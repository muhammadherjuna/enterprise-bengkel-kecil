# BengkelOS — ERP Bengkel Motor Skala Kecil (MVP v1.1)

BengkelOS adalah aplikasi ERP berbasis web untuk membantu operasional bengkel motor kecil dengan 1–5 mekanik. Mengintegrasikan pencatatan servis, penjualan sparepart, pengelolaan stok fisik, kasir/pembayaran, pelanggan, dan laporan keuangan sederhana.

---

## 🛠️ Tech Stack

- **Monorepo**: pnpm workspaces
- **Backend**: NestJS, TypeScript, REST API, Zod/DTO Validation, Cookie-Parser, Session Auth
- **ORM & Database**: Prisma ORM, PostgreSQL (`NUMERIC(18,2)` currency precision, atomic transaction locking)
- **Frontend**: React + Vite + TypeScript, Tailwind CSS, Lucide Icons, Vite PWA Plugin
- **Pengujian**: Jest, Supertest, E2E Acceptance Criteria Suite
- **Deployment**: Docker Compose, Nginx Reverse Proxy & Static Caching

---

## 🔑 Akun Demo Bawaan (Seed Data)

Database telah disiapkan dengan data awal untuk uji coba:

| Peran | Username | Password | Keterangan |
| :--- | :--- | :--- | :--- |
| **Owner (Pemilik)** | `owner` | `owner123` | Akses penuh seluruh sistem, batalkan transaksi lunas, opname stok, reset password |
| **Kasir** | `kasir` | `kasir123` | Buat servis, kasir POS & pelunasan nota, kelola produk |
| **Mekanik** | `mekanik` | `mekanik123` | Buat & perbarui pekerjaan servis, tanpa akses endpoint keuangan (AC-13) |

---

## 🚀 Panduan Memulai Cepat (Quick Start)

### 1. Jalankan PostgreSQL via Docker
```bash
docker compose up -d postgres
```

### 2. Generate Prisma Client & Migrasi Database
```bash
# Migrasi schema ke PostgreSQL
pnpm --filter backend run prisma:migrate

# Isi data master awal (Seed)
pnpm --filter backend run prisma:seed
```

### 3. Jalankan Aplikasi (Development)
```bash
# Terminal 1: Backend NestJS (port 3000)
pnpm dev:backend

# Terminal 2: Frontend Vite React (port 5173)
pnpm dev:frontend
```
Akses antarmuka web di: [http://localhost:5173](http://localhost:5173).

---

## 🧪 Pengujian Otomatis (Acceptance Criteria AC-01 s/d AC-18)

Jalankan suite pengujian E2E backend:
```bash
pnpm test:e2e
```

Pengujian memvalidasi 100% kriteria penerimaan PRD:
- **AC-01**: Login valid pengguna sesuai role
- **AC-02**: Login ditolak secara aman tanpa bocor informasi sensitif
- **AC-03**: Servis walk-in tanpa data pelanggan & motor berhasil dibuat
- **AC-04**: Validasi order tanpa item jasa/barang ditolak
- **AC-05**: Total jasa dan barang dihitung ulang di backend + price snapshot
- **AC-06**: Pengurangan stok sparepart tepat 1x saat dikerjakan/selesai
- **AC-07**: Validasi stok tidak cukup ditolak tanpa mutasi parsial
- **AC-08**: Pembayaran tunai dengan perhitungan kembalian akurat
- **AC-09**: Pencegahan klik ganda & idempotency key pembayaran
- **AC-10**: Penjualan langsung POS menghasilkan nota dan mutasi stok
- **AC-11**: Pembatalan transaksi mengembalikan stok (`CANCELLATION_RETURN`) & audit log
- **AC-12**: Metrik dashboard mencerminkan data riil
- **AC-13**: Mekanik ditolak 403 Forbidden pada modul keuangan & kas
- **AC-15**: Uji konkurensi 2 kasir menjual barang terakhir secara simultan (hanya 1 transaksi berhasil, stok akhir 0, tidak terjadi overselling)
- **AC-18**: Rekam medis & riwayat servis kendaraan akurat

---

## 💾 Backup dan Pemulihan Database (AC-16)

Skrip pencadangan dan pemulihan otomatis telah disediakan di `scripts/db-backup-restore.js`:

```bash
# Membuat file backup PostgreSQL ke direktori /backups
node scripts/db-backup-restore.js backup

# Memulihkan database dari file backup terbaru
node scripts/db-backup-restore.js restore
```

---

## 🐳 Deployment Produksi (Docker Compose + Nginx)

Jalankan seluruh stack produksi:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
Aplikasi produksi akan aktif di port 80 dengan reverse proxy Nginx untuk routing SPA dan backend API.
