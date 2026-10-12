# TemanKencan

Website HTML, CSS, dan JavaScript untuk TemanKencan. GitHub Pages menyajikan
front-end statis, sedangkan Supabase menyediakan database pesanan dan autentikasi
panel admin.

## Pilihan hosting tanpa biaya

Setup tanpa biaya hosting Hostinger menggunakan GitHub Pages untuk website dan
Supabase Free untuk backend. Backend Supabase yang terhubung lewat `app.js` dan
`admin.js` sudah disiapkan di project ini; belum aktif sebelum project Supabase
dibuat, `supabase-schema.sql` dijalankan, dan `supabase-config.js` diisi.

Paket PHP/MySQL Hostinger bukan hosting gratis permanen. Karena itu website tetap
di GitHub Pages dan backend tetap di Supabase—tidak perlu mengunggah PHP ke
Hostinger. Paket gratis Supabase memiliki batas penggunaan dan dapat dijeda
setelah tidak aktif; periksa [harga dan batas terbaru Supabase](https://supabase.com/pricing).

## Menjalankan di komputer

Buka `index.html` di browser atau sajikan folder ini dengan server statis lokal.
Untuk mengedit tampilan, ubah `index.html` dan `style.css`; integrasi formulir ada
di `app.js`, sedangkan panel pesanan ada di `admin.html` dan `admin.js`.

## Menyiapkan backend Supabase

1. Buat project di Supabase.
2. Buka **SQL Editor**, lalu jalankan seluruh isi `supabase-schema.sql`. Ini
   membuat tabel pesanan, kebijakan Row Level Security (RLS), serta daftar admin
   privat. Pengunjung hanya dapat mengirim pesanan; hanya admin terdaftar yang
   dapat membaca pesanan.
3. Buat akun admin melalui **Authentication → Users → Add user**. Gunakan email
   admin yang kamu kendalikan dan simpan kata sandinya dengan aman.
4. Salin **User UID** akun tersebut. Jalankan perintah berikut di SQL Editor
   dengan mengganti UUID contoh:

   ```sql
   insert into private.admin_users (user_id)
   values ('GANTI-DENGAN-USER-UID-ADMIN');
   ```

5. Dari **Project Settings → API**, salin **Project URL** dan **anon/public key**
   atau **publishable key**. Masukkan keduanya di `supabase-config.js`.
   Publishable/anon key memang dapat dilihat di browser; kebijakan RLS membatasi
   data yang bisa diakses. **Jangan pernah menggunakan atau mengunggah
   `service_role` key** di front-end atau GitHub.
6. Uji pengiriman pesanan dari website, kemudian buka `admin.html` dan masuk
   dengan akun yang UID-nya sudah didaftarkan.

File `supabase-schema.sql` membatasi panjang/nilai kolom, mencegah pengunjung
membaca atau mengubah pesanan, dan tidak memberi hak baca kepada akun Supabase
biasa yang belum didaftarkan sebagai admin. Jika project Supabase sudah pernah
menjalankan versi schema sebelumnya, jalankan ulang file SQL tersebut agar paket
Staycation juga diterima oleh database.

## Hosting dengan GitHub Pages

1. Buat repository baru di GitHub. Jika ingin URL seperti
   `https://USERNAME.github.io/`, beri nama repository
   `USERNAME.github.io`. Repository dengan nama lain akan memakai URL
   `https://USERNAME.github.io/NAMA-REPOSITORY/`.
2. Unggah file website ini ke branch `main`, termasuk folder
   `.github/workflows/deploy-pages.yml`.
3. Di repository GitHub, buka **Settings → Pages**. Pada bagian **Build and
   deployment**, pilih **GitHub Actions** sebagai source.
4. Buka tab **Actions** dan tunggu workflow **Deploy website to GitHub Pages**
   selesai dengan status berhasil.
5. Alamat website akan muncul di **Settings → Pages** dan pada ringkasan
   deployment workflow.

Setiap kali perubahan di-push ke branch `main`, GitHub Actions akan menerbitkan
versi terbaru secara otomatis. Pastikan perubahan `supabase-config.js` juga
termasuk dalam deployment setelah nilai project diisi. Jangan menaruh data nyata
pelanggan dalam repository.
