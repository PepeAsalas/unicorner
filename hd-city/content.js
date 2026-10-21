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

   MATERIAL PRODUCTS
   name, acoustic, fire, voc (the three key figures), specs (list),
   drawing / finishes / certificates (images)

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
     "figures"     title, subtitle, figures: [{ value, label }], image   (big numbers)
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

  /* ---------- Agenda & landmark buildings ----------
     "Sectors" is the 3D city. These open their own slides, from the agenda
     menu or by clicking their landmark building in the city.
     Photos go in assets/img/<topic id>/  e.g. assets/img/about/   */
  topics: [
    {
      id: "special-projects",
      title: "Special Projects",
      slides: [
        { layout: "section", title: "Special Projects", subtitle: "" },
        { layout: "photo-info", image: "organic-ceiling.jpg", caption: "" },
        { layout: "photo-info", image: "star-frame.jpg", caption: "" }
      ]
    },

    {
      id: "about",
      title: "About Hunter Douglas",
      slides: [
        { layout: "section", title: "About Hunter Douglas", subtitle: "A world of innovation" },
        { layout: "figures", title: "A world of innovation", subtitle: "Hunter Douglas worldwide", figures: [{"value": "132", "label": "Companies"}, {"value": "47", "label": "Manufacturing operations"}, {"value": "86", "label": "Assembly operations"}, {"value": "100", "label": "Countries"}, {"value": "23,500", "label": "Employees worldwide"}], image: "world-of-innovation.jpg" },
        { layout: "text-photo", title: "Search for products on NBS", subtitle: "NBS Source", text: "Need an NBS specification? We are an accredited manufacturer on NBS Source, where you can download a specification, or you can get in touch with us directly.", bullets: [], image: "nbs-source.jpg" },
        { layout: "text-photo", title: "Samples available on request", subtitle: "", text: "Should you need any samples, we have a wide range of samples and colours readily available.", bullets: ["A5 wood finishes", "Linear individual panels", "Topline samples", "Grill elements dowel", "Different perforations", "Brochures"], image: "samples.jpg" },
        { layout: "text", title: "Our team", subtitle: "", text: "", bullets: [] },
        { layout: "thanks", title: "Designed to work for you" }
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

  /* ---------- Material pages (open by clicking a brand logo or a project's product) ----------
     Order: cover → product spec pages → reaction to fire → acoustics → sustainability.
     Photos go in assets/img/materials/derako/  (or heartfelt / luxalon).
     Shared images are in assets/img/materials/shared/  (written as "../shared/name.jpg").  */
  materials: {
    derako: {
      name: "Derako",
      tagline: "Natural wood ceilings & walls",
      intro: "",
      cover: "../../commercial/derako-boardroom.jpg",

      // One spec page per product. A project's "product" opens the matching page.
      products: [
        { name: "Derako Wood Grill", acoustic: "Up to Class A", fire: "B-s2,d0", voc: "A+", drawing: "wood-grill-drawing.jpg", finishes: "wood-grill-finishes.jpg", certificates: "wood-grill-certificates.jpg",
          specs: ["Sound absorption (αw) up to Class A with acoustical pad", "Sustainability: C2C, FSC, PEFC", "Reaction to fire B-s2,d0 (B-s1,d0 on request)", "Fully demountable system", "Slat height 40 to 140 mm, thickness 15 to 35 mm (40 mm on request)", "Lengths 590 to 3500 mm (depending on wood species)", "Joint width 25 to 140 mm", "VOC emission class A+"] },
        { name: "Derako Wood Linear", acoustic: "Up to Class C", fire: "B-s2,d0", voc: "A+", drawing: "wood-linear-drawing.jpg", finishes: "wood-linear-finishes.jpg", certificates: "wood-linear-certificates.jpg",
          specs: ["Sound absorption (αw) up to Class C", "Sustainability: C2C, FSC, PEFC", "Reaction to fire B-s2,d0 (B-s1,d0 on request)", "Panel width 63 to 184 mm (standard 92 and 116 mm)", "Thickness 15 to 18 mm", "Lengths 590 to 3500 mm (depending on wood species)", "Various modules and joint widths", "VOC emission class A+"] }
      ],

      fire: [
        { layout: "section", title: "Reaction to fire", subtitle: "" },
        { layout: "text-photo", title: "Fire protection", subtitle: "Building materials and construction parts", text: "We have to make a distinction between building materials and construction parts.", bullets: ["EN 13501-1: materials are classified according to their reaction to fire", "EN 13501-2: construction parts are classified for their resistance to fire"], image: "../shared/fire-wood.jpg" },
        { layout: "text-photo", title: "Fire classification", subtitle: "Equivalent to Class 0", figure: "B-s2,d0", label: "Euroclass · EN 13501-1", text: "The EN 13501-1 standard provides a European fire classification system for construction products, assessing their reaction to fire through tests measuring ignitability, flame spread, heat, smoke and flaming droplet production. Products get a Euroclass rating from A1 to F, a smoke class (s1, s2, s3) and a flaming droplet class (d0, d1, d2).", bullets: ["B = little or no contribution to the cause of fire", "s2 = limited development of smoke", "d0 = no production of burning droplets", "B-s1,d0 available on request"], image: "../shared/fire-wood.jpg" },
        { layout: "text-photo", title: "Fire testing", subtitle: "", text: "For all construction products, the consideration is a fire initiated in a room, which may grow and eventually reach flash-over.", bullets: ["Phase I: ignition / initiation", "Phase II: fire growth until flash-over", "Phase III: past flash-over, fully developed fire", "Phase IV: fire runs out"], image: "../shared/fire-development-curve.jpg" }
      ],

      acoustics: [
        { layout: "text-photo", title: "Acoustic performance", subtitle: "Sound absorption", figure: "Up to Class A", label: "αw · Wood Grill with acoustical pad", text: "", bullets: ["Derako Wood Grill: up to Class A with acoustical pad", "Derako Wood Linear: up to Class C"], image: "wood-grill-drawing.jpg" }
      ],

      sustainability: [
        { layout: "section", title: "Sustainability", subtitle: "and the Environment" },
        { layout: "text-photo", title: "Circular economy", subtitle: "", text: "Our current linear economy is not sustainable and leads to waste, environmental damage and shortages of critical raw materials. We need to convert to a circular economy based on designing out waste and pollution, keeping products and materials in use, and regenerating natural systems.", bullets: [], image: "../shared/circular-economy.jpg" },
        { layout: "text-photo", title: "Cradle to Cradle Certified®", subtitle: "Silver", text: "Hunter Douglas has always been a pioneer in sustainability, with more than 80% of its products Cradle to Cradle Certified® at Silver level. Cradle to Cradle is an approach towards the circular economy: materials flow safely in closed loops, so the quality of raw materials is kept over several life cycles. Products are re-assessed every 2 years.", bullets: ["Material health", "Material reutilization: input & end of life", "Energy use", "Water stewardship", "Social fairness"], image: "../shared/cradle-to-cradle.jpg" },
        { layout: "photo-info", image: "../shared/c2c-process.jpg", caption: "Cradle to Cradle Certified® process" },
        { layout: "text-photo", title: "FSC® or PEFC certification", subtitle: "The mark of responsible forestry", text: "FSC (Forest Stewardship Council) is an international non-governmental organisation, established in 1993, promoting responsible forest management through certified standards and clear labelling of forest products. PEFC (Programme for the Endorsement of Forest Certification) has similar standards and was set up for small family and community forest owners. Both let you source wood from socially and environmentally responsible forestry.", bullets: [], image: "../shared/fsc-pefc.jpg" },
        { layout: "text-photo", title: "BREEAM", subtitle: "Green building certification", figure: "A+", label: "BREEAM rating · solid and veneered wood", text: "BREEAM is one of the most respected green building certification systems worldwide, assessing the sustainability of a building across 9 categories. Both our solid and veneered wood options achieve an A+ rating.", bullets: [], image: "" }
      ]
    },

    heartfelt: {
      name: "HeartFelt",
      tagline: "Acoustic felt ceilings & walls",
      intro: "",
      cover: "../../commercial/heartfelt-meeting-room.jpg",

      // One spec page per product. A project's "product" opens the matching page.
      products: [
        { name: "HeartFelt Linear", acoustic: "Class A", fire: "B-s1,d0", voc: "A+", drawing: "linear-drawing.jpg", finishes: "linear-finishes.jpg", certificates: "linear-certificates.jpg",
          specs: ["Non-woven thermoformed PES fibres", "Heights of 55, 64, 80 and 105 mm, 40 mm wide", "Modulations from 50 to 200 mm in steps of 10 mm", "Up to 0.95 αw with acoustical pad (Class A)", "Easy to install, low risk of damage", "Easy to maintain: dirt and dust resistant", "Reaction to fire B-s1,d0"] },
        { name: "HeartFelt Origami Pyramid", acoustic: "Class A", fire: "B-s1,d0", voc: "A+", drawing: "origami-pyramid-drawing.jpg", finishes: "origami-pyramid-finishes.jpg", certificates: "origami-pyramid-certificates.jpg",
          specs: ["Non-woven thermoformed PES fibres", "Tile size 600 x 600 mm", "Up to 0.95 αw with acoustical pad (Class A)", "Easy to install, low risk of damage", "Easy to maintain: dirt and dust resistant", "Reaction to fire B-s1,d0"] },
        { name: "HeartFelt Baffle", acoustic: "Class A", fire: "B-s1,d0", voc: "A+", drawing: "baffle-drawing.jpg", finishes: "baffle-finishes.jpg", certificates: "baffle-certificates.jpg",
          specs: ["Non-woven thermoformed PES fibres", "Up to 0.95 αw with acoustical pad (Class A)", "Easy to install, low risk of damage", "Easy to maintain: dirt and dust resistant", "Reaction to fire B-s1,d0"] }
      ],

      fire: [
        { layout: "section", title: "Reaction to fire", subtitle: "" },
        { layout: "text-photo", title: "Fire protection", subtitle: "Building materials and construction parts", text: "We have to make a distinction between building materials and construction parts.", bullets: ["EN 13501-1: materials are classified according to their reaction to fire", "EN 13501-2: construction parts are classified for their resistance to fire"], image: "../shared/fire-wood.jpg" },
        { layout: "text-photo", title: "Fire classification", subtitle: "", figure: "B-s1,d0", label: "Euroclass · EN 13501-1", text: "The EN 13501-1 standard provides a European fire classification system for construction products, assessing their reaction to fire through tests measuring ignitability, flame spread, heat, smoke and flaming droplet production. Products get a Euroclass rating from A1 to F, a smoke class (s1, s2, s3) and a flaming droplet class (d0, d1, d2).", bullets: ["B = little or no contribution to the cause of fire", "s1 = very limited development of smoke", "d0 = no production of burning droplets"], image: "../shared/fire-wood.jpg" },
        { layout: "text-photo", title: "Fire testing", subtitle: "", text: "For all construction products, the consideration is a fire initiated in a room, which may grow and eventually reach flash-over.", bullets: ["Phase I: ignition / initiation", "Phase II: fire growth until flash-over", "Phase III: past flash-over, fully developed fire", "Phase IV: fire runs out"], image: "../shared/fire-development-curve.jpg" }
      ],

      acoustics: [
        { layout: "text-photo", title: "Acoustic performance", subtitle: "Sound absorption", figure: "0.95 αw", label: "Class A · with acoustical pad", text: "", bullets: ["HeartFelt Linear: up to 0.95 αw (Class A)", "HeartFelt Origami Pyramid: up to 0.95 αw (Class A)", "HeartFelt Baffle: up to 0.95 αw (Class A)"], image: "linear-drawing.jpg" }
      ],

      sustainability: [
        { layout: "section", title: "Sustainability", subtitle: "and the Environment" },
        { layout: "text-photo", title: "Circular economy", subtitle: "", text: "Our current linear economy is not sustainable and leads to waste, environmental damage and shortages of critical raw materials. We need to convert to a circular economy based on designing out waste and pollution, keeping products and materials in use, and regenerating natural systems.", bullets: [], image: "../shared/circular-economy.jpg" },
        { layout: "text-photo", title: "Cradle to Cradle Certified®", subtitle: "Silver", text: "Hunter Douglas has always been a pioneer in sustainability, with more than 80% of its products Cradle to Cradle Certified® at Silver level. Cradle to Cradle is an approach towards the circular economy: materials flow safely in closed loops, so the quality of raw materials is kept over several life cycles. Products are re-assessed every 2 years.", bullets: ["Material health", "Material reutilization: input & end of life", "Energy use", "Water stewardship", "Social fairness"], image: "../shared/cradle-to-cradle.jpg" },
        { layout: "photo-info", image: "../shared/c2c-process.jpg", caption: "Cradle to Cradle Certified® process" }
      ]
    },

    luxalon: {
      name: "Luxalon",
      tagline: "Metal ceilings & façades",
      intro: "",
      cover: "../../exterior/wroclaw-airport.jpg",

      // One spec page per product. A project's "product" opens the matching page.
      products: [
        { name: "Luxalon 70U", acoustic: "", fire: "", voc: "", drawing: "", finishes: "", certificates: "",
          specs: [] },
        { name: "Luxalon V100", acoustic: "", fire: "", voc: "", drawing: "", finishes: "", certificates: "",
          specs: [] },
        { name: "Luxalon Cell50E", acoustic: "", fire: "", voc: "", drawing: "", finishes: "", certificates: "",
          specs: [] },
        { name: "Luxalon Wide panel", acoustic: "", fire: "", voc: "", drawing: "", finishes: "", certificates: "",
          specs: [] },
        { name: "Luxalon Combiline", acoustic: "", fire: "", voc: "", drawing: "", finishes: "", certificates: "",
          specs: [] }
      ],

      fire: [
        { layout: "section", title: "Reaction to fire", subtitle: "" },
        { layout: "text-photo", title: "Fire protection", subtitle: "Building materials and construction parts", text: "We have to make a distinction between building materials and construction parts.", bullets: ["EN 13501-1: materials are classified according to their reaction to fire", "EN 13501-2: construction parts are classified for their resistance to fire"], image: "../shared/fire-wood.jpg" },
        { layout: "text-photo", title: "Fire classification", subtitle: "", figure: "", label: "Euroclass · EN 13501-1", text: "", bullets: [], image: "../shared/fire-wood.jpg" },
        { layout: "text-photo", title: "Fire testing", subtitle: "", text: "For all construction products, the consideration is a fire initiated in a room, which may grow and eventually reach flash-over.", bullets: ["Phase I: ignition / initiation", "Phase II: fire growth until flash-over", "Phase III: past flash-over, fully developed fire", "Phase IV: fire runs out"], image: "../shared/fire-development-curve.jpg" }
      ],

      acoustics: [
        { layout: "text-photo", title: "Acoustic performance", subtitle: "Sound absorption", figure: "", label: "αw", text: "", bullets: [], image: "" }
      ],

      sustainability: [
        { layout: "section", title: "Sustainability", subtitle: "and the Environment" },
        { layout: "text-photo", title: "Circular economy", subtitle: "", text: "Our current linear economy is not sustainable and leads to waste, environmental damage and shortages of critical raw materials. We need to convert to a circular economy based on designing out waste and pollution, keeping products and materials in use, and regenerating natural systems.", bullets: [], image: "../shared/circular-economy.jpg" },
        { layout: "text-photo", title: "Cradle to Cradle Certified®", subtitle: "Silver", text: "Hunter Douglas has always been a pioneer in sustainability, with more than 80% of its products Cradle to Cradle Certified® at Silver level. Cradle to Cradle is an approach towards the circular economy: materials flow safely in closed loops, so the quality of raw materials is kept over several life cycles. Products are re-assessed every 2 years.", bullets: ["Material health", "Material reutilization: input & end of life", "Energy use", "Water stewardship", "Social fairness"], image: "../shared/cradle-to-cradle.jpg" },
        { layout: "photo-info", image: "../shared/c2c-process.jpg", caption: "Cradle to Cradle Certified® process" }
      ]
    }
  }
};
