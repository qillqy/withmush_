/**
 * ============================================================================
 * WITHMUSH_ PORTFOLIO CMS DATA
 * ============================================================================
 * Single source of truth for all CMS-managed sections:
 *   1. artGallery          -> Artworks displayed in the Painting / Art Gallery
 *   2. projects            -> Projects displayed in the Projects Archive
 *   3. educationExperience -> Chronological Education & Experience entries
 *
 * How to update:
 *   - Edit the arrays below directly in your code editor, OR
 *   - Open the private CMS Studio (?cms, Cmd/Ctrl + Shift + E, or tap 5x on
 *     the RESUME barcode), edit visually, and click "Download cms-data.js".
 * ============================================================================
 */

window.CMS_DATA = {
  artGallery: [
    {
      id: "art-crimson-study",
      title: "Crimson Impulse",
      medium: "Abstract Painting",
      year: "2025",
      image: "./assets/painting-red.png",
      description: "An abstract exploration of bold red tones, layered contrast, and spontaneous brushwork—studying how tension and movement emerge on a minimal canvas."
    },
    {
      id: "art-chromatic-bloom",
      title: "Chromatic Study",
      medium: "Abstract Painting",
      year: "2025",
      image: "./assets/painting-color.png",
      description: "A vibrant composition balancing warm and cool pigments to explore visual rhythm, texture, and expressive form."
    }
  ],

  projects: [
    {
      id: "proj-withmush-portfolio",
      title: "Personal Portfolio — withmush_",
      category: "Web Development",
      year: "2026",
      status: "Active",
      summary: "An editorial, code-inspired personal portfolio combining gallery-framed visuals, fluid motion, and a built-in private CMS.",
      description: "Designed to bridge technical craft and visual storytelling in a lightweight static web experience. Features JetBrains Mono and Libre Barcode typography, framed exhibition layouts, smooth scroll choreography, and a passcode-protected CMS for managing artworks, projects, and academic milestones.",
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
      summary: "End-to-end dataset exploration, cleaning, statistical analysis, and clear visual storytelling to support data-driven decisions.",
      description: "A series of analytical experiments built with Python and statistical modeling to uncover anomalies, variable correlations, and actionable patterns presented through clean visual narratives.",
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
      summary: "A hands-on study of color harmony, texture, and abstract composition as a discipline for visual thinking.",
      description: "A curated series of abstract paintings combining observation, experimentation, and visual reflection. This creative practice directly informs my approach to interface composition and data visualization.",
      stack: ["Visual Thinking", "Composition", "Color Study"],
      image: "./assets/painting-color.png",
      link: "",
      repo: ""
    }
  ],

  educationExperience: [
    {
      id: "edu-telkom-university",
      type: "education",
      period: "2024 — Present",
      title: "B.Sc. in Data Science",
      organization: "Telkom University",
      location: "Indonesia",
      summary: "Pursuing an undergraduate degree in Data Science focused on mathematics, statistics, algorithms, data processing, and machine learning.",
      highlights: ["Python & SQL", "Statistics & Mathematics", "Algorithms & Data Analysis", "Machine Learning"]
    },
    {
      id: "exp-self-taught-builder",
      type: "experience",
      period: "2023 — Present",
      title: "Independent Learner & Creative Technologist",
      organization: "Self-Directed Projects & Visual Lab",
      location: "Remote",
      summary: "Building independent experiments at the intersection of programming, data analysis, visual design, photography, and abstract painting.",
      highlights: ["Problem Solving", "Web & Data Experiments", "Visual Storytelling", "Iterative Prototyping"]
    }
  ]
};
