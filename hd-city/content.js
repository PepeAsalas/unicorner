/* ==========================================================================
   PRESENTATION CONTENT — this is the only file you need to edit.
   ==========================================================================

   HOW TO ADD A PHOTO
   1. Copy the photo into the sector's folder, e.g.  assets/img/education/
   2. Write just the file name below, e.g.  images: ["my-school.jpg"]
      (The folder is added automatically. JPG or PNG, ideally ~1800px wide.)
      Material photos go in  assets/img/materials/derako/  (or heartfelt / luxalon).

   HOW TO ADD A PROJECT
   Copy one of the { ... } blocks inside "projects", paste it after the last
   one (mind the comma between blocks) and change the text.

   brand    →  "derako", "heartfelt" or "luxalon"  (sets logo + colour)
   images   →  first photo is shown on the card; the project view shows all.
               Leave empty [] to show a placeholder.
   details  →  the info list next to the photo. Rename, add or remove rows:
               { "Product": "Derako Linear", "Architect": "Studio X", ... }
   Anything you don't need can be left as "".

   MATERIAL SLIDES  (bottom of this file)
   Opened by clicking a brand logo. Each slide has a title, a big "figure"
   (e.g. "B-s1, d0"), a small label under it, text and an optional image.

   Save the file and refresh the browser (F5) to see changes.
   ========================================================================== */

