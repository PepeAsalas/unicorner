/* ==========================================================================
   PRESENTATION CONTENT — this is the only file you need to edit.
   Save, then press F5 in the browser to see your changes.
   ==========================================================================

   PHOTOS
   Copy the photo into the right folder and write just its file name:
     sector projects  →  assets/img/<sector>/        images: ["my-photo.jpg"]
     agenda topics    →  assets/img/<topic id>/      image: "my-photo.jpg"
     material slides  →  assets/img/materials/<brand>/
   (JPG ~2000px wide. No spaces in file names.)

   PROJECTS
   brand     "derako", "heartfelt", "luxalon"  or ""  (sets logo + colours;
             "" uses the general Hunter Douglas style)
   product   e.g. "Derako Wood Grill"
   images    first photo = main photo. Every photo becomes a slide.
   details   rows on the info slide — rename, add or remove freely.
   Empty fields ("") are shown as "to add" placeholders.

   SLIDES  (topics and materials)
   Each slide is one line { layout: "...", ... }. Copy a line to add a slide.
   Layouts follow the Hunter Douglas template:
     "cover"       title, subtitle, image          (opening slide)
     "section"     title, subtitle                 (divider with slats)
     "text-photo"  title, subtitle, text, bullets, image
                   + optional figure/label for a big key number (e.g. "B-s1, d0")
     "text"        title, subtitle, text, bullets
     "photo-info"  image, caption                  (large photo + caption)
     "photo"       image                           (large photo)
     "thanks"      title
   ========================================================================== */

