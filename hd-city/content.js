/* ==========================================================================
   PRESENTATION CONTENT — this is the only file you need to edit.
   ==========================================================================

   HOW TO ADD A PHOTO
   1. Copy the photo into the sector's folder, e.g.  assets/img/education/
   2. Write just the file name below, e.g.  images: ["my-school.jpg"]
      (The folder is added automatically. JPG or PNG, ideally ~1800px wide.)

   HOW TO ADD A PROJECT
   Copy one of the { ... } blocks inside "projects", paste it after the last
   one (mind the comma between blocks) and change the text.

   brand   →  "derako", "heartfelt" or "luxalon"  (sets logo + colour)
   images  →  first photo is shown on the card; click it to see all of them.
              Leave empty [] to show a placeholder.
   Anything you don't need (year, text...) can be left as "".

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
          text: "",
          images: ["derako-boardroom.jpg"]
        },
        {
          brand: "heartfelt",
          title: "Meeting room",
          location: "Project location",
          year: "",
          text: "",
          images: ["heartfelt-meeting-room.jpg"]
        },
        {
          brand: "luxalon",
          title: "Luxalon project",
          location: "Add a project",
          year: "",
          text: "",
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
        { brand: "derako",    title: "Derako project",    location: "", year: "", text: "", images: [] },
        { brand: "heartfelt", title: "HeartFelt project", location: "", year: "", text: "", images: [] },
        { brand: "luxalon",   title: "Luxalon project",   location: "", year: "", text: "", images: [] }
      ]
    },

    {
      id: "healthcare",
      name: "Healthcare",
      intro: "Calm, hygienic and restful environments.",
      points: [],
      hero: "",
      projects: []
    },

    {
      id: "sport",
      name: "Sport",
      intro: "Durable, impact-resistant acoustic solutions.",
      points: [],
      hero: "",
      projects: []
    },

    {
      id: "retail",
      name: "Retail",
      intro: "Ceilings that strengthen the brand experience.",
      points: [],
      hero: "",
      projects: []
    },

    {
      id: "transport",
      name: "Transport",
      intro: "Large spans, high traffic, clear wayfinding.",
      points: [],
      hero: "",
      projects: []
    },

    {
      id: "leisure",
      name: "Leisure",
      intro: "Hospitality and culture with character.",
      points: [],
      hero: "",
      projects: []
    },

    {
      id: "exterior",
      name: "Exterior",
      intro: "Façades and soffits built to last.",
      points: [],
      hero: "",
      projects: []
    }
  ]
};
