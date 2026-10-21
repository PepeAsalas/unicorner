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

  /* Text research checked 21 October 2026. Sources are editorial notes, not slides.
     Sector copy describes design considerations; it is not a blanket performance claim.
     General text pass preserved slide layouts. Project metadata was subsequently
     updated from user-supplied asset records; OM Building moved to Commercial.

     Official references:
     https://www.hunterdouglasarchitectural.eu/en-eu/ceilings/interior-felt-ceilings/panels/heartfelt-linear/
     https://www.hunterdouglasarchitectural.eu/en-eu/ceilings/interior-felt-ceilings/baffles/heartfelt-baffles/
     https://www.hunterdouglasarchitectural.eu/en-eu/ceilings/interior-felt-ceilings/origami/heartfelt-origami-pyramid/
     https://www.hunterdouglasarchitectural.eu/en-eu/ceilings/interior-felt-ceilings/combiline/combiline/
     https://www.hunterdouglasarchitectural.eu/uk-en/ceilings-uk-en/interior-metal-ceilings-uk-en/metal-baffles-uk-en/luxalon-v100-v200-screens/
     https://www.hunterdouglasarchitectural.eu/de-at/decken-de-2/metalldecken-ausen-de/linear-offen-aussen-de/luxalon-70u-ext/
     https://assets.hunterdouglasarchitectural.eu/documents/ceiling/Brochures/_default/Brochure-Cell-50e-Ceiling.pdf
     https://www.hunterdouglasarchitectural.eu/en-eu/sustainability/
     https://c2ccertified.org/certified-products/derako-grill-systems
     https://c2ccertified.org/certified-products/c2c-001256
     https://c2ccertified.org/the-standard/material-health-certificate

     Further text research checked 21 October 2026:
     ProLine data is explicitly identified; generic project labels do not establish
     an installed ProLine/BaseLine configuration. Images are still awaiting review.
     Product index length and existing layouts are preserved; further system data
     is included as text slides within the material sections.
     Sources:
     https://www.hunterdouglasarchitectural.eu/en-eu/ceilings/interior-wood-ceilings/grill-wood/derako-solid-grill-proline/
     https://www.hunterdouglasarchitectural.eu/en-eu/ceilings/interior-wood-ceilings/linear-wood/derako-solid-linear-proline/
     https://www.hunterdouglasarchitectural.eu/uk-en/ceilings-uk-en/interior-wood-ceilings-uk-en/linear-wood-uk-en/derako-solid-linear-baseline/
     https://www.hunterdouglasdam.eu/m/1890e7a030a61582/original/Technical-brochure-Metal-Linear-Ceilings-en-EU.pdf
     https://www.hunterdouglasarchitectural.eu/en-eu/ceilings/interior-metal-ceilings/linear-open/luxalon-70u/
     https://www.hunterdouglasarchitectural.eu/en-eu/ceilings/exterior-metal-ceilings/linear-open-exterior/luxalon-70u-ext/
     https://www.hunterdouglasarchitectural.eu/uk-en/ceilings-uk-en/interior-metal-ceilings-uk-en/luxalon-300l/
     https://www.hunterdouglasarchitectural.eu/uk-en/ceilings-uk-en/exterior-metal-ceilings-uk-en/wide-panel-exterior-uk-en/luxalon-300l-ext/
     https://www.hunterdouglasarchitectural.eu/en-eu/ceilings/interior-metal-ceilings/linear-open/luxalon-30bd-30bxd/
     https://www.hunterdouglasarchitectural.eu/en-eu/ceilings/interior-metal-ceilings/linear-open/luxalon-multipanel-2/
     https://www.hunterdouglasarchitectural.eu/en-eu/ceilings/interior-metal-ceilings/stretch-metal/luxalon-planks-stretch/
     https://www.hunterdouglasarchitectural.eu/uk-en/ceilings-uk-en/interior-metal-ceilings-uk-en/metal-baffles-uk-en/luxalon-tavola-closed/
     https://www.hunterdouglasarchitectural.eu/en-eu/ceilings/interior-metal-ceilings/metal-baffles/luxalon-tavola-straight/
     https://www.hunterdouglasarchitectural.eu/uk-en/ceilings-uk-en/interior-wood-ceilings-uk-en/tiles-panels-uk-en/derako-veneered-tiles-prestige/
     https://www.hunterdouglasdam.eu/m/3e67580a3b252f96/original/Contribution-BREEAM-International.pdf
     https://www.hunterdouglasarchitectural.eu/en-eu/about-us/
     https://www.hunterdouglasarchitectural.eu/en-eu/project/ing-headquarters/

     Source discrepancies / remaining unknowns:
     70U current page reports NRC 0.78; technical brochure reports NRC 0.80 for
     plain M100 with 25 mm mineral wool (55 kg/m3), 200 mm plenum, report MA 82.
     The slide uses the identifiable brochure configuration, without assigning an
     alpha-w or absorption class. Grill product page reports VOC A+ while a linked
     generic leaflet reports A; the ProLine page value is retained for ProLine.
     Current worldwide totals could not be reconciled across official regional
     sites: supplied CPD figures remain explicitly labelled as supplied deck data.
     Derako registry still states expiry on 22 October 2026; no renewal verified.
     Unpublished numeric performance stays empty (V100 absorption; Cell50E
     absorption/VOC; exterior 300L VOC). Cell C50 data is not applied to Cell50E.
     Named team contacts, final presentation title and photo-specific identities
     remain user choices. No missing optional project metadata needs filling.
     Existing certificate and drawing images still need the planned image review.
  */

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
        { layout: "photo-info", image: "organic-ceiling.jpg", caption: "Qatar Rail — organic ceiling" },
        { layout: "photo-info", image: "star-frame.jpg", caption: "Qatar Rail — star frame" }
      ]
    },

    {
      id: "about",
      title: "About Hunter Douglas",
      slides: [
        { layout: "section", title: "About Hunter Douglas", subtitle: "A world of innovation" },
        { layout: "figures", title: "A world of innovation", subtitle: "Worldwide figures from the supplied CPD deck", figures: [{"value": "132", "label": "Companies"}, {"value": "47", "label": "Manufacturing operations"}, {"value": "86", "label": "Assembly operations"}, {"value": "100", "label": "Countries"}, {"value": "23,500", "label": "Employees worldwide"}], image: "world-of-innovation.jpg" },
        { layout: "text-photo", title: "Search for products on NBS", subtitle: "NBS Source", text: "Need an NBS specification? We are an accredited manufacturer on NBS Source, where you can download a specification, or you can get in touch with us directly.", bullets: [], image: "nbs-source.jpg" },
        { layout: "text-photo", title: "Samples available on request", subtitle: "", text: "Should you need any samples, we have a wide range of samples and colours readily available.", bullets: ["A5 wood finishes", "Linear individual panels", "Topline samples", "Grill elements dowel", "Different perforations", "Brochures"], image: "samples.jpg" },
        { layout: "text", title: "Our team", subtitle: "", text: "Our architectural team supports the selection of ceiling and wall solutions, from standard systems to project-specific designs.", bullets: ["Product and material selection","Technical coordination, samples and specifications","info@hunterdouglasarchitectural.eu","+31 (0)10 486 9911"] },
        { layout: "thanks", title: "Designed to work for you" }
      ]
    }
  ],

  /* Additional project import, 21 October 2026:
     CPD additional 1.0: project slides 2–7 (felt).
     CPD additional 1.1: project slides 2–9 (wood).
     CPD additional 1.2: project slides 2–8 (metal/mixed) plus the captioned
     Goede Doelen Loterij photo on the closing slide. Contact details not imported.
     Material divider photos are not separately identified projects.
     Extracted the main embedded photograph, excluding logos and placeholder text.
     17 new projects, 5 existing entries extended, 22 photographs.
     Supplied generic/exact system names are recorded in details. Product fields
     link only to an existing compatible material page; empty product fields keep
     exact systems in details until dedicated specification pages are available.
     Pending source check: the source calls one project The Mund Office, Rotterdam,
     while its photo includes a Mind Office sign. Name/location/architect retained
     from supplied deck, not independently verified. Source slide is 1.0, slide 7.
     Existing photo-specific review notes are retained rather than guessed away.
     Official source for the closing-slide custom metal ceiling and full architect:
     https://www.hunterdouglasarchitectural.eu/en-se/project/goede-doelen-loterij/
  */

  /* Sector review batch, 21 October 2026:
     Retail cover: image(6).png. Healthcare cover: image(9).png.
     Exterior cover: image(20261021-143406).png.
     Added Hospital Isabel Zendal (image7), unnamed Utrecht healthcare project
     (image8, LMS 79543), and unnamed Heverlee exterior project (image10).
     Confirmed ING Warsaw / Medusa Group / Planks Stretch and moved it to
     Commercial, preserving its image in the existing Exterior folder.
     Confirmed Mercedes-Benz, The Hague / Luxalon 300L exterior.
     Missing Utrecht and Heverlee project names remain empty, not invented.
  */

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
        { title: "Thermal & energy efficiency", text: "Coordinate the ceiling with lighting, ventilation and any dedicated heating or cooling system. Product documentation can support assessment against LEED and BREEAM requirements." },
        { title: "Fire safety & compliance", text: "Select the ceiling system to meet the project fire requirements, using the classification and installation details for the specified configuration." }
      ],
      projects: [
        {
          brand: "derako",
          product: "Derako Wood Grill",
          title: "Tour Midi Pension",
          location: "Brussels, Belgium",
          year: "",
          text: "Solid wood grill ceilings and walls in pine with a white colour varnish.",
          details: {"Wood species":"Pine","Finish":"White colour varnish","Configuration":"5-50-20-80"},
          images: ["derako-boardroom.jpg"]
        },
        {
          brand: "heartfelt",
          product: "HeartFelt Linear",
          title: "AFAS Head Office",
          location: "Leusden, Netherlands",
          year: "",
          text: "PareauLux HeartFelt ceiling system with 40HL55 linear felt panels in grey.",
          details: {"Architect":"Just Architects","Panel type":"40HL55","System":"PareauLux HeartFelt","Colour":"Grey","Photographer":"Merijn Koelink Photography"},
          images: ["heartfelt-meeting-room.jpg"]
        },
        {
          brand: "heartfelt",
          product: "HeartFelt Origami Pyramid",
          title: "Equity Release Supermarket HQ",
          location: "Warrington, Cheshire, United Kingdom",
          year: "2023",
          text: "HeartFelt Origami felt ceiling installed at the new headquarters of Equity Release Supermarket.",
          details: {"Architect":"Studio SDA","Area":"100 m²","Completed":"2023","Colour":"Grey","Photographer":"Gary Britton"},
          images: ["heartfelt-pyramid.jpg"]
        },
        {
          brand: "",
          product: "Veneered Wood Linear",
          title: "IMBISA",
          location: "Madrid, Spain",
          year: "",
          text: "Veneered wood linear ceiling system.",
          details: {"Architect":"Ignacio Lizarraga","Material":"Veneered wood","Colour":"Wood","Photographer":"Alberto Amores Montiel"},
          images: ["derako-wood-linear.jpg"]
        },
        {
          brand: "heartfelt",
          product: "HeartFelt Baffle",
          title: "Agristo",
          location: "Wielsbeke, Belgium",
          year: "2022",
          text: "HeartFelt Baffle ceiling system in grey.",
          details: {"Completed":"2022","Colour":"Grey"},
          images: ["heartfelt-baffle.jpg"]
        },
        {
          brand: "derako",
          product: "Derako Wood Grill",
          title: "P&V Assurance Botanic",
          location: "Brussels, Belgium",
          year: "",
          text: "Solid wood ceiling and wall systems. The supplied project metadata lists both grill and linear systems.",
          details: {"Material":"Solid wood","Photographer":"Astrid Mora"},
          images: ["derako-wood-grill-1.jpg"]
        },
        {
          brand: "",
          product: "Prometal PCM Planks",
          title: "Flora Holland",
          location: "Netherlands",
          year: "",
          text: "Perforated Prometal PCM metal ceiling planks in RAL 9010.",
          details: {"Architect":"OC Autarkis Waterloo","Area":"500–1000 m²","Finish":"RAL 9010, perforated","Photographer":"Thea van den Heuvel"},
          images: ["derako-wood-grill-3.jpg"]
        },
        {
          brand: "",
          product: "Tavola Closed Baffles",
          title: "Offices Aesseal",
          location: "Rotherham, United Kingdom",
          year: "2023",
          text: "Tavola Closed metal baffle ceiling at Offices Aesseal in Rotherham. The supplied asset lists black and white colour options.",
          details: {"Architect":"Race Cottam Associates Ltd","Completed":"2023","Colour options":"Black; white"},
          images: ["derako-wood-grill-4.jpg"]
        },
        {
          brand: "luxalon",
          product: "Luxalon 30BD",
          title: "OM Building",
          location: "Madrid, Spain",
          year: "2022",
          text: "30BD metal linear ceiling with an elm finish in the lobby of OM Building.",
          details: {"Architect":"Torre Rioja","Area":"0–500 m²","Completed":"2022","Finish":"Elm wood effect","Photographer":"David Spence"},
          images: ["../healthcare/healthcare-project.jpg"]
        },
        {
          brand: "derako",
          product: "",
          title: "SABIC Headquarters",
          location: "Jubail, Saudi Arabia",
          year: "",
          text: "Derako Veneered Panels Wall and Veneered Tiles Prestige are documented at SABIC Headquarters. Match the individual photo before selecting the product.",
          details: {"Architect":"Henning Larsen Architects","Documented products":"Derako Veneered Panels Wall; Derako Veneered Tiles Prestige","Photo match":"Pending"},
          images: ["../education/sabic-jubail.jpg"]
        },
        {
          brand: "luxalon",
          product: "",
          title: "The Wings",
          location: "Diegem, Belgium (Brussels area)",
          year: "",
          text: "The Wings is an office complex. The documented Hunter Douglas installation is an interior ceiling using Luxalon 30BD metal slats with a Metal Woodprint finish. The two existing photos need matching; no separate exterior installation has been verified.",
          details: {"Documented product":"Luxalon 30BD","Finish":"Luxalon Metal Woodprint","Documented application":"Interior ceiling","Photo match":"New supplied image shows the interior ceiling. Earlier exterior-labelled photo remains to be reviewed.","Architect":"assar llox architects","Installed systems":"Luxalon 30BD / 30BXD with Luxalon Metal Woodprint"},
          images: ["../retail/the-wings-belgium.jpg","../exterior/the-wings-belgium.jpg","the-wings-additional.jpg"]
        },
        {
          brand: "heartfelt",
          product: "HeartFelt Baffle",
          title: "Innovatrics Biometrics House",
          location: "Bratislava, Slovakia",
          year: "",
          text: "HeartFelt Baffles at Innovatrics Biometrics House.",
          details: {"Architect":"A.M Architects s.r.o."},
          images: ["innovatrics-biometrics-house.jpg"]
        },
        {
          brand: "heartfelt",
          product: "HeartFelt Linear",
          title: "Matrix ONE",
          location: "Amsterdam, Netherlands",
          year: "",
          text: "HeartFelt Linear wall system at Matrix ONE.",
          details: {"Architect":"MVRDV","Installed system":"HeartFelt Linear Wall","Application":"Wall lining"},
          images: ["matrix-one.jpg"]
        },
        {
          brand: "heartfelt",
          product: "HeartFelt Linear",
          title: "HUK",
          location: "Coburg, Germany",
          year: "",
          text: "HeartFelt Linear wall system at HUK in Coburg.",
          details: {"Architect":"Becher & Partner","Installed system":"HeartFelt Linear Wall","Application":"Wall lining"},
          images: ["huk-coburg.jpg"]
        },
        {
          brand: "heartfelt",
          product: "HeartFelt Origami Pyramid",
          title: "The Mund Office",
          location: "Rotterdam, Netherlands",
          year: "",
          text: "HeartFelt Origami ceiling in an office setting.",
          details: {"Architect":"Hunter Douglas Architectural","Installed system":"HeartFelt Origami"},
          images: ["the-mund-office.jpg"]
        },
        {
          brand: "derako",
          product: "Derako Wood Grill",
          title: "Die Continentale",
          location: "Dortmund, Germany",
          year: "",
          text: "Derako Solid Grill ProLine ceiling at Die Continentale.",
          details: {"Architect":"kadawittfeldarchitektur","Installed system":"Derako Solid Grill ProLine"},
          images: ["die-continentale.jpg"]
        },
        {
          brand: "derako",
          product: "Derako Wood Grill",
          title: "AG Insurance",
          location: "Brussels, Belgium",
          year: "",
          text: "Derako Solid Grill ProLine ceiling at AG Insurance.",
          details: {"Architect":"EVR Architecten","Installed system":"Derako Solid Grill ProLine"},
          images: ["ag-insurance.jpg"]
        },
        {
          brand: "derako",
          product: "Derako Wood Grill",
          title: "265 The Strand",
          location: "London, United Kingdom",
          year: "",
          text: "Derako solid wood grill ceiling and wall systems at 265 The Strand.",
          details: {"Architect":"Bluebottle Architecture & Design","Installed systems":"Derako Solid Grill ProLine / Derako Solid Grill Wall","Application":"Ceiling and wall lining"},
          images: ["265-the-strand.jpg"]
        },
        {
          brand: "derako",
          product: "",
          title: "Torre Libeskind",
          location: "Milan, Italy",
          year: "",
          text: "Derako veneered wood wall panels at Torre Libeskind.",
          details: {"Architect":"Studio Libeskind","Installed system":"Derako Veneered Panels Wall","Application":"Wall lining"},
          images: ["torre-libeskind.jpg"]
        },
        {
          brand: "luxalon",
          product: "",
          title: "Calle Badajoz",
          location: "Barcelona, Spain",
          year: "",
          text: "Luxalon 30BD / 30BXD linear ceiling system at Calle Badajoz.",
          details: {"Architect":"Batlleiroig Arquitectura","Installed system":"Luxalon 30BD / 30BXD"},
          images: ["calle-badajoz.jpg"]
        },
        {
          brand: "luxalon",
          product: "",
          title: "Zwirn Office",
          location: "Bratislava, Slovakia",
          year: "",
          text: "Luxalon Planks Stretch expanded metal ceiling at Zwirn Office.",
          details: {"Architect":"COMPASS s.r.o.","Installed system":"Luxalon Planks Stretch"},
          images: ["zwirn-office.jpg"]
        },
        {
          brand: "",
          product: "",
          title: "Goede Doelen Loterij",
          location: "Amsterdam, Netherlands",
          year: "",
          text: "A bespoke metal ceiling with folded leaf forms creates a canopy effect over the atrium.",
          details: {"Architect":"Benthem Crouwel Architects","Installed system":"Custom metal ceiling","Application":"Atrium ceiling"},
          images: ["goede-doelen-loterij.jpg"]
        },
        {
          brand: "luxalon",
          product: "",
          title: "ING Headquarters",
          location: "Warsaw, Poland",
          year: "",
          text: "Luxalon stretch metal plank ceiling at ING Headquarters in Warsaw.",
          details: {"Architect":"Medusa Group","Installed system":"Luxalon Planks Stretch","Application":"Interior ceiling"},
          images: ["../exterior/ing-bank-amsterdam.jpg"]
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
        { title: "Thermal comfort", text: "Coordinate ceiling design with insulation, ventilation and any dedicated heating or cooling system to support classroom comfort." },
        { title: "Better lighting", text: "Coordinate panel finishes and layouts with daylight and artificial lighting, including the support and integration of luminaires." }
      ],
      projects: [
        {
          brand: "derako",
          product: "Derako Wood Grill",
          title: "Life Science Incubator, University of Utrecht",
          location: "Utrecht, Netherlands",
          year: "",
          text: "Derako solid wood grill ceiling in African Ayous at the Life Science Incubator, University of Utrecht.",
          details: {"Architect":"GiesbersWijchen & Mecanoo","Wood species":"African Ayous"},
          images: ["derako-wood-grill.jpg"]
        },
        {
          brand: "heartfelt",
          product: "HeartFelt Linear",
          title: "Pettypool Girlguiding Activity Centre",
          location: "Cheshire, United Kingdom",
          year: "",
          text: "HeartFelt Linear ceiling with 40HL55 panels. The supplied project metadata lists grey and white colour options.",
          details: {"Architect":"Walker Simpson Architects","Panel type":"40HL55","Colour options":"Grey; white","Photographer":"Daniel Hopkinson"},
          images: ["heartfelt-linear.jpg"]
        },
        {
          brand: "luxalon",
          product: "Luxalon Planks Stretch",
          title: "Energy Academy Europe",
          location: "Groningen, Netherlands",
          year: "",
          text: "Luxalon Planks Stretch ceiling system at Energy Academy Europe. This is a separate building from the University of Groningen library.",
          details: {"Architect":"Broekbakema with De Unie Architecten"},
          images: ["energy-academy.jpg"]
        },
        {
          brand: "luxalon",
          product: "",
          title: "University of Groningen Library Renovation",
          location: "Groningen, Netherlands",
          year: "",
          text: "The library renovation includes Luxalon 30BD / 30BXD and MultiPanel ceiling systems. The product shown in this photo remains to be confirmed.",
          details: {"Architect":"AG Architecten","Documented products":"Luxalon 30BD / 30BXD; Luxalon MultiPanel","Photo match":"New supplied photo labelled 30BD / 30BXD. MultiPanel remains documented elsewhere in the project.","Installed system":"Luxalon 30BD / 30BXD in the additional photo"},
          images: ["groningen-university.jpg","groningen-library-additional.jpg"]
        },
        {
          brand: "",
          product: "Veneered Wood Grill",
          title: "Le Paquebot",
          location: "Quartier de l’Étang, Vernier, Geneva canton, Switzerland",
          year: "",
          text: "Le Paquebot is a public building containing a school, childcare facilities and a gym. The documented ceiling is a veneered wood grill with backer-and-dowel construction.",
          details: {"Construction":"Veneered wood grill; backer-and-dowel","Product designation":"Current Derako SKU unverified","Photo match":"Education or gym application pending"},
          images: ["vernier-paquebot-geneva.jpg"]
        },
        {
          brand: "",
          product: "",
          title: "Deloitte University EMEA",
          location: "Bailly-Romainvilliers, France",
          year: "",
          text: "The project includes Derako Solid Linear ProLine wood ceilings and walls in larch and European pine, as well as Luxalon Tavola Straight aluminium baffles. Confirm which system appears in this photo.",
          details: {"Architect":"Dubuisson Architecture","Documented products":"Derako Solid Linear ProLine; Luxalon Tavola Straight","Wood species":"Larch; European pine","Photo match":"Additional supplied photo shows the atrium with the documented wood and metal ceiling systems.","Installed systems":"Derako Solid Linear ProLine / Luxalon Tavola Straight"},
          images: ["deloitte-university.jpg","deloitte-university-additional.jpg"]
        },
        {
          brand: "",
          product: "",
          title: "Smart Campus Heerlen",
          location: "Heerlen, Netherlands",
          year: "",
          text: "Lawapan veneered ceiling panels and wall panels are documented at Smart Campus Heerlen. Confirm the application shown in the photo.",
          details: {"Documented products":"Lawapan veneered ceiling and wall panels","Photo match":"Ceiling or wall application pending"},
          images: ["smart-campus-heerlen.jpg"]
        }
      ]
    },

    {
      id: "healthcare",
      name: "Healthcare",
      intro: "Healthcare spaces need to balance comfort with practical demands. Ceilings and walls can help create a welcoming environment while addressing acoustics, cleaning, maintenance and the requirements of each room.",
      hero: "healthcare-cover.jpg",
      points: [
        { title: "Hygiene & cleanability", text: "Choose finishes and cleaning methods to suit the hygiene requirements of each space, from public reception areas to clinical rooms." },
        { title: "Acoustic privacy", text: "Sound-absorbing finishes help control reverberation. Speech privacy also depends on partitions, doors and the complete room design." },
        { title: "Patient wellbeing", text: "Coordinate material, colour and acoustic choices to create welcoming spaces for patients, visitors and staff." },
        { title: "Fire safety & compliance", text: "Select the ceiling system against the fire requirements of the space and the documented classification of the complete specification." }
      ],
      projects: [
        {
          brand: "derako",
          product: "Derako Wood Grill",
          title: "Meander Medical Centre",
          location: "Amersfoort, Netherlands",
          year: "",
          text: "Derako Solid Grill ProLine ceiling system at Meander Medical Centre.",
          details: {"Architect":"Atelier PRO","Exact system":"Derako Solid Grill ProLine"},
          images: ["meander-hospital.jpg"]
        },
        {
          brand: "luxalon",
          product: "",
          title: "Dodoens Hospital",
          location: "Mechelen, Belgium",
          year: "",
          text: "Luxalon metal chilled linear ceilings in 150C and 225C are documented at Dodoens Hospital. A product-guide caption identifies a 225C installation; the specific photo remains to be matched.",
          details: {"Architect":"Luyten & Lens","Documented products":"Luxalon chilled linear 150C; 225C","Photo match":"150C or 225C pending"},
          images: ["dodoens-hospital.jpg"]
        },
        {
          brand: "",
          product: "Solid Wood Linear Ceiling",
          title: "Royal National Orthopaedic Hospital",
          location: "Stanmore, London, United Kingdom",
          year: "",
          text: "Hunter Douglas solid wood linear ceiling in Siberian larch, installed in the new hospital atrium. A current ProLine or BaseLine designation has not been verified.",
          details: {"Architect":"BDP","Wood species":"Siberian larch"},
          images: ["rnoh-stanmore-1.jpg","rnoh-stanmore-2.jpg"]
        },
        {
          brand: "derako",
          product: "Derako Wood Linear",
          title: "Queen Mary’s Hospital",
          location: "Sidcup, United Kingdom",
          year: "",
          text: "Derako solid wood linear ceiling systems at Queen Mary’s Hospital.",
          details: {"Architect":"Murphy Philipps Architects","Installed systems":"Derako Solid Linear ProLine / Derako Solid Linear Ext"},
          images: ["queen-marys-hospital.jpg"]
        },
        {
          brand: "heartfelt",
          product: "HeartFelt Linear",
          title: "Hospital Isabel Zendal",
          location: "Madrid, Spain",
          year: "2024",
          text: "HeartFelt Linear ceiling with grey 40HL80 panels at Hospital Isabel Zendal.",
          details: {"Architect":"Virai Arquitectos","Area":"1000–2000 m²","Completed":"2024","Panel type":"40HL80","Colour":"Grey","Photographer":"OCTAVUSS"},
          images: ["hospital-isabel-zendal.jpg"]
        },
        {
          brand: "heartfelt",
          product: "HeartFelt Linear",
          title: "",
          location: "Utrecht, Netherlands",
          year: "2023",
          text: "HeartFelt Linear ceiling incorporating 40HL55, 40HL80 and 40HL105 panels in brown.",
          details: {"Architect":"OTH architecten","Area":"0–500 m²","Completed":"2023","Panel types":"40HL55 / 40HL80 / 40HL105","Colour":"Brown","Photographer":"Maarten Zwaneveld","LMS reference":"79543"},
          images: ["utrecht-heartfelt-linear.jpg"]
        }
      ]
    },

    {
      id: "sport",
      name: "Sport",
      intro: "Sports facilities bring together active use, large spaces and demanding acoustic conditions. Select ceiling systems for the activity, with documented impact performance and finishes suited to the environment.",
      hero: "sports-hall-amersfoort-01.jpg",
      points: [
        { title: "Impact resistance", text: "Use a system with documented ball impact performance for sports halls, including the specified panels, carriers and fixings." },
        { title: "Reverberation control", text: "Sound absorption helps limit reverberation in large halls, supporting clearer instructions and communication during activities." },
        { title: "Durability", text: "Match materials and finishes to the activity, maintenance regime and humidity conditions, particularly in swimming pool environments." },
        { title: "Fire safety & compliance", text: "Check the selected system against the fire strategy, including any requirements for services and structural protection." }
      ],
      projects: [
        {
          brand: "luxalon",
          product: "Luxalon 70U",
          title: "O.L.V. van Lourdescollege",
          location: "Edegem, Belgium",
          year: "",
          text: "Luxalon 70U linear gym ceiling installed on a curved carrier.",
          details: {"Carrier":"Curved carrier"},
          images: ["olv-van-lourdescollege.jpg"]
        },
        {
          brand: "derako",
          product: "Derako Wood Grill",
          title: "Swimming Pool De Steur",
          location: "Kampen, Netherlands",
          year: "",
          text: "Derako Solid Grill ProLine ceiling at Swimming Pool De Steur.",
          details: {"Architect":"VenhoevenCS Architecture + Urbanisme","Installed system":"Derako Solid Grill ProLine"},
          images: ["swimming-pool-de-steur.jpg"]
        },
        // Source: https://www.hunterdouglasarchitectural.eu/en-eu/project/acoustic-ceiling-swimming-pool-heartfelt-schwabmunchen/
        {
          brand: "heartfelt",
          product: "HeartFelt Linear",
          title: "Swimming Pool Leonhard-Wagner-Welle",
          location: "Schwabmünchen, Germany",
          year: "",
          text: "A curved HeartFelt Linear ceiling in a cream tone above the swimming pool, with 55 mm panels at a 70 mm module.",
          details: {"Architect": "Studio gollwitzer architekten gmbH", "Panel height": "55 mm", "Module": "70 mm", "Colour": "7575 cream"},
          images: ["leonhard-wagner-welle-01.jpg", "leonhard-wagner-welle-02.jpg"]
        },
        // Source: https://www.hunterdouglasarchitectural.eu/en-ae/project/sports-hall-amersfoort/
        {
          brand: "derako",
          product: "",
          title: "Sports Hall Amersfoort",
          location: "Amersfoort, Netherlands",
          year: "",
          text: "Veneered wood linear ceiling and wall systems at Sports Hall Amersfoort.",
          details: {"Installed systems": "Derako Veneered Linear / Derako Veneered Linear Wall"},
          images: ["sports-hall-amersfoort-01.jpg", "sports-hall-amersfoort-02.jpg"]
        },
        // Source: https://www.hunterdouglasarchitectural.eu/en-eu/project/sports-hall-malacky/
        {
          brand: "derako",
          product: "Derako Wood Grill",
          title: "Šport Aréna Malacky",
          location: "Malacky, Slovakia",
          year: "",
          text: "A solid wood grill ceiling in the foyer and dining area of the sports complex, using European pine coloured to oak.",
          details: {"Architect": "Ing.arch. Pavol Citovický", "Installed system": "Derako Solid Grill ProLine", "Application": "Foyer and dining area", "Wood species": "European pine", "Finish": "Coloured to oak"},
          images: ["sport-arena-malacky-01.jpg", "sport-arena-malacky-02.jpg"]
        }
      ]
    },

    {
      id: "retail",
      name: "Retail",
      intro: "From individual shops to showrooms and shopping centres, ceilings and walls help shape the visitor experience. Material, colour and rhythm can reinforce a brand while accommodating acoustics, lighting and services.",
      hero: "retail-cover.jpg",
      points: [
        { title: "Brand expression", text: "Use materials, colours and panel rhythms to reinforce the identity of a shop, showroom or shopping centre." },
        { title: "Acoustic comfort", text: "Sound-absorbing surfaces help manage reverberation from conversations, music and busy circulation areas." },
        { title: "Flexible layouts", text: "Coordinate ceiling modules with lighting, signage and services, and plan access for maintenance and future changes." },
        { title: "Fire safety & compliance", text: "Select documented fire performance appropriate to the retail space, its occupancy and the project fire strategy." }
      ],
      projects: [
        {
          brand: "luxalon",
          product: "Tavola Metal Baffles",
          title: "Reduta Shopping Centre",
          location: "Warsaw, Poland",
          year: "",
          text: "Luxalon Tavola metal baffles with a woodprint finish. The exact Tavola variant remains unverified.",
          details: {"Finish":"Woodprint"},
          images: ["reduta-shopping-centre.jpg"]
        },
        {
          brand: "luxalon",
          product: "Luxalon V100",
          title: "Decathlon Evere",
          location: "Evere, Belgium",
          year: "",
          text: "Luxalon V100 vertical lamellas on the facade of the new Decathlon Evere store.",
          details: {"Application":"Exterior facade"},
          images: ["decathlon.jpg"]
        },
        {
          brand: "heartfelt",
          product: "HeartFelt Baffle",
          title: "McLaren Stockholm Showroom",
          location: "Järfälla, Sweden",
          year: "",
          text: "HeartFelt Baffles at the McLaren Stockholm showroom.",
          details: {},
          images: ["mclaren.jpg"]
        },
        {
          brand: "",
          product: "",
          title: "Illa Diagonal",
          location: "Barcelona, Spain",
          year: "",
          text: "A multilayer CombiLine ceiling with Derako Solid Grill ProLine and solid ayous wood slats. Other CombiLine-compatible materials have not been confirmed for this installation.",
          details: {"Documented systems":"CombiLine; Derako Solid Grill ProLine","Wood species":"Ayous","Photo match":"Confirm individual photo before assigning a product page"},
          images: ["illa-diagonal-1.jpg","illa-diagonal-2.jpg"]
        },
        {
          brand: "heartfelt",
          product: "HeartFelt Linear",
          title: "La Vaguada Shopping Centre",
          location: "Madrid, Spain",
          year: "",
          text: "HeartFelt Linear in dark brown, including a ceiling-to-wall corner solution.",
          details: {"Architect":"L35 Arquitectos","Colour":"Dark brown","Detail":"Special 90° corners and a ceiling-to-wall solution"},
          images: ["la-vaguada.jpg","la-vaguada-additional.jpg"]
        },
        {
          brand: "derako",
          product: "Derako Wood Linear",
          title: "Les 3 Fontaines",
          location: "Cergy-Pontoise, France",
          year: "",
          text: "Derako solid wood linear ceilings at Les 3 Fontaines shopping centre, with interior ProLine and exterior systems documented for the project.",
          details: {"Architect":"BDP + ORY.architecture","Installed systems":"Derako Solid Linear ProLine / Derako Solid Linear Ext","Application":"Interior and exterior ceilings"},
          images: ["les-3-fontaines.jpg"]
        }
      ]
    },

    {
      id: "transport",
      name: "Transport",
      intro: "Airports and stations need ceilings that work across large, busy spaces. Acoustic design, clear visual organisation, durability and access to services are central to a coordinated transport environment.",
      hero: "charles-de-gaulle-01.jpg",
      points: [
        { title: "Large-span solutions", text: "Coordinate panel lengths, support spacing and service integration to create a consistent ceiling across large public areas." },
        { title: "Speech intelligibility", text: "Control reverberation to support clearer announcements and conversations in busy terminals and circulation spaces." },
        { title: "Low maintenance", text: "Choose durable finishes and accessible systems that suit frequent use, cleaning and maintenance above the ceiling." },
        { title: "Fire safety & compliance", text: "Coordinate the ceiling specification with the fire strategy, escape routes and any smoke-control requirements." }
      ],
      projects: [
        {
          brand: "luxalon",
          product: "Luxalon 300L Ext",
          title: "Wrocław Airport",
          location: "Wrocław, Poland",
          year: "",
          text: "Luxalon 300L Ext exterior wide-panel ceiling at Wrocław Airport. The project also includes 300L interior ceilings; retain the exterior designation for this exterior image.",
          details: {"Application":"Exterior ceiling","Other documented product":"Luxalon 300L interior"},
          images: ["../exterior/wroclaw-airport.jpg"]
        },
        {
          brand: "derako",
          product: "Derako Wood Grill",
          title: "Bike Parking IJboulevard",
          location: "Amsterdam, Netherlands",
          year: "",
          text: "Derako Solid Grill ProLine ceiling and Solid Linear wall systems at Bike Parking IJboulevard.",
          details: {"Architect":"VenhoevenCS","Installed systems":"Derako Solid Grill ProLine / Derako Solid Linear Wall","Application":"Ceiling and wall lining"},
          images: ["bike-parking-ijboulevard.jpg"]
        },
        {
          brand: "luxalon",
          product: "",
          title: "Air France Lounge",
          location: "Paris, France",
          year: "",
          text: "Luxalon 30BD / 30BXD ceiling system at the Air France lounge.",
          details: {"Architect":"Noé Duchaufour-Lawrance","Installed system":"Luxalon 30BD / 30BXD"},
          images: ["air-france-lounge-paris.jpg"]
        },
        // Source: https://www.hunterdouglasarchitectural.eu/en-eu/project/paris-charles-de-gaulle-airport/
        {
          brand: "derako",
          product: "Derako Wood Grill",
          title: "Paris Charles de Gaulle Airport",
          location: "Paris, France",
          year: "",
          text: "Solid wood grill ceilings in the renovated Terminal 2E halls. The wider project also includes veneered walnut wall panels.",
          details: {"Architect": "ADP Group", "Installed ceiling system": "Derako Solid Grill ProLine", "Other documented system": "Derako Veneered Panels Wall"},
          images: ["charles-de-gaulle-01.jpg", "charles-de-gaulle-02.jpg"]
        },
        // Source: https://www.hunterdouglasarchitectural.eu/en-eu/project/chisinau-airport-moldova/
        {
          brand: "luxalon",
          product: "",
          title: "Chișinău Airport",
          location: "Moldova",
          year: "",
          text: "Luxalon MultiPanel ceilings with 80BXD and 130BXD panels in the refurbished airport terminal.",
          details: {"Architect": "Archform", "Installed system": "Luxalon MultiPanel", "Panel types": "80BXD / 130BXD"},
          images: ["chisinau-airport-01.jpg", "chisinau-airport-02.jpg"]
        },
        // Source: https://www.hunterdouglasarchitectural.eu/uk-en/project/terminal-eurostar-amsterdam/
        {
          brand: "heartfelt",
          product: "HeartFelt Linear",
          title: "UK Terminal Eurostar",
          location: "Amsterdam, Netherlands",
          year: "",
          text: "HeartFelt Linear acoustic ceiling panels integrated into a white aluminium cove at the Eurostar UK Terminal in Amsterdam Central Station.",
          details: {"Architect": "ZJA & SuperImpose", "Panel type": "40HR64", "Other documented system": "Safety Loop system"},
          images: ["eurostar-amsterdam-01.jpg", "eurostar-amsterdam-02.jpg"]
        }
      ]
    },

    {
      id: "leisure",
      name: "Leisure",
      intro: "Hotels, restaurants and cultural venues each need their own atmosphere. Ceilings and walls bring character to these spaces while helping balance acoustic comfort, service integration and everyday maintenance.",
      hero: "silt-casino-01.jpg",
      points: [
        { title: "Atmosphere & character", text: "Bring material, colour and texture together to create a distinctive setting for hotels, restaurants and cultural venues." },
        { title: "Acoustic comfort", text: "Balance sound absorption with the intended use, from relaxed dining and conversation to performance and event spaces." },
        { title: "Thermal comfort", text: "Coordinate the ceiling with the ventilation, heating and cooling strategy, using a dedicated climate system where specified." },
        { title: "Fire safety & compliance", text: "Match the documented performance of the selected system to the venue, occupancy and project fire requirements." }
      ],
      projects: [
        {
          brand: "luxalon",
          product: "",
          title: "Ahoy Rotterdam",
          location: "Rotterdam, Netherlands",
          year: "",
          text: "The exterior open-cell ceiling is documented as Luxalon Cell 50. The wider project also includes 300L, HeartFelt Linear and Cell C40/C50. The existing Cell50E label has not been verified against this photo.",
          details: {"Documented application":"Exterior open-cell ceiling","Documented product":"Luxalon Cell 50","Other documented systems":"Luxalon 300L; HeartFelt Linear; Cell C40/C50","Photo match":"New supplied photo labelled Cell C40 / C50 exterior. Original photo suffix remains unverified.","Architect":"Kraaijvanger Architects","Installed system":"Luxalon Cell C40 / C50 exterior"},
          images: ["../exterior/ahoy-rotterdam.jpg","ahoy-rotterdam-additional.jpg"]
        },
        {
          brand: "heartfelt",
          product: "HeartFelt Linear",
          title: "Restaurant Stokers",
          location: "Antwerp, Belgium",
          year: "",
          text: "HeartFelt Linear ceiling at Restaurant Stokers.",
          details: {"Architect":"Anversa"},
          images: ["restaurant-stokers.jpg"]
        },
        // Source: https://www.hunterdouglasarchitectural.eu/uk-en/project/silt-casino/
        {
          brand: "derako",
          product: "Derako Wood Grill",
          title: "Silt Casino",
          location: "Middelkerke, Belgium",
          year: "",
          text: "Solid wood grill ceilings in the event spaces and restaurants of Silt Casino, finished with a custom colour varnish.",
          details: {"Architect": "ZJA / Bureau Bouwtechniek and VK Engineering", "Installed system": "Derako Solid Grill ProLine", "Application": "Event spaces and restaurants", "Finish": "Custom colour varnish"},
          images: ["silt-casino-01.jpg", "silt-casino-02.jpg"]
        },
        // Source: https://www.hunterdouglasarchitectural.eu/en-eu/project/cultural-centre-de-nobelaer/
        {
          brand: "derako",
          product: "",
          title: "Cultural Centre De Nobelaer",
          location: "Etten-Leur, Netherlands",
          year: "",
          text: "Solid wood linear and grill ceilings at Cultural Centre De Nobelaer, combining transparent-finished Accoya with black-coloured ayous.",
          details: {"Architect": "TenBrasWestinga", "Installed systems": "Derako Solid Linear ProLine / Derako Solid Grill ProLine", "Wood species": "Accoya / Ayous", "Finishes": "Linear: transparent; grill: black coloured"},
          images: ["de-nobelaer-01.jpg", "de-nobelaer-02.jpg"]
        },
        // Source: https://www.hunterdouglasarchitectural.eu/en-RO/project/nhow-hotel-amsterdam/
        {
          brand: "heartfelt",
          product: "HeartFelt Linear",
          title: "nhow Hotel",
          location: "Amsterdam, Netherlands",
          year: "",
          text: "HeartFelt Linear ceiling in the hotel lobby, paired with colourful graphics and exposed concrete surfaces.",
          details: {"Architect": "NEXT Architects", "Application": "Hotel lobby"},
          images: ["nhow-amsterdam-01.jpg", "nhow-amsterdam-02.jpg"]
        }
      ]
    },

    {
      id: "exterior",
      name: "Exterior",
      intro: "Exterior ceilings, soffits and facades connect a building with its surroundings. Material, finish and fixing choices must respond to the design, weather exposure and local performance requirements.",
      hero: "exterior-cover.jpg",
      points: [
        { title: "Weather resistance", text: "Use an exterior-grade system and finish selected for the exposure, local climate and project wind loads." },
        { title: "Solar shading", text: "Coordinate external shading with facade orientation and daylight requirements to help manage solar heat gain." },
        { title: "Durability", text: "Specify materials, coatings and fixings for the environment, including coastal exposure and future maintenance access." },
        { title: "Fire safety & compliance", text: "Check the selected facade or soffit build-up against the applicable fire requirements and its documented classification." }
      ],
      projects: [
        {
          brand: "luxalon",
          product: "Luxalon 300L / 300L Ext",
          title: "Mercedes-Benz",
          location: "The Hague, Netherlands",
          year: "",
          text: "Luxalon 300L exterior wide-panel ceiling at Mercedes-Benz in The Hague.",
          details: {"Installed system":"Luxalon 300L exterior","Application":"Exterior ceiling"},
          images: ["mercedes-benz.jpg"]
        },
        {
          brand: "luxalon",
          product: "Luxalon 70U",
          title: "De Voortuinen",
          location: "Amsterdam, Netherlands",
          year: "",
          text: "Luxalon 70U exterior linear ceiling at De Voortuinen.",
          details: {"Application":"Exterior ceiling"},
          images: ["voortuinen-amsterdam.jpg"]
        },
        {
          brand: "luxalon",
          product: "Luxalon Beta Safety-Loop",
          title: "NCIA NATO",
          location: "The Hague, Netherlands",
          year: "",
          text: "Luxalon Beta Safety-Loop exterior planks at NCIA NATO.",
          details: {"Architect":"MVSA Architecten","Application":"Exterior planks"},
          images: ["ncia-nato.jpg"]
        },
        {
          brand: "luxalon",
          product: "Luxalon 300L / 300L Ext",
          title: "",
          location: "Heverlee, Belgium",
          year: "",
          text: "Luxalon 300L exterior wide-panel ceiling in Heverlee.",
          details: {"Architect":"Abscis Architecten","Installed system":"Luxalon 300L exterior","Application":"Exterior ceiling"},
          images: ["heverlee-300l.jpg"]
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
      intro: "Derako solid wood ceiling and wall systems combine natural timber with purpose-designed suspension systems. Linear and grill designs offer a choice of wood species, dimensions and finishes, with acoustic performance determined by the selected configuration.",
      cover: "../../commercial/derako-boardroom.jpg",

      // One spec page per product. A project's "product" opens the matching page.
      products: [
        { name: "Derako Wood Grill", acoustic: "Up to αw 0.55", fire: "B-s2,d0", voc: "A+", drawing: "wood-grill-drawing.jpg", finishes: "wood-grill-finishes.jpg", certificates: "wood-grill-certificates.jpg",
          specs: ["ProLine reference: solid wood slats joined with aluminium dowels","Slat height 40–140 mm; thickness 15–35 mm","Panel length 590–3500 mm in the technical overview; width up to 480 mm","Joint width 25–140 mm; custom dimensions by agreement","Up to αw 0.55 with acoustical pad; configuration dependent","Reaction to fire B-s2,d0; VOC emission class A+","Demountable; FSC or PEFC supply available on request"] },
        { name: "Derako Wood Linear", acoustic: "Up to αw 0.50", fire: "B-s2,d0", voc: "A+", drawing: "wood-linear-drawing.jpg", finishes: "wood-linear-finishes.jpg", certificates: "wood-linear-certificates.jpg",
          specs: ["ProLine reference: solid wood linear panels on a carrier-and-clip system","Linear open, MultiPanel and linear closed configurations","Panel width 63–184 mm; thickness 15–18 mm","Mixed panel lengths, minimum 900 mm; fixed lengths on request","Up to αw 0.50 with acoustical pad; configuration dependent","B-s2,d0; B-s1,d0 with the specified special treatment","VOC emission class A+; FSC or PEFC supply on request"] }
      ],

      fire: [
        { layout: "section", title: "Reaction to fire", subtitle: "" },
        { layout: "text-photo", title: "Fire protection", subtitle: "Building materials and construction parts", text: "Reaction to fire describes how a product behaves when exposed to fire. Fire resistance describes the performance of a building element or assembly for a specified period.", bullets: ["EN 13501-1: materials are classified according to their reaction to fire", "EN 13501-2: construction parts are classified for their resistance to fire"], image: "../shared/fire-wood.jpg" },
        { layout: "text-photo", title: "Fire classification", subtitle: "Fire-retardant treated wood", figure: "B-s2,d0", label: "Euroclass · EN 13501-1", text: "EN 13501-1 classifies construction products by reaction to fire. The main class describes fire behaviour; the additional smoke and droplet classes describe performance under the specified test conditions.", bullets: ["Grill ProLine and Linear ProLine: B-s2,d0", "B = limited contribution to fire; s2 = smoke production within s2 limits", "d0 = no flaming droplets or particles within 600 seconds", "Linear ProLine: B-s1,d0 with the specified special treatment"], image: "../shared/fire-wood.jpg" },
        { layout: "text-photo", title: "Fire testing", subtitle: "", text: "For all construction products, the consideration is a fire initiated in a room, which may grow and eventually reach flash-over.", bullets: ["Phase I: ignition / initiation", "Phase II: fire growth until flash-over", "Phase III: past flash-over, fully developed fire", "Phase IV: fire runs out"], image: "../shared/fire-development-curve.jpg" }
      ],

      acoustics: [
        {layout: "text-photo",title: "Acoustic performance",subtitle: "Sound absorption",figure: "0.55 αw",label: "Grill ProLine · up to, with acoustical pad",text: "Published values apply to the stated system and acoustic backing. Slat dimensions, gaps and the installed build-up affect absorption; use the matching test configuration.",bullets: ["Grill ProLine: up to αw 0.55 with acoustical pad","Linear ProLine: up to αw 0.50 with acoustical pad","Linear BaseLine: up to αw 0.50 with acoustical pad"],image: "wood-grill-drawing.jpg"},
        {layout: "text",title: "Veneered wood ceiling tiles",subtitle: "Derako Veneered Tiles Prestige",text: "Prestige is a veneered MDF ceiling tile system with a concealed edge detail for installation on a standard T24 grid. Its performance differs from the solid wood Grill and Linear systems.",bullets: ["Standard sizes: 600 x 600, 1200 x 600 and 1800 x 600 mm","Up to αw 0.65, or 0.95 with acoustical pad","Reaction to fire B-s2,d0; VOC emission class A","Perforation choices include single, double, nano and slotted patterns"]}
      ],

      sustainability: [
        { layout: "section", title: "Sustainability", subtitle: "and the Environment" },
        { layout: "text-photo", title: "Circular economy", subtitle: "", text: "A circular approach aims to reduce waste and keep products and materials in use. Consider durability, access for maintenance, disassembly and realistic routes for reuse or recycling when specifying the complete system.", bullets: [], image: "../shared/circular-economy.jpg" },
        { layout: "text-photo", title: "Cradle to Cradle Certified®", subtitle: "Silver · specified certified systems", text: "Derako Grill Systems and Derako Linear System – Inside are listed as Cradle to Cradle Certified Full Scope Silver, version 3.1. Certification applies to the scope in each certificate, rather than every possible wood species, treatment or system configuration.", bullets: ["Grill Systems: certificate 8314","Linear System – Inside: certificate 8315","Published validity: until 22 October 2026; check renewal before use"], image: "../shared/cradle-to-cradle.jpg" },
        { layout: "photo-info", image: "../shared/c2c-process.jpg", caption: "Cradle to Cradle Certified® process" },
        { layout: "text-photo", title: "FSC® or PEFC certification", subtitle: "The mark of responsible forestry", text: "FSC and PEFC support responsible forest management and traceability through certified supply chains. Certified wood can be supplied on request; specify the required certification and confirm the claim in the supply documentation.", bullets: [], image: "../shared/fsc-pefc.jpg" },
        { layout: "text-photo", title: "BREEAM", subtitle: "Green building certification", figure: "BREEAM", label: "Project-level assessment", text: "Hunter Douglas publishes supporting evidence for BREEAM International assessments. Contributions depend on the scheme, specified system and project assessment; products do not earn a building rating on their own.", bullets: ["HEA02: indoor air emissions evidence","HEA05: acoustic performance test data","MAT01: life-cycle impacts through available EPDs","MAT03: responsible sourcing, including FSC or PEFC supply"], image: "../../commercial/derako-wood-linear.jpg" }
      ]
    },

    heartfelt: {
      name: "HeartFelt",
      tagline: "Acoustic felt ceilings & walls",
      intro: "HeartFelt is a family of acoustic felt ceiling and wall systems made from non-woven, thermoformed PES fibres. Linear panels, folded Origami shapes and baffles offer different ways to combine colour, texture and sound absorption.",
      cover: "../../commercial/heartfelt-meeting-room.jpg",

      // One spec page per product. A project's "product" opens the matching page.
      products: [
        { name: "HeartFelt Linear", acoustic: "Class A", fire: "B-s1,d0", voc: "A+", drawing: "linear-drawing.jpg", finishes: "linear-finishes.jpg", certificates: "linear-certificates.jpg",
          specs: ["Non-woven thermoformed PES fibres", "Heights of 55, 64, 80 and 105 mm, 40 mm wide", "Modulations from 50 to 200 mm in steps of 10 mm", "Up to αw 0.95, Class A, with acoustical pad", "Easy to install, low risk of damage", "Easy to maintain: dirt and dust resistant", "Reaction to fire B-s1,d0"] },
        { name: "HeartFelt Origami Pyramid", acoustic: "Class A", fire: "B-s1,d0", voc: "A+", drawing: "origami-pyramid-drawing.jpg", finishes: "origami-pyramid-finishes.jpg", certificates: "origami-pyramid-certificates.jpg",
          specs: ["Non-woven thermoformed PES fibres", "Tile size 600 x 600 mm", "αw 0.80, Class B; 0.95, Class A, with acoustical infill", "Easy to install, low risk of damage", "Easy to maintain: dirt and dust resistant", "Reaction to fire B-s1,d0"] },
        { name: "HeartFelt Baffle", acoustic: "Up to Class C", fire: "B-s1,d0", voc: "A+", drawing: "baffle-drawing.jpg", finishes: "baffle-finishes.jpg", certificates: "baffle-certificates.jpg",
          specs: ["Non-woven thermoformed PES fibres","Widths 40–80 mm; heights 100–500 mm","Panel lengths up to 2000 mm","Modules adjustable in increments of 50 mm","Up to αw 0.60, Class C, for baffle 80HB400","Acoustic performance depends on the configuration","Reaction to fire B-s1,d0"] }
      ],

      fire: [
        { layout: "section", title: "Reaction to fire", subtitle: "" },
        { layout: "text-photo", title: "Fire protection", subtitle: "Building materials and construction parts", text: "Reaction to fire describes how a product behaves when exposed to fire. Fire resistance describes the performance of a building element or assembly for a specified period.", bullets: ["EN 13501-1: materials are classified according to their reaction to fire", "EN 13501-2: construction parts are classified for their resistance to fire"], image: "../shared/fire-wood.jpg" },
        { layout: "text-photo", title: "Fire classification", subtitle: "", figure: "B-s1,d0", label: "Euroclass · EN 13501-1", text: "EN 13501-1 classifies construction products by reaction to fire. The main class describes fire behaviour; the additional smoke and droplet classes describe performance under the specified test conditions.", bullets: ["B = limited contribution to fire", "s1 = low smoke production", "d0 = no flaming droplets or particles within 600 seconds"], image: "../shared/fire-wood.jpg" },
        { layout: "text-photo", title: "Fire testing", subtitle: "", text: "For all construction products, the consideration is a fire initiated in a room, which may grow and eventually reach flash-over.", bullets: ["Phase I: ignition / initiation", "Phase II: fire growth until flash-over", "Phase III: past flash-over, fully developed fire", "Phase IV: fire runs out"], image: "../shared/fire-development-curve.jpg" }
      ],

      acoustics: [
        { layout: "text-photo", title: "Acoustic performance", subtitle: "Sound absorption", figure: "0.95 αw", label: "Up to Class A · Linear / Origami with infill", text: "Sound absorption varies with panel type, spacing and installation. Linear and Origami can achieve Class A with the specified acoustic backing; Baffles have a separate performance profile.", bullets: ["Linear: up to αw 0.95 with acoustical pad", "Origami Pyramid: αw 0.80; 0.95 with infill", "Baffles: up to αw 0.60 for 80HB400 (Class C)"], image: "linear-drawing.jpg" }
      ],

      sustainability: [
        { layout: "section", title: "Sustainability", subtitle: "and the Environment" },
        { layout: "text-photo", title: "Circular economy", subtitle: "", text: "A circular approach aims to reduce waste and keep products and materials in use. Consider durability, access for maintenance, disassembly and realistic routes for reuse or recycling when specifying the complete system.", bullets: [], image: "../shared/circular-economy.jpg" },
        { layout: "text-photo", title: "Cradle to Cradle Certified® Material Health", subtitle: "Silver · based on version 5.0", text: "HeartFelt ceiling and wall systems have achieved Cradle to Cradle Certified Material Health Silver, based on version 5.0. This assessment addresses the chemicals and materials used in the certified system and supports informed material selection.", bullets: ["Material Health is a defined certification scope","Full product certification assesses additional categories","Use the current certificate for project documentation"], image: "../shared/cradle-to-cradle.jpg" },
        { layout: "photo-info", image: "../shared/c2c-process.jpg", caption: "Cradle to Cradle Certified® process" }
      ]
    },

    luxalon: {
      name: "Luxalon",
      tagline: "Metal ceilings & façades",
      intro: "Luxalon metal ceiling systems offer linear, screen, open-cell and wide-panel designs. Select the panel type, finish and interior or exterior version to suit the design, access and performance requirements.",
      cover: "../../exterior/wroclaw-airport.jpg",

      // One spec page per product. A project's "product" opens the matching page.
      products: [
        { name: "Luxalon 70U", acoustic: "NRC 0.80", fire: "A2-s1,d0", voc: "A+", drawing: "../../exterior/voortuinen-amsterdam.jpg", finishes: "", certificates: "",
          specs: ["70 x 25 mm aluminium panels; 30 mm open joint; 100 mm module","Interior panel lengths 800–6000 mm; exterior 1000–6000 mm","NRC 0.80: plain 70U at M100, with 25 mm mineral wool, approx. 55 kg/m³","Acoustic test configuration: 200 mm plenum; report MA 82","Interior plain panels: A2-s1,d0; VOC A+","Exterior version: Luxacote finish and ProFix support for wind loads","Up to 86% recycled aluminium, as published for this range"] },
        { name: "Luxalon V100", acoustic: "", fire: "A2-s1,d0", voc: "A+", drawing: "../../exterior/ing-bank-amsterdam.jpg", finishes: "", certificates: "",
          specs: ["Interior V100: 101 mm high; lengths 1000–6000 mm","Standard modules 100, 150 and 200 mm","Interior version: A2-s1,d0; VOC A+","Demountable vertical screens with optional decorative profiles","Exterior V100: aluminium panels with locking clips and ProFix support","No numerical sound-absorption value is published on the referenced screen page"] },
        { name: "Luxalon Cell50E", acoustic: "", fire: "A2-s1,d0", voc: "", drawing: "../../exterior/ahoy-rotterdam.jpg", finishes: "", certificates: "",
          specs: ["Open-cell panels assembled from aluminium U-profiles","Profile height 50 mm","Standard panels 600 x 600 mm or 600 x 1200 mm","Cell modules 50, 75, 86, 100, 120, 150 and 200 mm","Integrated main and cross runners","Sliding clips allow panel removal for access","Cell50E is distinct from Cell C50; the Ahoy photo designation is still pending"] },
        { name: "Luxalon 300L / 300L Ext", acoustic: "Up to αw 0.95", fire: "A2-s1,d0", voc: "", drawing: "../../exterior/wroclaw-airport.jpg", finishes: "", certificates: "",
          specs: ["300 mm wide panels, 28 mm high; lengths 1000–6000 mm","Interior 300L: aluminium or steel; carrier, lay-on or C-grid installation","Interior 300L: up to αw 0.75; 0.95 with acoustical infill","Interior 300L VOC class A+; no exterior VOC value assigned here","300L Ext: corrosion-resistant aluminium and Luxacote finish","300L Ext uses ProFix support for wind-load resistance","Up to 86% recycled aluminium, as published for these ranges"] },
        { name: "Luxalon Combiline", acoustic: "αw 0.55 / 0.70", fire: "B-s1,d0", voc: "A+ / A", drawing: "../../retail/illa-diagonal-1.jpg", finishes: "", certificates: "",
          specs: ["Combine metal, HeartFelt and veneered wood panels on one carrier","Panel sections: metal 30 x 64 mm; felt and wood 30 x 60 mm","Panel lengths 1000–6000 mm","Standard module 50 mm; custom modulation possible","αw 0.55: metal 30BXD at M50; 0.70: felt 30HL60 at M50","Panels can be removed individually for access","VOC class depends on the panel material"] }
      ],

      fire: [
        { layout: "section", title: "Reaction to fire", subtitle: "" },
        { layout: "text-photo", title: "Fire protection", subtitle: "Building materials and construction parts", text: "Reaction to fire describes how a product behaves when exposed to fire. Fire resistance describes the performance of a building element or assembly for a specified period.", bullets: ["EN 13501-1: materials are classified according to their reaction to fire", "EN 13501-2: construction parts are classified for their resistance to fire"], image: "../shared/fire-wood.jpg" },
        { layout: "text-photo", title: "Fire classification", subtitle: "", figure: "EN 13501-1", label: "Product-specific classification", text: "Reaction-to-fire performance depends on the product, finish and specified build-up. Use the classification for the selected system; one Euroclass does not apply to every Luxalon product.", bullets: ["70U plain, V100 interior, 300L and 300L Ext: A2-s1,d0","Cell50E brochure: A2-s1,d0; CombiLine: B-s1,d0","Planks Stretch: A1 in the current product profile","Tavola Closed: A2-s1,d0 plain; A2-s2,d0 perforated"], image: "../shared/fire-wood.jpg" },
        { layout: "text-photo", title: "Fire testing", subtitle: "", text: "For all construction products, the consideration is a fire initiated in a room, which may grow and eventually reach flash-over.", bullets: ["Phase I: ignition / initiation", "Phase II: fire growth until flash-over", "Phase III: past flash-over, fully developed fire", "Phase IV: fire runs out"], image: "../shared/fire-development-curve.jpg" }
      ],

      acoustics: [
        {layout: "text-photo",title: "Acoustic performance",subtitle: "Sound absorption",figure: "0.95 αw",label: "300L interior · up to, with acoustical infill",text: "Acoustic results depend on the panel, perforation, backing and installation. NRC and αw are separate ratings and should retain the metric used in the source.",bullets: ["300L interior: up to αw 0.95 with infill","70U reference configuration: NRC 0.80","CombiLine M50: αw 0.55 metal / 0.70 felt"],image: "../../transport/chisinau-airport-01.jpg"},
        {layout: "text",title: "Metal ceiling performance",subtitle: "Linear and stretch metal systems",text: "The current product pages provide the following reference values. These describe product configurations, rather than guaranteed performance for every installation.",bullets: ["30BD / 30BXD: up to αw 1.00 with acoustical pad; lengths 800–6000 mm; VOC A+","MultiPanel: up to αw 0.95 with acoustical pad; B, BD and BXD panels on one carrier; VOC A+","Planks Stretch: αw 0.85–1.00 with acoustical pad; steel mesh panels up to 600 x 2500 mm with reinforcement; VOC A+"]},
        {layout: "text",title: "Metal ceiling performance",subtitle: "Tavola baffle systems",text: "The Tavola ranges have separate specifications. Confirm the material, perforation and backing before selecting performance data.",bullets: ["Tavola Closed: up to αw 0.65; aluminium baffle 40 x 162 mm combined with a 150C panel","Tavola Closed: module 190 mm; baffle length 600–4000 mm; VOC A+","Tavola Straight: up to αw 0.50, or 0.90 with acoustical pad; aluminium or steel; VOC A+","Tavola Straight: panel lengths 600–4000 mm; multiple widths, heights and spacings"]}
      ],

      sustainability: [
        {layout: "section",title: "Sustainability",subtitle: "and the Environment"},
        {layout: "text-photo",title: "Circular economy",subtitle: "",text: "A circular approach aims to reduce waste and keep products and materials in use. Consider durability, access for maintenance, disassembly and realistic routes for reuse or recycling when specifying the complete system.",bullets: [],image: "../shared/circular-economy.jpg"},
        {layout: "text",title: "Environmental product information",subtitle: "Materials and life-cycle evidence",text: "Selected Luxalon aluminium ranges publish recycled content of up to 86%. Hunter Douglas also makes TAIM environmental product declarations available for aluminium and steel ceilings. Use the declaration and scope that match the specified system.",bullets: ["300L Ext and 70U: published aluminium recycled content up to 86%","EPDs provide life-cycle impact information","Plan access, disassembly and material separation for maintenance and recovery"]},
        {layout: "text",title: "Indoor air quality",subtitle: "Product-specific emissions evidence",text: "Many Luxalon products have received Indoor Air Comfort Gold certification. The French VOC emission class A+ is published for interior 70U, V100, 300L, Planks Stretch, 30BD / 30BXD, MultiPanel and the referenced Tavola ranges.",bullets: ["Use the certificate for the selected product and finish","An emissions label does not mean a product contains no chemicals","BREEAM and LEED contributions depend on the project assessment"]}
      ]
    }
  }
};
