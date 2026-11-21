/**
 * ============================================================================
 * WITHMUSH_ PORTFOLIO CMS DATA
 * ============================================================================
 * File ini adalah sumber data utama (CMS) untuk:
 *   1. projects             -> Daftar project yang tampil di galeri Project
 *   2. educationExperience  -> Runtutan pendidikan & pengalaman (urutan atas = terbaru)
 *
 * Cara edit:
 *   - Bisa langsung edit array di bawah ini lewat editor kode, ATAU
 *   - Buka tombol "$ cms --open" di bagian bawah Resume (atau tekan Ctrl/Cmd + Shift + E),
 *     kelola data secara visual, lalu klik "Download cms-data.js" untuk mengganti file ini.
 * ============================================================================
 */

window.CMS_DATA = {
  projects: [
    {
      id: "proj-withmush-portfolio",
      title: "Personal Portfolio — withmush_",
      category: "Web Development",
      year: "2026",
      status: "Active",
      summary: "Portofolio pribadi bernuansa editorial, terminal coding, dan galeri lukisan berbingkai dengan sistem CMS mandiri.",
      description: "Dirancang untuk memadukan sisi teknikal dan artistik dalam satu pengalaman web yang ringan. Menggunakan tipografi JetBrains Mono dan Libre Barcode, layout galeri berbingkai ala pameran lukisan, animasi scroll yang fluid, serta CMS berbasis data untuk memudahkan pembaruan project dan riwayat pendidikan.",
      stack: ["HTML5", "CSS3", "JavaScript", "UI/UX Design"],
      image: "",
      link: "",
      repo: ""
    },
    {
      id: "proj-data-exploration",
      title: "Exploratory Data Analysis & Visualization",
      category: "Data Science",
      year: "2025",
      status: "Completed",
      summary: "Eksplorasi dataset, pembersihan data, analisis statistik, dan visualisasi pola untuk mendukung pengambilan keputusan.",
      description: "Rangkaian eksperimen analisis data menggunakan Python dan pendekatan statistik untuk menemukan anomali, korelasi variabel, dan insight yang dapat dipresentasikan secara visual dan mudah dipahami.",
      stack: ["Python", "Statistics", "Data Analysis", "SQL"],
      image: "",
      link: "",
      repo: ""
    },
    {
      id: "proj-painting-series",
      title: "Abstract Visual Exploration — Painting Series",
      category: "Creative Art",
      year: "2025",
      status: "Completed",
      summary: "Eksplorasi komposisi warna, tekstur, dan ekspresi visual di atas kanvas sebagai latihan berpikir kreatif.",
      description: "Koleksi karya lukisan abstrak yang menggabungkan observasi warna, eksperimen medium, dan refleksi visual. Karya ini menjadi fondasi pendekatan visual thinking yang juga diterapkan dalam desain antarmuka dan presentasi data.",
      stack: ["Visual Thinking", "Composition", "Color Study"],
      image: "./assets/painting-color.png",
      link: "",
      repo: ""
    }
  ],

  educationExperience: [
    {
      id: "edu-telkom-university",
      type: "pendidikan",
      period: "2024 — Sekarang",
      title: "S1 Data Science",
      organization: "Telkom University",
      location: "Indonesia",
      summary: "Menempuh pendidikan sarjana di bidang Sains Data dengan fokus pada pengolahan data, matematika, statistika, algoritma, dan machine learning.",
      highlights: ["Python & SQL", "Statistika & Matematika", "Algoritma & Data Analysis", "Machine Learning"]
    },
    {
      id: "exp-self-taught-builder",
      type: "pengalaman",
      period: "2023 — Sekarang",
      title: "Independent Learner & Creative Technologist",
      organization: "Self-Directed Projects & Exploration",
      location: "Remote / Personal Lab",
      summary: "Membangun berbagai eksperimen mandiri di persimpangan pemrograman, analisis data, desain visual, fotografi, dan seni lukis secara otodidak.",
      highlights: ["Problem Solving", "Web & Data Experiments", "Visual Storytelling", "Iterative Prototyping"]
    }
  ]
};
