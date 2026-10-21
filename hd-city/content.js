// All presentation content lives here. Edit text and image paths freely —
// no other file needs to change. Images go in assets/img/.
//
// brand: "derako" | "heartfelt" | "luxalon"  (sets the colour of the card)
// image: path to a photo, or null to show a placeholder.

window.HD_CONTENT = {
  title: "Hunter Douglas Architectural",
  subtitle: "Click a building to explore our work by sector",

  brands: {
    derako:    { name: "Derako",    tagline: "Natural wood ceilings & walls" },
    heartfelt: { name: "HeartFelt", tagline: "Acoustic felt ceilings & walls" },
    luxalon:   { name: "Luxalon",   tagline: "Metal ceilings & façades" }
  },

  sectors: [
    {
      id: "commercial",
      name: "Commercial",
      intro: "Offices that look good, sound calm and stay comfortable all day.",
      points: ["Aesthetic appeal", "Acoustic performance", "Thermal & energy efficiency", "Fire safety & compliance"],
      hero: "assets/img/commercial-hero.jpg",
      projects: [
        { brand: "derako",    title: "Office boardroom",       place: "Project location",  image: "assets/img/commercial-derako.jpg" },
        { brand: "heartfelt", title: "Meeting room",           place: "Project location",  image: "assets/img/commercial-heartfelt.jpg" },
        { brand: "luxalon",   title: "Luxalon project",        place: "Add a project",     image: null }
      ]
    },
    {
      id: "education",
      name: "Education",
      intro: "Spaces that help students focus and teachers be heard.",
      points: ["Noise control", "Visual comfort", "Thermal comfort", "Better lighting"],
      hero: null,
      projects: [
        { brand: "derako",    title: "Derako project",    place: "Add a project", image: null },
        { brand: "heartfelt", title: "HeartFelt project", place: "Add a project", image: null },
        { brand: "luxalon",   title: "Luxalon project",   place: "Add a project", image: null }
      ]
    },
    { id: "healthcare", name: "Healthcare", intro: "Calm, hygienic and restful environments.", points: [], hero: null, projects: [] },
    { id: "sport",      name: "Sport",      intro: "Durable, impact-resistant acoustic solutions.", points: [], hero: null, projects: [] },
    { id: "retail",     name: "Retail",     intro: "Ceilings that strengthen the brand experience.", points: [], hero: null, projects: [] },
    { id: "transport",  name: "Transport",  intro: "Large spans, high traffic, clear wayfinding.", points: [], hero: null, projects: [] },
    { id: "leisure",    name: "Leisure",    intro: "Hospitality and culture with character.", points: [], hero: null, projects: [] },
    { id: "exterior",   name: "Exterior",   intro: "Façades and soffits built to last.", points: [], hero: null, projects: [] }
  ]
};