window.HD_CONTENT = {

  /* ---------- General ---------- */
  presentation: {
    name: "CPD presentation",                 // shown in the slide footer
    version: "version 01 - 2026"
  },

  /* Opening slide (photo in assets/img/cover/) */
  cover: {
    title: "Hunter Douglas Architectural",
    subtitle: "CPD presentation",
    image: "cover.jpg"
  },

  /* ---------- Agenda ----------
     "Sectors" is the 3D city. The other items open their own slides.
     Photos for a topic go in assets/img/<topic id>/  e.g. assets/img/fire/   */
  topics: [
    {
      id: "acoustics",
      title: "Acoustics",
      slides: [
        { layout: "section", title: "Acoustics", subtitle: "" },
        { layout: "text-photo", title: "Acoustics", subtitle: "", text: "", bullets: [], image: "" }
      ]
    },

    {
      id: "fire",
      title: "Reaction to fire",
      slides: [
        { layout: "section", title: "Reaction to fire", subtitle: "" },
        { layout: "text-photo", title: "Reaction to fire", subtitle: "", figure: "", label: "", text: "", bullets: [], image: "" }
      ]
    },

    {
      id: "sustainability",
      title: "Sustainability and the Environment",
      slides: [
        { layout: "section", title: "Sustainability and the Environment", subtitle: "" },
        { layout: "text-photo", title: "Sustainability", subtitle: "", text: "", bullets: [], image: "" }
      ]
    },

    {
      id: "special-projects",
      title: "Special Projects",
      slides: [
        { layout: "section", title: "Special Projects", subtitle: "" },
        { layout: "photo-info", image: "", caption: "" }
      ]
    },

    {
      id: "about",
      title: "About Hunter Douglas",
      slides: [
        { layout: "section", title: "About Hunter Douglas", subtitle: "" },
        { layout: "text-photo", title: "About Hunter Douglas", subtitle: "", text: "", bullets: [], image: "" },
        { layout: "text", title: "Our Team", subtitle: "", text: "", bullets: [] }
      ]
    }
  ],

  /* ---------- Sectors (the buildings in the city) ---------- */
  sectors: [
    {
      id: "commercial",
      name: "Commercial",
      intro: "Whether it's an open office, meeting room, lobby or cafeteria, ceilings can help to transform even the most uniform open-plan place into a vibrant, dynamic space that balances contemporary architecture and design with visual and acoustic comfort.",
      hero: "hero.jpg",
      points: [
        { title: "Aesthetic appeal", text: "Enhances the overall design and professional look of the space. Creates a welcoming environment for clients and employees, hides wiring, sprinkler pipes and HVAC systems, and comes in a wide range of finishes." },
        { title: "Acoustic performance", text: "Reduces noise pollution and enhances speech clarity and communication." },
        { title: "Thermal & energy efficiency", text: "Helps regulate indoor temperature, reducing heating and cooling costs, and supports green building certifications like LEED and BREEAM." },
        { title: "Fire safety & compliance", text: "Meets building codes and safety regulations." }
      ],
      projects: [
        {
          brand: "derako",
          product: "Derako Wood Grill",
          title: "",
          location: "",
          year: "",
          text: "",
          details: { "Architect": "", "Area": "", "Completed": "" },
          images: ["derako-boardroom.jpg"]
        },
        {
          brand: "heartfelt",
          product: "HeartFelt Linear",
          title: "",
          location: "",
          year: "",
          text: "",
          details: { "Architect": "", "Area": "", "Completed": "" },
          images: ["heartfelt-meeting-room.jpg"]
        },
        {
          brand: "heartfelt",
          product: "HeartFelt Pyramid",
          title: "",
          location: "",
          year: "",
          text: "",
          details: { "Architect": "", "Area": "", "Completed": "" },
          images: ["heartfelt-pyramid.jpg"]
        },
        {
          brand: "derako",
          product: "Derako Wood Linear",
          title: "",
          location: "",
          year: "",
          text: "",
          details: { "Architect": "", "Area": "", "Completed": "" },
          images: ["derako-wood-linear.jpg"]
        },
        {
          brand: "heartfelt",
          product: "HeartFelt Baffle",
          title: "",
          location: "",
          year: "",
          text: "",
          details: { "Architect": "", "Area": "", "Completed": "" },
          images: ["heartfelt-baffle.jpg"]
        },
        {
          brand: "derako",
          product: "Derako Wood Grill",
          title: "",
          location: "",
          year: "",
          text: "",
          details: { "Architect": "", "Area": "", "Completed": "" },
          images: ["derako-wood-grill-1.jpg"]
        },
        {
          brand: "derako",
          product: "Derako Wood Grill",
          title: "",
          location: "",
          year: "",
          text: "",
          details: { "Architect": "", "Area": "", "Completed": "" },
          images: ["derako-wood-grill-2.jpg"]
        },
        {
          brand: "derako",
          product: "Derako Wood Grill",
          title: "",
          location: "",
          year: "",
          text: "",
          details: { "Architect": "", "Area": "", "Completed": "" },
          images: ["derako-wood-grill-3.jpg"]
        },
        {
          brand: "derako",
          product: "Derako Wood Grill",
          title: "",
          location: "",
          year: "",
          text: "",
          details: { "Architect": "", "Area": "", "Completed": "" },
          images: ["derako-wood-grill-4.jpg"]
        },
        {
          brand: "derako",
          product: "Derako Wood Linear",
          title: "",
          location: "",
          year: "",
          text: "",
          details: { "Architect": "", "Area": "", "Completed": "" },
          images: ["derako-wood-linear-2.jpg"]
        }
      ]
    },

    {
      id: "education",
      name: "Education",
      intro: "Spaces that help students focus and teachers be heard.",
      hero: "hero.jpg",
      points: [
        { title: "Noise control", text: "Reduces echoes and background noise, making it easier for students to listen and focus." },
        { title: "Aesthetic appeal", text: "Creates a neat, finished look that makes classrooms more welcoming." },
        { title: "Thermal comfort", text: "Improves insulation, keeping classrooms warmer in winter and cooler in summer." },
        { title: "Better lighting", text: "Supports safe installation of lights and improves brightness by reflecting light evenly." }
      ],
      projects: [
        {
          brand: "derako",
          product: "Derako Wood Grill",
          title: "",
          location: "",
          year: "",
          text: "",
          details: { "Architect": "", "Area": "", "Completed": "" },
          images: ["derako-wood-grill.jpg"]
        },
        {
          brand: "heartfelt",
          product: "HeartFelt Linear",
          title: "",
          location: "",
          year: "",
          text: "",
          details: { "Architect": "", "Area": "", "Completed": "" },
          images: ["heartfelt-linear.jpg"]
        },
        {
          brand: "",
          product: "",
          title: "Energy Academy",
          location: "",
          year: "",
          text: "",
          details: { "Architect": "", "Area": "", "Completed": "" },
          images: ["energy-academy.jpg"]
        },
        {
          brand: "",
          product: "",
          title: "Groningen University",
          location: "",
          year: "",
          text: "",
          details: { "Architect": "", "Area": "", "Completed": "" },
          images: ["groningen-university.jpg"]
        },
        {
          brand: "",
          product: "",
          title: "Headquarters SABIC",
          location: "Jubail",
          year: "",
          text: "",
          details: { "Architect": "", "Area": "", "Completed": "" },
          images: ["sabic-jubail.jpg"]
        },
        {
          brand: "derako",
          product: "Derako Wood Grill",
          title: "Vernier Paquebot",
          location: "Geneva",
          year: "",
          text: "",
          details: { "Architect": "", "Area": "", "Completed": "" },
          images: ["vernier-paquebot-geneva.jpg"]
        },
        {
          brand: "derako",
          product: "Derako Wood Linear",
          title: "Deloitte University",
          location: "",
          year: "",
          text: "",
          details: { "Architect": "", "Area": "", "Completed": "" },
          images: ["deloitte-university.jpg"]
        },
        {
          brand: "",
          product: "",
          title: "Smart Campus Heerlen",
          location: "Heerlen, NL",
          year: "",
          text: "",
          details: { "Architect": "", "Area": "", "Completed": "" },
          images: ["smart-campus-heerlen.jpg"]
        }
      ]
    },

    {
      id: "healthcare",
      name: "Healthcare",
      intro: "Calm, hygienic and restful environments for patients and staff.",
      hero: "",
      points: [
        { title: "Hygiene & cleanability", text: "" },
        { title: "Acoustic privacy", text: "" },
        { title: "Patient wellbeing", text: "" },
        { title: "Fire safety & compliance", text: "" }
      ],
      projects: [
        {
          brand: "",
          product: "",
          title: "Meander Hospital",
          location: "Netherlands",
          year: "",
          text: "",
          details: { "Architect": "", "Area": "", "Completed": "" },
          images: ["meander-hospital.jpg"]
        },
        {
          brand: "",
          product: "",
          title: "",
          location: "",
          year: "",
          text: "",
          details: { "Architect": "", "Area": "", "Completed": "" },
          images: ["healthcare-project.jpg"]
        },
        {
          brand: "",
          product: "",
          title: "Dodoens Hospital",
          location: "",
          year: "",
          text: "",
          details: { "Architect": "", "Area": "", "Completed": "" },
          images: ["dodoens-hospital.jpg"]
        },
        {
          brand: "",
          product: "",
          title: "Royal National Orthopaedic Hospital",
          location: "Stanmore",
          year: "",
          text: "",
          details: { "Architect": "", "Area": "", "Completed": "" },
          images: ["rnoh-stanmore-1.jpg", "rnoh-stanmore-2.jpg"]
        }
      ]
    },

    {
      id: "sport",
      name: "Sport",
      intro: "Durable, impact-resistant acoustic solutions for active spaces.",
      hero: "",
      points: [
        { title: "Impact resistance", text: "" },
        { title: "Reverberation control", text: "" },
        { title: "Durability", text: "" },
        { title: "Fire safety & compliance", text: "" }
      ],
      projects: [
        {
          brand: "",
          product: "",
          title: "OLV Van Lourdescollege",
          location: "",
          year: "",
          text: "",
          details: { "Architect": "", "Area": "", "Completed": "" },
          images: ["olv-van-lourdescollege.jpg"]
        }
      ]
    },

    {
      id: "retail",
      name: "Retail",
      intro: "Ceilings and walls that strengthen the brand experience.",
      hero: "",
      points: [
        { title: "Brand expression", text: "" },
        { title: "Acoustic comfort", text: "" },
        { title: "Flexible layouts", text: "" },
        { title: "Fire safety & compliance", text: "" }
      ],
      projects: [
        {
          brand: "",
          product: "",
          title: "Reduta Shopping Centre",
          location: "",
          year: "",
          text: "",
          details: { "Architect": "", "Area": "", "Completed": "" },
          images: ["reduta-shopping-centre.jpg"]
        },
        {
          brand: "",
          product: "",
          title: "Decathlon",
          location: "",
          year: "",
          text: "",
          details: { "Architect": "", "Area": "", "Completed": "" },
          images: ["decathlon.jpg"]
        },
        {
          brand: "",
          product: "",
          title: "The Wings",
          location: "Belgium",
          year: "",
          text: "",
          details: { "Architect": "", "Area": "", "Completed": "" },
          images: ["the-wings-belgium.jpg"]
        },
        {
          brand: "",
          product: "",
          title: "McLaren",
          location: "",
          year: "",
          text: "",
          details: { "Architect": "", "Area": "", "Completed": "" },
          images: ["mclaren.jpg"]
        },
        {
          brand: "luxalon",
          product: "Combiline",
          title: "Illa Diagonal",
          location: "Barcelona",
          year: "",
          text: "",
          details: { "Architect": "", "Area": "", "Completed": "" },
          images: ["illa-diagonal-1.jpg", "illa-diagonal-2.jpg"]
        },
        {
          brand: "",
          product: "",
          title: "La Vaguada Shopping Centre",
          location: "Barcelona",
          year: "",
          text: "",
          details: { "Architect": "", "Area": "", "Completed": "" },
          images: ["la-vaguada.jpg"]
        }
      ]
    },

    {
      id: "transport",
      name: "Transport",
      intro: "Large spans, heavy traffic and clear wayfinding.",
      hero: "",
      points: [
        { title: "Large-span solutions", text: "" },
        { title: "Speech intelligibility", text: "" },
        { title: "Low maintenance", text: "" },
        { title: "Fire safety & compliance", text: "" }
      ],
      projects: [

      ]
    },

    {
      id: "leisure",
      name: "Leisure",
      intro: "Hospitality and culture spaces with character.",
      hero: "",
      points: [
        { title: "Atmosphere & character", text: "" },
        { title: "Acoustic comfort", text: "" },
        { title: "Thermal comfort", text: "" },
        { title: "Fire safety & compliance", text: "" }
      ],
      projects: [

      ]
    },

    {
      id: "exterior",
      name: "Exterior",
      intro: "Façades and soffits built to last in every climate.",
      hero: "",
      points: [
        { title: "Weather resistance", text: "" },
        { title: "Solar shading", text: "" },
        { title: "Durability", text: "" },
        { title: "Fire safety & compliance", text: "" }
      ],
      projects: [
        {
          brand: "",
          product: "",
          title: "The Wings",
          location: "Belgium",
          year: "",
          text: "",
          details: { "Architect": "", "Area": "", "Completed": "" },
          images: ["the-wings-belgium.jpg"]
        },
        {
          brand: "",
          product: "",
          title: "Mercedes-Benz",
          location: "",
          year: "",
          text: "",
          details: { "Architect": "", "Area": "", "Completed": "" },
          images: ["mercedes-benz.jpg"]
        },
        {
          brand: "luxalon",
          product: "70U",
          title: "Voortuinen",
          location: "Amsterdam, NL",
          year: "",
          text: "",
          details: { "Architect": "", "Area": "", "Completed": "" },
          images: ["voortuinen-amsterdam.jpg"]
        },
        {
          brand: "luxalon",
          product: "Wide panel",
          title: "Wroclaw Airport",
          location: "",
          year: "",
          text: "",
          details: { "Architect": "", "Area": "", "Completed": "" },
          images: ["wroclaw-airport.jpg"]
        },
        {
          brand: "luxalon",
          product: "Cell50E",
          title: "Ahoy Rotterdam",
          location: "Rotterdam, Netherlands",
          year: "",
          text: "",
          details: { "Architect": "", "Area": "", "Completed": "" },
          images: ["ahoy-rotterdam.jpg"]
        },
        {
          brand: "luxalon",
          product: "V100",
          title: "ING Bank",
          location: "Amsterdam",
          year: "",
          text: "",
          details: { "Architect": "", "Area": "", "Completed": "" },
          images: ["ing-bank-amsterdam.jpg"]
        },
        {
          brand: "",
          product: "Safety Loop",
          title: "NCIA NATO",
          location: "",
          year: "",
          text: "",
          details: { "Architect": "", "Area": "", "Completed": "" },
          images: ["ncia-nato.jpg"]
        }
      ]
    }
  ],

  /* ---------- Material slides (open by clicking a brand logo) ----------
     Photos go in assets/img/materials/derako/  (or heartfelt / luxalon)   */
  materials: {
    derako: [
        { layout: "cover", title: "Derako", subtitle: "Natural wood ceilings & walls", image: "" },
        { layout: "text-photo", title: "Product range", subtitle: "Natural wood ceilings & walls", text: "", bullets: ["Derako Wood Grill", "Derako Wood Linear"], image: "" },
        { layout: "text-photo", title: "Reaction to fire", subtitle: "Fire classification", figure: "", label: "Euroclass", text: "", bullets: [], image: "" },
        { layout: "text-photo", title: "Acoustic performance", subtitle: "Sound absorption", figure: "", label: "αw / absorption class", text: "", bullets: [], image: "" },
        { layout: "text-photo", title: "Sustainability", subtitle: "Environmental data", figure: "", label: "", text: "", bullets: [], image: "" },
        { layout: "photo-info", image: "", caption: "" }
    ],

    heartfelt: [
        { layout: "cover", title: "HeartFelt", subtitle: "Acoustic felt ceilings & walls", image: "" },
        { layout: "text-photo", title: "Product range", subtitle: "Acoustic felt ceilings & walls", text: "", bullets: ["HeartFelt Linear", "HeartFelt Baffle", "HeartFelt Pyramid"], image: "" },
        { layout: "text-photo", title: "Reaction to fire", subtitle: "Fire classification", figure: "", label: "Euroclass", text: "", bullets: [], image: "" },
        { layout: "text-photo", title: "Acoustic performance", subtitle: "Sound absorption", figure: "", label: "αw / absorption class", text: "", bullets: [], image: "" },
        { layout: "text-photo", title: "Sustainability", subtitle: "Environmental data", figure: "", label: "", text: "", bullets: [], image: "" },
        { layout: "photo-info", image: "", caption: "" }
    ],

    luxalon: [
        { layout: "cover", title: "Luxalon", subtitle: "Metal ceilings & façades", image: "" },
        { layout: "text-photo", title: "Product range", subtitle: "Metal ceilings & façades", text: "", bullets: ["Luxalon 70U", "Luxalon V100", "Luxalon Cell", "Luxalon Wide panel", "Luxalon Combiline"], image: "" },
        { layout: "text-photo", title: "Reaction to fire", subtitle: "Fire classification", figure: "", label: "Euroclass", text: "", bullets: [], image: "" },
        { layout: "text-photo", title: "Acoustic performance", subtitle: "Sound absorption", figure: "", label: "αw / absorption class", text: "", bullets: [], image: "" },
        { layout: "text-photo", title: "Sustainability", subtitle: "Environmental data", figure: "", label: "", text: "", bullets: [], image: "" },
        { layout: "photo-info", image: "", caption: "" }
    ]
  }
};
