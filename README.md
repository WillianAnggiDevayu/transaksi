# Frontend Pembelian

React + Vite dengan PWA. Deployment menggunakan root domain/subdomain (`/`).

## Build production

Gunakan Node.js seri 22, minimal 22.12 (lihat `.nvmrc`) dan npm.

```sh
npm ci
npm test
npm run lint
npm run build
```

Hasil deploy ada di folder `dist/`, termasuk service worker dan manifest PWA.
Periksa secara lokal dengan `npm run preview`, lalu buka `http://localhost:5173`.
Preview hanya untuk pemeriksaan lokal; production dilayani hosting statis.

## API

`.env.production` menetapkan URL production:

```dotenv
VITE_API_URL=https://procurement-api.my.id/api
```

HTTPS diperlukan agar request dari frontend HTTPS tidak diblokir sebagai mixed content.
Pastikan API menyediakan sertifikat HTTPS valid dan endpoint `/api/login` serta `/api/user`.
Ketersediaan endpoint dan CORS perlu diperiksa dari domain frontend setelah deploy.

Untuk pengembangan, salin `.env.example` ke `.env.local` dan sesuaikan URL jika perlu.
Environment dari platform hosting dan `.env.local` dapat menimpa konfigurasi tersebut.
`VITE_*` masuk ke JavaScript publik: jangan isi password, token, atau API secret.
Perubahan URL membutuhkan build dan deploy ulang.

Backend perlu mengizinkan origin frontend melalui CORS pada route `api/*`, termasuk metode
GET, POST, PUT, PATCH, DELETE, OPTIONS dan header `Authorization`, `Content-Type`, `Accept`.
Aplikasi memakai bearer token; request preflight OPTIONS harus dapat lewat tanpa login.

## cPanel / Apache

1. Buat domain/subdomain frontend dan aktifkan HTTPS.
2. Unggah **isi** folder `dist/` ke document root frontend (misalnya `public_html`).
3. Sertakan file tersembunyi `.htaccess`, yang menyediakan fallback SPA dan revalidasi file PWA.
4. Pastikan Apache mengizinkan `.htaccess`, `mod_rewrite`, dan `mod_headers`.

Gunakan document root frontend tersendiri, terpisah dari document root API Laravel.
Konfigurasi ini belum untuk subfolder karena scope PWA dan URL aset memakai `/`.

## Hosting statis lain

- Install command: `npm ci`
- Build command: `npm run build`
- Output / publish directory: `dist`
- Node.js: seri 22, minimal 22.12
- Environment: `VITE_API_URL=https://procurement-api.my.id/api`

Atur fallback SPA ke `/index.html` dan `Cache-Control: no-cache` untuk `/`, `/index.html`,
`/sw.js`, `/registerSW.js`, serta `/manifest.webmanifest` pada hosting yang tidak membaca `.htaccess`.

## Pemeriksaan setelah deploy

1. Buka frontend melalui HTTPS dan login dengan akun valid.
2. Periksa Network browser: request harus menuju `https://procurement-api.my.id/api`, tanpa error CORS/mixed content.
3. Periksa halaman sesuai role dan logout/login kembali.
4. Pastikan manifest dan service worker termuat, lalu periksa fungsi offline yang digunakan.
5. Setelah deploy berikutnya, pastikan versi baru tampil setelah service worker memperbarui aplikasi.
