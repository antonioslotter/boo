AMP DINAMIS CLOUDFLARE PAGES

STRUKTUR:
amp-dinamis-baru/
├── functions/
│   └── [slug].js
├── public/
│   └── index.html
└── README.md

CARA KERJA:
Satu file functions/[slug].js menangani banyak URL.

Contoh:
https://project.pages.dev/kage303/
https://project.pages.dev/king999/
https://project.pages.dev/ari303/

Tidak perlu membuat folder kage303, king999, ari303 satu per satu.

YANG WAJIB DIUBAH DI functions/[slug].js:

const CANONICAL_ORIGIN = "https://sunsuranceagency.com";
const CANONICAL_BASE = "/contact";
const ACTION_URL = "https://t.ly/303kg";

Contoh canonical:
slug /kage303/
-> https://sunsuranceagency.com/contact/kage303/

Jika canonical berada langsung di root:
const CANONICAL_BASE = "";

Title dan meta description akan dicoba diambil otomatis dari halaman canonical.
Jika gagal, sistem memakai nama slug sebagai fallback.
