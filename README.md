# Mushab Aqil Sulaeman — Portfolio

Website HTML dan CSS dari frame Desktop pada desain Figma. Tidak memerlukan npm, framework, atau proses build.

## Cara publish ke GitHub Pages

1. Ekstrak `Mushab_Portfolio_GitHub_Pages.zip`.
2. Buat repository baru di GitHub, misalnya `mushab-portfolio`.
3. Upload **isi** folder `mushab-portfolio` ke root repository: `index.html`, `styles.css`, `script.js`, `.nojekyll`, dan folder `assets`. Jangan upload file ZIP saja, dan jangan menaruh `index.html` di dalam subfolder.
4. Buka **Settings → Pages**.
5. Pada **Build and deployment**, pilih **Deploy from a branch**.
6. Pilih branch **main** dan folder **/(root)**, lalu **Save**.
7. Setelah deployment selesai, buka URL yang ditampilkan di halaman Pages. Untuk repository biasa, alamatnya berbentuk `https://USERNAME.github.io/mushab-portfolio/`.

Jika upload melalui browser tidak menampilkan `.nojekyll`, buat file bernama `.nojekyll` di root repository melalui **Add file → Create new file**. File ini boleh kosong.

Panduan resmi:
- https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Preview di komputer

Buka `index.html` langsung di browser. Semua foto, SVG, dan font tersedia dalam folder `assets`.

Opsional, jika Python tersedia:

```bash
cd mushab-portfolio
python3 -m http.server 8000
```

Lalu buka http://localhost:8000.

## Mengedit

- **Teks, nama, dan email:** edit `index.html`.
- **Warna, ukuran, spacing, dan layout HP:** edit `styles.css`.
- **Animasi saat scroll dan penanda menu aktif:** edit `script.js`.
- **Foto dan lukisan:** ganti file dengan nama yang sama dalam `assets`.
- Navigasi menggunakan anchor HTML. Contact membuka `mailto:mushabaqilsulaeman@gmail.com`.
- Header tetap terlihat saat halaman di-scroll. Background menu berubah lebih gelap agar terbaca pada bagian berwarna terang.
- Hero memiliki animasi masuk; teks resume, lukisan, dan kontak muncul bertahap saat masuk layar. Animasi dinonaktifkan otomatis jika perangkat mengaktifkan Reduce Motion.
- Path aset bersifat relatif, sehingga website dapat dipasang pada root domain maupun subfolder GitHub Pages.

Layout desktop mengikuti frame Figma **1280 × 6464**. Di layar berukuran 900px ke bawah, biografi dipindahkan ke bawah foto, teks resume dibuat lebih besar dan mengalir mengikuti konten, serta galeri disesuaikan agar tetap terbaca.

## Sumber desain dan font

Desain: https://www.figma.com/design/ThDMDX3ZHWGtkOR7UH4xXV/Untitled?node-id=2001-3

Aset visual diambil dari layer asli desain. Font lokal: Inter, JetBrains Mono (ligature dimatikan untuk mengikuti Mono NL), Libre Barcode 128, Libre Barcode 39 Text, dan Libre Baskerville. Lisensi font SIL Open Font License disertakan di `assets/fonts/*-OFL.txt`.

## Update versi 2

Jika versi pertama sudah dipublikasikan, timpa `index.html` dan `styles.css`, lalu tambahkan `script.js`. Tunggu deployment GitHub Pages selesai, kemudian refresh halaman. Link stylesheet dan script menggunakan penanda versi agar browser mengambil file terbaru.

Paket ini siap diunggah; publikasi di akun GitHub dilakukan setelah file masuk ke repository.