window.HD_CONTENT = {
  title: "Hunter Douglas Architectural",
  subtitle: "Click a building to explore our work by sector",

  sectors: [
    {
      id: "commercial",              // don't change: links to the 3D building + image folder
      name: "Commercial",
      intro: "Offices that look good, sound calm and stay comfortable all day.",
      points: ["Aesthetic appeal", "Acoustic performance", "Thermal & energy efficiency", "Fire safety & compliance"],
      hero: "hero.jpg",
      projects: [
        {
          brand: "derako",
          title: "Office boardroom",
          location: "Project location",
          year: "",
          text: "Add a short description of the project here: the brief, the solution and the result.",
          details: { "Product": "", "Architect": "", "Area": "", "Completed": "" },
          images: ["derako-boardroom.jpg"]
        },
        {
          brand: "heartfelt",
          title: "Meeting room",
          location: "Project location",
          year: "",
          text: "Add a short description of the project here: the brief, the solution and the result.",
          details: { "Product": "", "Architect": "", "Area": "", "Completed": "" },
          images: ["heartfelt-meeting-room.jpg"]
        },
        {
          brand: "luxalon",
          title: "Luxalon project",
          location: "Project location",
          year: "",
          text: "Add a short description of the project here: the brief, the solution and the result.",
          details: { "Product": "", "Architect": "", "Area": "", "Completed": "" },
          images: []
        }
      ]
    },

    {
      id: "education",
      name: "Education",
      intro: "Spaces that help students focus and teachers be heard.",
      points: ["Noise control", "Visual comfort", "Thermal comfort", "Better lighting"],
      hero: "",
      projects: [
        {
          brand: "derako",
          title: "Derako project",
          location: "Project location",
          year: "",
          text: "Add a short description of the project here: the brief, the solution and the result.",
          details: { "Product": "", "Architect": "", "Area": "", "Completed": "" },
          images: []
        },
        {
          brand: "heartfelt",
          title: "HeartFelt project",
          location: "Project location",
          year: "",
          text: "Add a short description of the project here: the brief, the solution and the result.",
          details: { "Product": "", "Architect": "", "Area": "", "Completed": "" },
          images: []
        },
        {
          brand: "luxalon",
          title: "Luxalon project",
          location: "Project location",
          year: "",
          text: "Add a short description of the project here: the brief, the solution and the result.",
          details: { "Product": "", "Architect": "", "Area": "", "Completed": "" },
          images: []
        }
      ]
    },

    {
      id: "healthcare",
      name: "Healthcare",
      intro: "Calm, hygienic and restful environments for patients and staff.",
      points: ["Hygiene & cleanability", "Acoustic privacy", "Patient wellbeing", "Fire safety & compliance"],
      hero: "",
      projects: [
        {
          brand: "derako",
          title: "Derako project",
          location: "Project location",
          year: "",
          text: "Add a short description of the project here: the brief, the solution and the result.",
          details: { "Product": "", "Architect": "", "Area": "", "Completed": "" },
          images: []
        },
        {
          brand: "heartfelt",
          title: "HeartFelt project",
          location: "Project location",
          year: "",
          text: "Add a short description of the project here: the brief, the solution and the result.",
          details: { "Product": "", "Architect": "", "Area": "", "Completed": "" },
          images: []
        },
        {
          brand: "luxalon",
          title: "Luxalon project",
          location: "Project location",
          year: "",
          text: "Add a short description of the project here: the brief, the solution and the result.",
          details: { "Product": "", "Architect": "", "Area": "", "Completed": "" },
          images: []
        }
      ]
    },

    {
      id: "sport",
      name: "Sport",
      intro: "Durable, impact-resistant acoustic solutions for active spaces.",
      points: ["Impact resistance", "Reverberation control", "Durability", "Fire safety & compliance"],
      hero: "",
      projects: [
        {
          brand: "derako",
          title: "Derako project",
          location: "Project location",
          year: "",
          text: "Add a short description of the project here: the brief, the solution and the result.",
          details: { "Product": "", "Architect": "", "Area": "", "Completed": "" },
          images: []
        },
        {
          brand: "heartfelt",
          title: "HeartFelt project",
          location: "Project location",
          year: "",
          text: "Add a short description of the project here: the brief, the solution and the result.",
          details: { "Product": "", "Architect": "", "Area": "", "Completed": "" },
          images: []
        },
        {
          brand: "luxalon",
          title: "Luxalon project",
          location: "Project location",
          year: "",
          text: "Add a short description of the project here: the brief, the solution and the result.",
          details: { "Product": "", "Architect": "", "Area": "", "Completed": "" },
          images: []
        }
      ]
    },

    {
      id: "retail",
      name: "Retail",
      intro: "Ceilings and walls that strengthen the brand experience.",
      points: ["Brand expression", "Acoustic comfort", "Flexible layouts", "Fire safety & compliance"],
      hero: "",
      projects: [
        {
          brand: "derako",
          title: "Derako project",
          location: "Project location",
          year: "",
          text: "Add a short description of the project here: the brief, the solution and the result.",
          details: { "Product": "", "Architect": "", "Area": "", "Completed": "" },
          images: []
        },
        {
          brand: "heartfelt",
          title: "HeartFelt project",
          location: "Project location",
          year: "",
          text: "Add a short description of the project here: the brief, the solution and the result.",
          details: { "Product": "", "Architect": "", "Area": "", "Completed": "" },
          images: []
        },
        {
          brand: "luxalon",
          title: "Luxalon project",
          location: "Project location",
          year: "",
          text: "Add a short description of the project here: the brief, the solution and the result.",
          details: { "Product": "", "Architect": "", "Area": "", "Completed": "" },
          images: []
        }
      ]
    },

    {
      id: "transport",
      name: "Transport",
      intro: "Large spans, heavy traffic and clear wayfinding.",
      points: ["Large-span solutions", "Speech intelligibility", "Low maintenance", "Fire safety & compliance"],
      hero: "",
      projects: [
        {
          brand: "derako",
          title: "Derako project",
          location: "Project location",
          year: "",
          text: "Add a short description of the project here: the brief, the solution and the result.",
          details: { "Product": "", "Architect": "", "Area": "", "Completed": "" },
          images: []
        },
        {
          brand: "heartfelt",
          title: "HeartFelt project",
          location: "Project location",
          year: "",
          text: "Add a short description of the project here: the brief, the solution and the result.",
          details: { "Product": "", "Architect": "", "Area": "", "Completed": "" },
          images: []
        },
        {
          brand: "luxalon",
          title: "Luxalon project",
          location: "Project location",
          year: "",
          text: "Add a short description of the project here: the brief, the solution and the result.",
          details: { "Product": "", "Architect": "", "Area": "", "Completed": "" },
          images: []
        }
      ]
    },

    {
      id: "leisure",
      name: "Leisure",
      intro: "Hospitality and culture spaces with character.",
      points: ["Atmosphere & character", "Acoustic comfort", "Thermal comfort", "Fire safety & compliance"],
      hero: "",
      projects: [
        {
          brand: "derako",
          title: "Derako project",
          location: "Project location",
          year: "",
          text: "Add a short description of the project here: the brief, the solution and the result.",
          details: { "Product": "", "Architect": "", "Area": "", "Completed": "" },
          images: []
        },
        {
          brand: "heartfelt",
          title: "HeartFelt project",
          location: "Project location",
          year: "",
          text: "Add a short description of the project here: the brief, the solution and the result.",
          details: { "Product": "", "Architect": "", "Area": "", "Completed": "" },
          images: []
        },
        {
          brand: "luxalon",
          title: "Luxalon project",
          location: "Project location",
          year: "",
          text: "Add a short description of the project here: the brief, the solution and the result.",
          details: { "Product": "", "Architect": "", "Area": "", "Completed": "" },
          images: []
        }
      ]
    },

    {
      id: "exterior",
      name: "Exterior",
      intro: "Façades and soffits built to last in every climate.",
      points: ["Weather resistance", "Solar shading", "Durability", "Fire safety & compliance"],
      hero: "",
      projects: [
        {
          brand: "derako",
          title: "Derako project",
          location: "Project location",
          year: "",
          text: "Add a short description of the project here: the brief, the solution and the result.",
          details: { "Product": "", "Architect": "", "Area": "", "Completed": "" },
          images: []
        },
        {
          brand: "heartfelt",
          title: "HeartFelt project",
          location: "Project location",
          year: "",
          text: "Add a short description of the project here: the brief, the solution and the result.",
          details: { "Product": "", "Architect": "", "Area": "", "Completed": "" },
          images: []
        },
        {
          brand: "luxalon",
          title: "Luxalon project",
          location: "Project location",
          year: "",
          text: "Add a short description of the project here: the brief, the solution and the result.",
          details: { "Product": "", "Architect": "", "Area": "", "Completed": "" },
          images: []
        }
      ]
    }
  ],

  materials: {
    derako: {
      tagline: "Natural wood ceilings & walls",
      intro: "Add a short introduction to Derako: what it is, where it is used and why architects choose it.",
      image: "",
      slides: [
        { title: "Reaction to fire",       figure: "", label: "Fire classification", text: "Add the fire performance of Derako here: classification, standard and tested build-ups.", image: "" },
        { title: "Acoustic performance",   figure: "", label: "Sound absorption",    text: "Add the acoustic data for Derako here: absorption class, αw values, typical configurations.", image: "" },
        { title: "Sustainability",         figure: "", label: "Environmental data",  text: "Add certifications, recycled content, EPDs and end-of-life information here.", image: "" },
        { title: "Design & installation",  figure: "", label: "Options",             text: "Add finishes, colours, dimensions and installation systems here.", image: "" }
      ]
    },

    heartfelt: {
      tagline: "Acoustic felt ceilings & walls",
      intro: "Add a short introduction to HeartFelt: what it is, where it is used and why architects choose it.",
      image: "",
      slides: [
        { title: "Reaction to fire",       figure: "", label: "Fire classification", text: "Add the fire performance of HeartFelt here: classification, standard and tested build-ups.", image: "" },
        { title: "Acoustic performance",   figure: "", label: "Sound absorption",    text: "Add the acoustic data for HeartFelt here: absorption class, αw values, typical configurations.", image: "" },
        { title: "Sustainability",         figure: "", label: "Environmental data",  text: "Add certifications, recycled content, EPDs and end-of-life information here.", image: "" },
        { title: "Design & installation",  figure: "", label: "Options",             text: "Add finishes, colours, dimensions and installation systems here.", image: "" }
      ]
    },

    luxalon: {
      tagline: "Metal ceilings & façades",
      intro: "Add a short introduction to Luxalon: what it is, where it is used and why architects choose it.",
      image: "",
      slides: [
        { title: "Reaction to fire",       figure: "", label: "Fire classification", text: "Add the fire performance of Luxalon here: classification, standard and tested build-ups.", image: "" },
        { title: "Acoustic performance",   figure: "", label: "Sound absorption",    text: "Add the acoustic data for Luxalon here: absorption class, αw values, typical configurations.", image: "" },
        { title: "Sustainability",         figure: "", label: "Environmental data",  text: "Add certifications, recycled content, EPDs and end-of-life information here.", image: "" },
        { title: "Design & installation",  figure: "", label: "Options",             text: "Add finishes, colours, dimensions and installation systems here.", image: "" }
      ]
    }
  }
};
