# BengkelOS — Enterprise Workshop ERP & Point of Sale System

<div align="center">

![BengkelOS Banner](https://img.shields.io/badge/BengkelOS-Enterprise%20ERP%20v1.1-18181b?style=for-the-badge&logo=gear&logoColor=white)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/Backend-NestJS%2010-ea2845?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-06b6d4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/ORM-Prisma-2d3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2016-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Container-Docker%20Compose-2496ed?style=flat-square&logo=docker)](https://www.docker.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline%20Cache%20Ready-5a0fc8?style=flat-square&logo=pwa)](https://web.dev/progressive-web-apps/)

**BengkelOS** adalah sistem ERP *(Enterprise Resource Planning)* dan Kasir POS *(Point of Sale)* modern berbasis monorepo yang dirancang khusus untuk operasional bengkel motor skala kecil hingga menengah (1–5 mekanik). Sistem ini mengintegrasikan seluruh alur kerja bengkel secara *real-time*: manajemen antrean servis, kasir POS eceran, buku kas keuangan laci kasir, rekam medis riwayat motor, dan kartu stok fisik dengan proteksi transaksi atomik.

</div>

---

## 🎯 Fitur & Keunggulan Utama

### 1. 🛡️ Concurrency Control & Transaksi Finansial Presisi
- **Pencegahan Overselling**: Menggunakan mekanisme *Row-Level Locking* (`SELECT ... FOR UPDATE`) pada PostgreSQL via transaksi atomik Prisma ORM. Menguji dan menjamin bahwa jika 2 kasir menjual unit barang terakhir secara bersamaan, hanya 1 transaksi yang berhasil tanpa ada stok negatif (*AC-15*).
- **Presisi Akuntansi Finansial**: Semua nominal harga, HPP, diskon, dan subtotal menggunakan tipe data `NUMERIC(18,2)` / `Decimal` untuk mengeliminasi potensi galat pembulatan *floating point*.
- **Idempotency Protection**: Dilengkapi *anti double-click* dan token idempotensi pada proses checkout kasir untuk mencegah penagihan ganda (*AC-09*).

### 2. 👥 Dashboard & Hak Akses Berdasarkan Jabatan (RBAC)
- **Dashboard Mekanik**: Dirancang untuk terminal stall bengkel. Hanya menampilkan daftar pekerjaan servis yang sedang ditangani, antrean menunggu, dan peringatan suku cadang menipis. Data omzet uang dan saldo kas disembunyikan untuk menjaga privasi finansial (*AC-13*).
- **Dashboard Kasir**: Menampilkan omzet uang masuk harian, posisi saldo kas fisik laci kasir, antrean servis yang siap dibayar, dan pintasan kilat ke kasir POS eceran.
- **Dashboard Owner (Pemilik)**: Pandangan eksekutif menyeluruh dengan metrik omzet, laba kotor estimasi, status kasir aktif, serta spanduk peringatan inventori minimum.

### 3. 🏍️ Rekam Medis Kendaraan & Pelanggan (AC-18)
- Pelacakan riwayat perawatan motor berdasarkan nomor plat kendaraan.
- Riwayat odometer (kilometer), mekanik yang menangani, catatan keluhan, serta rincian suku cadang dan jasa yang pernah dikerjakan.
- Fleksibilitas transaksi *Walk-In* tanpa mewajibkan pendaftaran data pelanggan atau nomor plat di awal (*AC-03*).

### 4. 📦 Katalog Sparepart & Buku Kas (Cash Ledger)
- **Kartu Stok & Stock Opname Fisik**: Pelacakan mutasi masuk, keluar, penjualan, dan penyesuaian stok fisik dengan riwayat *balance after* yang transparan.
- **Laci Kas Kasir & Buku Kas**: Pencatatan kas masuk dan kas keluar harian (listrik, konsumsi mekanik, perkakas) dengan perhitungan saldo kas laci register secara otomatis.
- **Laporan Rekonsiliasi & Estimasi Laba Kotor**: Menghitung pendapatan bersih jasa dan suku cadang dikurangi HPP modal beli (*COGS*) secara *real-time* (*FR-05*).

### 5. 📱 PWA & Tipografi Enterprise
- **Offline Caching**: Dilengkapi Service Worker (*Vite PWA Plugin*) untuk mendukung akses lokal yang andal saat jaringan internet terputus.
- **Native System UI Stack**: Mengadopsi standar tipografi enterprise (GitHub/Apple/Microsoft system fonts) dengan *tabular-nums* untuk angka nominal yang sejajar secara vertikal, bebas FOUT, dan rendering tajam tanpa ketergantungan CDN eksternal.

---

## 🏗️ Arsitektur Monorepo

```text
enterprise-bengkel-kecil/
├── apps/
│   ├── backend/                 # API Server (NestJS 10, Prisma, PostgreSQL)
│   │   ├── prisma/              # Schema database & skrip seeding
│   │   ├── src/                 # Modul: auth, service-orders, products, payments, cash, etc.
│   │   └── test/                # E2E Test Suite (AC-01 s/d AC-18)
│   └── frontend/                # SPA Client (React 18, Vite, Tailwind CSS, PWA)
│       ├── public/              # Manifest PWA & asset statis
│       └── src/                 # Pages, Komponen UI, Konteks Autentikasi, Modals
├── docker/                      # Konfigurasi Nginx reverse proxy
├── scripts/                     # Skrip otomatisasi backup & restore PostgreSQL (AC-16)
├── docker-compose.yml           # Konfigurasi container development (PostgreSQL)
├── docker-compose.prod.yml      # Konfigurasi deployment produksi (Nginx + Backend + Frontend + DB)
└── package.json                 # Monorepo workspace configuration (pnpm)
```

---

## 🔑 Akun Bawaan Pengujian (Seed Data)

Database dilengkapi dengan akun default untuk verifikasi seluruh alur hak akses:

| Peran (Role) | Username | Password | Deskripsi Wewenang |
| :--- | :--- | :--- | :--- |
| **Owner (Pemilik)** | `owner` | `owner123` | Akses penuh: keuangan, inventori opname, pembatalan transaksi, audit log |
| **Kasir** | `kasir` | `kasir123` | Buat servis, kasir POS eceran, pelunasan pembayaran, pencatatan beban kas kecil |
| **Mekanik** | `mekanik` | `mekanik123` | Pembaruan status servis & penggantian part (Ditolak 403 pada modul kas/keuangan) |

---

## 🚀 Panduan Instalasi & Menjalankan (Local Development)

### Prasyarat
- [Node.js](https://nodejs.org/) v18+ atau v20+
- [pnpm](https://pnpm.io/) v9+
- [Docker & Docker Compose](https://www.docker.com/)

### 1. Clone Repositori & Pasang Dependensi
```bash
git clone https://github.com/muhammadherjuna/enterprise-bengkel-kecil.git
cd enterprise-bengkel-kecil
pnpm install
```

### 2. Jalankan Database PostgreSQL
```bash
docker compose up -d postgres
```

### 3. Migrasi Database & Seeding Data
```bash
# Generate Prisma Client & Migrate Schema
pnpm --filter backend run prisma:migrate

# Isi data master awal (Akun, Produk Sparepart, Jasa Servis)
pnpm --filter backend run prisma:seed
```

### 4. Jalankan Aplikasi
```bash
# Terminal 1: Backend NestJS (Port 3000)
pnpm dev:backend

# Terminal 2: Frontend Vite React (Port 5173)
pnpm dev:frontend
```
Buka browser di: **[http://localhost:5173](http://localhost:5173)**.

---

## 🧪 Pengujian Otomatis (Acceptance Criteria Suite)

Seluruh fungsionalitas sistem telah diuji melalui suite pengujian otomatis *End-to-End* (E2E) yang mencakup 100% kriteria penerimaan spesifikasi:

```bash
pnpm test:e2e
```

| ID Kriteria | Skenario Validasi |
| :--- | :--- |
| **AC-01** | Autentikasi sesi valid berdasarkan peran (Owner, Kasir, Mekanik) |
| **AC-02** | Penolakan login kredensial tidak valid tanpa membocorkan info sensitif |
| **AC-03** | Pembuatan order servis walk-in tanpa data pelanggan & kendaraan |
| **AC-04** | Validasi penolakan order servis kosong (tanpa jasa/barang) |
| **AC-05** | Perhitungan ulang total biaya di server & penyimpanan price snapshot |
| **AC-06** | Pengurangan stok fisik suku cadang tepat 1x saat servis dikerjakan |
| **AC-07** | Penolakan transaksi saat stok tidak mencukupi tanpa mutasi parsial |
| **AC-08** | Perhitungan uang kembalian pembayaran tunai yang akurat |
| **AC-09** | Pencegahan klik ganda kasir melalui mekanisme Idempotency Key |
| **AC-10** | Penjualan langsung POS retail menghasilkan nota & mutasi stok otomatis |
| **AC-11** | Pembatalan transaksi mengembalikan stok (`CANCELLATION_RETURN`) & audit log |
| **AC-12** | Metrik kartu KPI Dashboard mencerminkan data aktual database |
| **AC-13** | Perlindungan RBAC: Mekanik diblokir (403 Forbidden) pada endpoint keuangan |
| **AC-15** | Uji konkurensi: 2 kasir menjual unit barang terakhir secara simultan (bebas race condition) |
| **AC-16** | Mekanisme pencadangan dan pemulihan database PostgreSQL (*Backup/Restore*) |
| **AC-17** | Responsivitas antarmuka mobile/tablet tanpa horizontal overflow scroll |
| **AC-18** | Kelengkapan data riwayat rekam medis servis motor per nomor polisi |

---

## 💾 Pencadangan & Pemulihan Database (AC-16)

Skrip pemeliharaan database otomatis tersedia pada direktori `scripts/`:

```bash
# Membuat arsip cadangan (Dump) ke folder backups/
node scripts/db-backup-restore.js backup

# Memulihkan database dari arsip cadangan terbaru
node scripts/db-backup-restore.js restore
```

---

## 🐳 Deployment Produksi (Docker Compose)

Untuk menjalankan seluruh lingkungan produksi secara mandiri (PostgreSQL, Backend API, Frontend SPA, dan Nginx Reverse Proxy):

```bash
docker compose -f docker-compose.prod.yml up -d --build
```
Aplikasi produksi akan berjalan pada port `80` dengan konfigurasi gzip compression, HTTP security headers, dan penanganan fallback SPA routing.

---

## 📄 Lisensi

Projek ini didistribusikan di bawah lisensi [MIT License](LICENSE).
