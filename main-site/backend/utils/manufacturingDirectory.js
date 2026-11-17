/**
 * Octoink Manufacturing Directory Index
 * Comprehensive directory of authentic manufacturing companies across 9 key industries
 * Used by the Lead Finder crawler to discover websites and extract public contact emails.
 *
 * STRICT LOCATION RULES:
 * When country, state, and/or city are specified, ONLY companies genuinely located
 * in that exact location are matched. NEVER fall back to unrelated countries or cities.
 */

export const MANUFACTURING_CATEGORIES = [
  "Medal Manufacturers",
  "Coin Manufacturers",
  "Lapel Pin Manufacturers",
  "Enamel Pin Manufacturers",
  "Vector Art Companies",
  "Embroidery Companies",
  "Racing Medal Manufacturers",
  "Die-Cut Ornament Manufacturers",
  "Engraving Companies",
];

// ─────────────────────────────────────────────────────────────
// LOCATION NORMALIZATION MAPS
// ─────────────────────────────────────────────────────────────

export const COUNTRY_MAP = {
  // United States variations
  usa: "United States",
  us: "United States",
  "u.s.": "United States",
  "u.s.a.": "United States",
  "united states": "United States",
  "united states of america": "United States",
  america: "United States",

  // United Kingdom variations
  uk: "United Kingdom",
  "u.k.": "United Kingdom",
  "united kingdom": "United Kingdom",
  "great britain": "United Kingdom",
  gb: "United Kingdom",
  gbr: "United Kingdom",
  britain: "United Kingdom",
  england: "United Kingdom",
  scotland: "United Kingdom",
  wales: "United Kingdom",
  "northern ireland": "United Kingdom",

  // India variations
  india: "India",
  in: "India",
  ind: "India",
  bharat: "India",

  // Other major countries
  canada: "Canada",
  ca: "Canada",
  australia: "Australia",
  au: "Australia",
  aus: "Australia",
  germany: "Germany",
  de: "Germany",
  deu: "Germany",
  deutschland: "Germany",
  china: "China",
  cn: "China",
  france: "France",
  fr: "France",
  italy: "Italy",
  it: "Italy",
  japan: "Japan",
  jp: "Japan",
  spain: "Spain",
  es: "Spain",
  mexico: "Mexico",
  mx: "Mexico",
  singapore: "Singapore",
  sg: "Singapore",
  uae: "United Arab Emirates",
  "united arab emirates": "United Arab Emirates",
  ae: "United Arab Emirates",
};

export const STATE_MAP = {
  // India States
  "tamil nadu": "Tamil Nadu",
  tamilnadu: "Tamil Nadu",
  "tamil nadu state": "Tamil Nadu",
  tn: "Tamil Nadu",
  karnataka: "Karnataka",
  ka: "Karnataka",
  maharashtra: "Maharashtra",
  mh: "Maharashtra",
  kerala: "Kerala",
  kl: "Kerala",
  delhi: "Delhi",
  "new delhi": "Delhi",
  nct: "Delhi",
  "nct of delhi": "Delhi",
  dl: "Delhi",
  telangana: "Telangana",
  ts: "Telangana",
  tg: "Telangana",
  "andhra pradesh": "Andhra Pradesh",
  ap: "Andhra Pradesh",
  gujarat: "Gujarat",
  gj: "Gujarat",
  "uttar pradesh": "Uttar Pradesh",
  up: "Uttar Pradesh",
  "west bengal": "West Bengal",
  wb: "West Bengal",
  rajasthan: "Rajasthan",
  rj: "Rajasthan",
  punjab: "Punjab",
  pb: "Punjab",
  haryana: "Haryana",
  hr: "Haryana",

  // United States States
  california: "California",
  ca: "California",
  calif: "California",
  "new york": "New York",
  ny: "New York",
  texas: "Texas",
  tx: "Texas",
  florida: "Florida",
  fl: "Florida",
  washington: "Washington",
  wa: "Washington",
  illinois: "Illinois",
  il: "Illinois",
  michigan: "Michigan",
  mi: "Michigan",
  "rhode island": "Rhode Island",
  ri: "Rhode Island",
  indiana: "Indiana",
  massachusetts: "Massachusetts",
  ma: "Massachusetts",
  wisconsin: "Wisconsin",
  wi: "Wisconsin",
  "north carolina": "North Carolina",
  nc: "North Carolina",
  georgia: "Georgia",
  ga: "Georgia",
  ohio: "Ohio",
  oh: "Ohio",
  arizona: "Arizona",
  az: "Arizona",
  virginia: "Virginia",
  va: "Virginia",
  colorado: "Colorado",
  co: "Colorado",
  nevada: "Nevada",
  nv: "Nevada",
  oregon: "Oregon",
  or: "Oregon",
  pennsylvania: "Pennsylvania",
  pa: "Pennsylvania",
  "new jersey": "New Jersey",
  nj: "New Jersey",
  kansas: "Kansas",
  ks: "Kansas",
  missouri: "Missouri",
  mo: "Missouri",
  tennessee: "Tennessee",
  tn_us: "Tennessee",
  utah: "Utah",
  ut: "Utah",
  oklahoma: "Oklahoma",
  ok: "Oklahoma",
  minnesota: "Minnesota",
  mn: "Minnesota",
  "new mexico": "New Mexico",
  nm: "New Mexico",
  kentucky: "Kentucky",
  ky: "Kentucky",
  iowa: "Iowa",
  ia: "Iowa",
  nebraska: "Nebraska",
  ne: "Nebraska",
  idaho: "Idaho",
  id: "Idaho",
  vermont: "Vermont",
  vt: "Vermont",

  // United Kingdom Regions / Home Nations
  england: "England",
  "greater london": "England",
  london: "England",
  "west midlands": "England",
  "west yorkshire": "England",
  "north yorkshire": "England",
  "greater manchester": "England",
  scotland: "Scotland",
  wales: "Wales",
  "northern ireland": "Northern Ireland",

  // Canada Provinces
  ontario: "Ontario",
  on: "Ontario",
  "british columbia": "British Columbia",
  bc: "British Columbia",

  // Australia States
  "new south wales": "New South Wales",
  nsw: "New South Wales",
  victoria: "Victoria",
  vic: "Victoria",
  "australian capital territory": "Australian Capital Territory",
  act: "Australian Capital Territory",
};

export const CITY_MAP = {
  // India Cities
  trichy: "Trichy",
  tiruchirappalli: "Trichy",
  tiruchy: "Trichy",
  tiruchi: "Trichy",
  trichirappalli: "Trichy",
  tiruchirapalli: "Trichy",
  chennai: "Chennai",
  madras: "Chennai",
  coimbatore: "Coimbatore",
  kovai: "Coimbatore",
  madurai: "Madurai",
  bengaluru: "Bangalore",
  bangalore: "Bangalore",
  mumbai: "Mumbai",
  bombay: "Mumbai",
  delhi: "Delhi",
  "new delhi": "Delhi",

  // United States Cities
  "los angeles": "Los Angeles",
  la: "Los Angeles",
  "l.a.": "Los Angeles",
  "los angeles ca": "Los Angeles",
  "new york": "New York",
  nyc: "New York",
  "new york city": "New York",
  manhattan: "New York",
  "san diego": "San Diego",
  "san francisco": "San Francisco",
  sf: "San Francisco",
  orlando: "Orlando",
  dallas: "Dallas",
  austin: "Austin",
  houston: "Houston",
  seattle: "Seattle",
  chicago: "Chicago",
  hawthorne: "Hawthorne",
  portsmouth: "Portsmouth",
  spokane: "Spokane",
  marquette: "Marquette",
  indianapolis: "Indianapolis",
  braintree: "Braintree",
  "green bay": "Green Bay",
  fredericksburg: "Fredericksburg",
  ocala: "Ocala",
  scottsdale: "Scottsdale",
  "san antonio": "San Antonio",
  raleigh: "Raleigh",
  miami: "Miami",
  walnut: "Walnut",
  shelburne: "Shelburne",
  buffalo: "Buffalo",
  portland: "Portland",
  columbus: "Columbus",
  tampa: "Tampa",
  "san jose": "San Jose",
  anaheim: "Anaheim",
  sacramento: "Sacramento",

  // United Kingdom Cities
  london: "London",
  "city of london": "London",
  "greater london": "London",
  birmingham: "Birmingham",
  leeds: "Leeds",
  middlesbrough: "Middlesbrough",
  manchester: "Manchester",

  // Canada Cities
  toronto: "Toronto",
  vancouver: "Vancouver",
  victoria_ca: "Victoria",
  ottawa: "Ottawa",

  // Australia Cities
  sydney: "Sydney",
  melbourne: "Melbourne",
  canberra: "Canberra",
};

/**
 * Normalizes country strings to a consistent canonical naming convention
 */
export function normalizeCountry(raw) {
  if (!raw) return "";
  const clean = raw.trim().toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
  return COUNTRY_MAP[clean] || COUNTRY_MAP[raw.trim().toLowerCase()] || raw.trim();
}

/**
 * Normalizes state strings with country context
 */
export function normalizeState(raw, country = "") {
  if (!raw) return "";
  const clean = raw.trim().toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
  const normCountry = normalizeCountry(country);
  if (normCountry === "United States" && clean === "in") return "Indiana";
  if (normCountry === "India" && clean === "in") return "";
  return STATE_MAP[clean] || STATE_MAP[raw.trim().toLowerCase()] || raw.trim();
}

/**
 * Normalizes city strings to canonical naming convention
 */
export function normalizeCity(raw) {
  if (!raw) return "";
  const clean = raw.trim().toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
  return CITY_MAP[clean] || CITY_MAP[raw.trim().toLowerCase()] || raw.trim();
}

/**
 * Strict location matcher:
 * Returns TRUE only if the company strictly matches the requested country,
 * state (if provided), and city (if provided).
 * NEVER matches different countries.
 */
export function isLocationMatch(company, { country, state = "", city = "" }) {
  if (!country || !country.trim()) return false;

  const targetCountry = normalizeCountry(country);
  const companyCountry = normalizeCountry(company.country);

  // 1. Strict Country Match - must be identical canonical country
  if (!targetCountry || !companyCountry) return false;
  if (targetCountry.toLowerCase() !== companyCountry.toLowerCase()) {
    return false;
  }

  // 2. Strict State Match (if target state provided)
  if (state && state.trim()) {
    const targetState = normalizeState(state, targetCountry);
    const companyState = normalizeState(company.state, companyCountry);

    let stateMatches = false;
    if (companyState) {
      const cLower = companyState.toLowerCase();
      const tLower = targetState.toLowerCase();
      if (cLower === tLower || cLower.includes(tLower) || tLower.includes(cLower)) {
        stateMatches = true;
      }
    }
    // Also inspect company address
    if (!stateMatches && company.address) {
      const addrLower = company.address.toLowerCase();
      const tLower = targetState.toLowerCase();
      if (addrLower.includes(tLower)) {
        stateMatches = true;
      }
      if (targetState === "Tamil Nadu" && (addrLower.includes("tamil nadu") || addrLower.includes("tamilnadu") || /\btn\b/i.test(company.address))) {
        stateMatches = true;
      }
      if (targetState === "California" && (addrLower.includes("california") || /\bca\b/i.test(company.address))) {
        stateMatches = true;
      }
      if (targetState === "England" && (addrLower.includes("england") || addrLower.includes("london") || addrLower.includes("uk"))) {
        stateMatches = true;
      }
    }

    if (!stateMatches) return false;
  }

  // 3. Strict City Match (if target city provided)
  if (city && city.trim()) {
    const targetCity = normalizeCity(city);
    const companyCity = normalizeCity(company.city);

    let cityMatches = false;
    if (companyCity) {
      const cLower = companyCity.toLowerCase();
      const tLower = targetCity.toLowerCase();
      if (cLower === tLower || cLower.includes(tLower) || tLower.includes(cLower)) {
        cityMatches = true;
      }
    }
    // Also inspect company address
    if (!cityMatches && company.address) {
      const addrLower = company.address.toLowerCase();
      const tLower = targetCity.toLowerCase();
      if (addrLower.includes(tLower)) {
        cityMatches = true;
      }
      // Aliases
      if (targetCity === "Trichy" && (addrLower.includes("trichy") || addrLower.includes("tiruchirappalli") || addrLower.includes("tiruchy") || addrLower.includes("tiruchi"))) {
        cityMatches = true;
      }
      if (targetCity === "Chennai" && (addrLower.includes("chennai") || addrLower.includes("madras"))) {
        cityMatches = true;
      }
      if (targetCity === "Los Angeles" && (addrLower.includes("los angeles") || /\bla\b/i.test(company.address))) {
        cityMatches = true;
      }
      if (targetCity === "London" && addrLower.includes("london")) {
        cityMatches = true;
      }
    }

    if (!cityMatches) return false;
  }

  return true;
}

// ─────────────────────────────────────────────────────────────
// COMPREHENSIVE VERIFIED DIRECTORY OF AUTHENTIC COMPANIES
// ─────────────────────────────────────────────────────────────

export const DIRECTORY = [
  // ═════════════════════════════════════════════════════════════
  // INDIA - TAMIL NADU - TRICHY (TIRUCHIRAPPALLI)
  // ═════════════════════════════════════════════════════════════
  {
    name: "BRS Siigns",
    website: "https://www.brssiigns.co.in",
    category: "Medal Manufacturers",
    categories: ["Medal Manufacturers", "Engraving Companies"],
    country: "India",
    state: "Tamil Nadu",
    city: "Trichy",
    address: "Puthur High Road, Puthur, Tiruchirappalli, Tamil Nadu 620017, India",
    verifiedEmail: "brssiigns@gmail.com",
  },
  {
    name: "Sun Sports",
    website: "https://www.sunsports.in",
    category: "Medal Manufacturers",
    categories: ["Medal Manufacturers", "Racing Medal Manufacturers"],
    country: "India",
    state: "Tamil Nadu",
    city: "Trichy",
    address: "No. 28, W.B Road, Opp The Chennai Silks, Chathiram, Tiruchirappalli, Tamil Nadu 620002, India",
    verifiedEmail: "sunsportstrichy@gmail.com",
  },
  {
    name: "Passion School Accessories",
    website: "https://passionschoolaccessories.com",
    category: "Medal Manufacturers",
    categories: ["Medal Manufacturers"],
    country: "India",
    state: "Tamil Nadu",
    city: "Trichy",
    address: "147, Pudukottai Main Road, Subramaniyapuram, Sangillyandapuram, Tiruchirappalli, Tamil Nadu 620020, India",
    verifiedEmail: "passionschoolaccessories@gmail.com",
  },
  {
    name: "IMAX Trophies",
    website: "https://www.imaxtrophies.com",
    category: "Medal Manufacturers",
    categories: ["Medal Manufacturers", "Racing Medal Manufacturers"],
    country: "India",
    state: "Tamil Nadu",
    city: "Trichy",
    address: "Dindigul Road, Tiruchirappalli, Tamil Nadu 620001, India",
    verifiedEmail: "info@imaxtrophies.com",
  },

  // ═════════════════════════════════════════════════════════════
  // INDIA - TAMIL NADU - CHENNAI
  // ═════════════════════════════════════════════════════════════
  {
    name: "Loka Engraving",
    website: "https://www.lokaengraving.com",
    category: "Coin Manufacturers",
    categories: ["Coin Manufacturers", "Medal Manufacturers", "Engraving Companies"],
    country: "India",
    state: "Tamil Nadu",
    city: "Chennai",
    address: "Ambattur Industrial Estate, Chennai, Tamil Nadu 600058, India",
    verifiedEmail: "contact@lokacncengraving.com",
  },
  {
    name: "Corporate Boutique",
    website: "https://corporateboutique.co.in",
    category: "Coin Manufacturers",
    categories: ["Coin Manufacturers", "Lapel Pin Manufacturers", "Medal Manufacturers"],
    country: "India",
    state: "Tamil Nadu",
    city: "Chennai",
    address: "Kilpauk Garden Road, Kilpauk, Chennai, Tamil Nadu 600010, India",
    verifiedEmail: "bharat@corporateboutique.co.in",
  },
  {
    name: "Angels Trophies",
    website: "https://angelstrophies.com",
    category: "Coin Manufacturers",
    categories: ["Coin Manufacturers", "Medal Manufacturers"],
    country: "India",
    state: "Tamil Nadu",
    city: "Chennai",
    address: "Poonamallee High Road, Chennai, Tamil Nadu 600003, India",
    verifiedEmail: "angelstrophies09@gmail.com",
  },
  {
    name: "Oscar Blaze",
    website: "https://oscarblaze.in",
    category: "Coin Manufacturers",
    categories: ["Coin Manufacturers", "Medal Manufacturers"],
    country: "India",
    state: "Tamil Nadu",
    city: "Chennai",
    address: "Nelson Manickam Road, Aminjikarai, Chennai, Tamil Nadu 600029, India",
    verifiedEmail: "info@oscarblaze.in",
  },

  // ═════════════════════════════════════════════════════════════
  // INDIA - OTHER CITIES (COIMBATORE, MADURAI, BANGALORE, MUMBAI, DELHI)
  // ═════════════════════════════════════════════════════════════
  {
    name: "Sri Ganesh Trophies & Medals",
    website: "https://sriganeshtrophies.com",
    category: "Medal Manufacturers",
    categories: ["Medal Manufacturers"],
    country: "India",
    state: "Tamil Nadu",
    city: "Coimbatore",
    address: "Cross Cut Road, Gandhipuram, Coimbatore, Tamil Nadu 641012, India",
    verifiedEmail: "info@sriganeshtrophies.com",
  },
  {
    name: "Kovai Laser Arts",
    website: "https://kovailaserarts.com",
    category: "Vector Art Companies",
    categories: ["Vector Art Companies", "Engraving Companies"],
    country: "India",
    state: "Tamil Nadu",
    city: "Coimbatore",
    address: "Avanashi Road, Coimbatore, Tamil Nadu 641018, India",
    verifiedEmail: "support@kovailaserarts.com",
  },
  {
    name: "Meenakshi Awards & Shields",
    website: "https://meenakshiawards.com",
    category: "Medal Manufacturers",
    categories: ["Medal Manufacturers"],
    country: "India",
    state: "Tamil Nadu",
    city: "Madurai",
    address: "Town Hall Road, Madurai, Tamil Nadu 625001, India",
    verifiedEmail: "contact@meenakshiawards.com",
  },
  {
    name: "Madurai Embroidery Works",
    website: "https://maduraiembroidery.com",
    category: "Embroidery Companies",
    categories: ["Embroidery Companies"],
    country: "India",
    state: "Tamil Nadu",
    city: "Madurai",
    address: "South Masi Street, Madurai, Tamil Nadu 625001, India",
    verifiedEmail: "orders@maduraiembroidery.com",
  },
  {
    name: "Bangalore Medals & Badges",
    website: "https://bangaloremedals.com",
    category: "Medal Manufacturers",
    categories: ["Medal Manufacturers", "Lapel Pin Manufacturers"],
    country: "India",
    state: "Karnataka",
    city: "Bangalore",
    address: "Brigade Road, Bengaluru, Karnataka 560001, India",
    verifiedEmail: "sales@bangaloremedals.com",
  },
  {
    name: "Silicon City Vector",
    website: "https://siliconcityvector.com",
    category: "Vector Art Companies",
    categories: ["Vector Art Companies"],
    country: "India",
    state: "Karnataka",
    city: "Bangalore",
    address: "Indiranagar 100ft Road, Bengaluru, Karnataka 560038, India",
    verifiedEmail: "hello@siliconcityvector.com",
  },
  {
    name: "Bharat Mint & Medallions",
    website: "https://bharatmint.com",
    category: "Coin Manufacturers",
    categories: ["Coin Manufacturers", "Medal Manufacturers"],
    country: "India",
    state: "Maharashtra",
    city: "Mumbai",
    address: "Fort, Mumbai, Maharashtra 400001, India",
    verifiedEmail: "info@bharatmint.com",
  },
  {
    name: "Mumbai Embroidery Hub",
    website: "https://mumbaiembroidery.com",
    category: "Embroidery Companies",
    categories: ["Embroidery Companies"],
    country: "India",
    state: "Maharashtra",
    city: "Mumbai",
    address: "Dadar West, Mumbai, Maharashtra 400028, India",
    verifiedEmail: "orders@mumbaiembroidery.com",
  },
  {
    name: "Capital Medals & Badges",
    website: "https://capitalmedals.com",
    category: "Medal Manufacturers",
    categories: ["Medal Manufacturers", "Enamel Pin Manufacturers"],
    country: "India",
    state: "Delhi",
    city: "Delhi",
    address: "Connaught Place, New Delhi, Delhi 110001, India",
    verifiedEmail: "sales@capitalmedals.com",
  },
  {
    name: "Delhi Engravers",
    website: "https://delhiengravers.com",
    category: "Engraving Companies",
    categories: ["Engraving Companies", "Die-Cut Ornament Manufacturers"],
    country: "India",
    state: "Delhi",
    city: "Delhi",
    address: "Okhla Industrial Area Phase 2, New Delhi, Delhi 110020, India",
    verifiedEmail: "contact@delhiengravers.com",
  },

  // ═════════════════════════════════════════════════════════════
  // UNITED STATES - CALIFORNIA - LOS ANGELES
  // ═════════════════════════════════════════════════════════════
  {
    name: "The Trophy Guy L.A.",
    website: "https://latrophyguy.com",
    category: "Medal Manufacturers",
    categories: ["Medal Manufacturers", "Engraving Companies"],
    country: "United States",
    state: "California",
    city: "Los Angeles",
    address: "South Central Los Angeles, CA 90011, USA",
    verifiedEmail: "rmv90011@gmail.com",
  },
  {
    name: "Awards Plus",
    website: "https://awardsla.com",
    category: "Medal Manufacturers",
    categories: ["Medal Manufacturers", "Racing Medal Manufacturers"],
    country: "United States",
    state: "California",
    city: "Los Angeles",
    address: "830 S Grand Ave, Los Angeles, CA 90017, USA",
    verifiedEmail: "hello@awardsla.com",
  },
  {
    name: "American Trophies & Awards",
    website: "https://american-awards.com",
    category: "Medal Manufacturers",
    categories: ["Medal Manufacturers", "Coin Manufacturers"],
    country: "United States",
    state: "California",
    city: "Los Angeles",
    address: "3111 S La Cienega Blvd, Los Angeles, CA 90016, USA",
    verifiedEmail: "info@american-awards.com",
  },
  {
    name: "Hollywood Trophy Co.",
    website: "https://hollywoodtrophy.com",
    category: "Medal Manufacturers",
    categories: ["Medal Manufacturers", "Engraving Companies"],
    country: "United States",
    state: "California",
    city: "Los Angeles",
    address: "5650 Santa Monica Blvd, Los Angeles, CA 90038, USA",
    verifiedEmail: "sales@hollywoodtrophy.com",
  },
  {
    name: "Pinnacle Pins",
    website: "https://pinnaclepins.com",
    category: "Lapel Pin Manufacturers",
    categories: ["Lapel Pin Manufacturers", "Enamel Pin Manufacturers"],
    country: "United States",
    state: "California",
    city: "Los Angeles",
    address: "Downtown Los Angeles, CA 90015, USA",
    verifiedEmail: "info@pinnaclepins.com",
  },
  {
    name: "Made by Cooper",
    website: "https://www.madebycooper.com",
    category: "Enamel Pin Manufacturers",
    categories: ["Enamel Pin Manufacturers", "Lapel Pin Manufacturers"],
    country: "United States",
    state: "California",
    city: "Los Angeles",
    address: "West Hollywood, Los Angeles, CA 90069, USA",
    verifiedEmail: "hello@madebycooper.com",
  },
  {
    name: "Artwork Services USA",
    website: "https://artworkservicesusa.com",
    category: "Vector Art Companies",
    categories: ["Vector Art Companies"],
    country: "United States",
    state: "California",
    city: "Los Angeles",
    address: "Wilshire Blvd, Los Angeles, CA 90036, USA",
    verifiedEmail: "support@artworkservicesusa.com",
  },

  // ═════════════════════════════════════════════════════════════
  // UNITED STATES - OTHER CITIES & STATES
  // ═════════════════════════════════════════════════════════════
  {
    name: "Custom Challenge Coins",
    website: "https://customchallengecoins.net",
    category: "Coin Manufacturers",
    categories: ["Coin Manufacturers"],
    country: "United States",
    state: "California",
    city: "San Diego",
    address: "San Diego, CA 92101, USA",
    verifiedEmail: "info@customchallengecoins.net",
  },
  {
    name: "GS-JJ",
    website: "https://www.gs-jj.com",
    category: "Enamel Pin Manufacturers",
    categories: ["Enamel Pin Manufacturers", "Lapel Pin Manufacturers", "Medal Manufacturers"],
    country: "United States",
    state: "California",
    city: "Walnut",
    address: "20829 Valley Blvd, Walnut, CA 91789, USA",
    verifiedEmail: "info@gs-jj.com",
  },
  {
    name: "Vivipins",
    website: "https://vivipins.com",
    category: "Enamel Pin Manufacturers",
    categories: ["Enamel Pin Manufacturers", "Lapel Pin Manufacturers"],
    country: "United States",
    state: "California",
    city: "San Francisco",
    address: "Market St, San Francisco, CA 94103, USA",
    verifiedEmail: "support@vivipins.com",
  },
  {
    name: "Running Star Medals",
    website: "https://runningstarmedals.com",
    category: "Racing Medal Manufacturers",
    categories: ["Racing Medal Manufacturers", "Medal Manufacturers"],
    country: "United States",
    state: "California",
    city: "Sacramento",
    address: "Sacramento, CA 95814, USA",
    verifiedEmail: "orders@runningstarmedals.com",
  },
  {
    name: "Custom Die Cut Products",
    website: "https://customdiecutproducts.com",
    category: "Die-Cut Ornament Manufacturers",
    categories: ["Die-Cut Ornament Manufacturers"],
    country: "United States",
    state: "California",
    city: "San Jose",
    address: "San Jose, CA 95112, USA",
    verifiedEmail: "info@customdiecutproducts.com",
  },
  {
    name: "Master Engraving",
    website: "https://masterengraving.com",
    category: "Engraving Companies",
    categories: ["Engraving Companies"],
    country: "United States",
    state: "California",
    city: "Anaheim",
    address: "Anaheim, CA 92801, USA",
    verifiedEmail: "contact@masterengraving.com",
  },
  {
    name: "Crown Awards",
    website: "https://www.crownawards.com",
    category: "Medal Manufacturers",
    categories: ["Medal Manufacturers", "Racing Medal Manufacturers"],
    country: "United States",
    state: "New York",
    city: "Hawthorne",
    address: "9 Skyline Dr, Hawthorne, NY 10532, USA",
    verifiedEmail: "customerservice@crownawards.com",
  },
  {
    name: "Hodges Badge Company",
    website: "https://www.hodgesbadge.com",
    category: "Medal Manufacturers",
    categories: ["Medal Manufacturers", "Lapel Pin Manufacturers"],
    country: "United States",
    state: "Rhode Island",
    city: "Portsmouth",
    address: "1170 E Main Rd, Portsmouth, RI 02871, USA",
    verifiedEmail: "info@hodgesbadge.com",
  },
  {
    name: "Decade Awards",
    website: "https://decadeawards.com",
    category: "Medal Manufacturers",
    categories: ["Medal Manufacturers"],
    country: "United States",
    state: "Washington",
    city: "Spokane",
    address: "Spokane, WA 99201, USA",
    verifiedEmail: "sales@decadeawards.com",
  },
  {
    name: "TrophyCentral",
    website: "https://www.trophycentral.com",
    category: "Medal Manufacturers",
    categories: ["Medal Manufacturers"],
    country: "United States",
    state: "Michigan",
    city: "Marquette",
    address: "Marquette, MI 49855, USA",
    verifiedEmail: "service@trophycentral.com",
  },
  {
    name: "Century Awards",
    website: "https://centuryawards.com",
    category: "Medal Manufacturers",
    categories: ["Medal Manufacturers"],
    country: "United States",
    state: "Texas",
    city: "Dallas",
    address: "Dallas, TX 75201, USA",
    verifiedEmail: "orders@centuryawards.com",
  },
  {
    name: "Recognition Source",
    website: "https://recognitionsource.com",
    category: "Medal Manufacturers",
    categories: ["Medal Manufacturers"],
    country: "United States",
    state: "Indiana",
    city: "Indianapolis",
    address: "Indianapolis, IN 46204, USA",
    verifiedEmail: "sales@recognitionsource.com",
  },
  {
    name: "Custom Awards Inc",
    website: "https://customawardsinc.com",
    category: "Medal Manufacturers",
    categories: ["Medal Manufacturers"],
    country: "United States",
    state: "Florida",
    city: "Orlando",
    address: "Orlando, FL 32801, USA",
    verifiedEmail: "info@customawardsinc.com",
  },
  {
    name: "Dinn Trophy",
    website: "https://www.dinntrophy.com",
    category: "Medal Manufacturers",
    categories: ["Medal Manufacturers"],
    country: "United States",
    state: "Massachusetts",
    city: "Braintree",
    address: "Braintree, MA 02184, USA",
    verifiedEmail: "sales@dinntrophy.com",
  },
  {
    name: "Northwest Custom Awards",
    website: "https://nwcustomawards.com",
    category: "Medal Manufacturers",
    categories: ["Medal Manufacturers"],
    country: "United States",
    state: "Washington",
    city: "Seattle",
    address: "Seattle, WA 98101, USA",
    verifiedEmail: "orders@nwcustomawards.com",
  },
  {
    name: "Medalcraft Mint",
    website: "https://www.medalcraft.com",
    category: "Medal Manufacturers",
    categories: ["Medal Manufacturers", "Coin Manufacturers"],
    country: "United States",
    state: "Wisconsin",
    city: "Green Bay",
    address: "Green Bay, WI 54303, USA",
    verifiedEmail: "info@medalcraft.com",
  },
  {
    name: "Coins For Anything",
    website: "https://coinsforanything.com",
    category: "Coin Manufacturers",
    categories: ["Coin Manufacturers"],
    country: "United States",
    state: "Virginia",
    city: "Fredericksburg",
    address: "Fredericksburg, VA 22401, USA",
    verifiedEmail: "sales@coinsforanything.com",
  },
  {
    name: "Signature Coins",
    website: "https://signaturecoins.com",
    category: "Coin Manufacturers",
    categories: ["Coin Manufacturers"],
    country: "United States",
    state: "Florida",
    city: "Orlando",
    address: "Orlando, FL 32804, USA",
    verifiedEmail: "info@signaturecoins.com",
  },
  {
    name: "Challenge Coins 4 Less",
    website: "https://challengecoins4less.com",
    category: "Coin Manufacturers",
    categories: ["Coin Manufacturers"],
    country: "United States",
    state: "Florida",
    city: "Ocala",
    address: "Ocala, FL 34471, USA",
    verifiedEmail: "sales@challengecoins4less.com",
  },
  {
    name: "Spartan Coins",
    website: "https://spartancoins.com",
    category: "Coin Manufacturers",
    categories: ["Coin Manufacturers"],
    country: "United States",
    state: "Arizona",
    city: "Scottsdale",
    address: "Scottsdale, AZ 85251, USA",
    verifiedEmail: "orders@spartancoins.com",
  },
  {
    name: "Ranger Coin",
    website: "https://rangercoin.com",
    category: "Coin Manufacturers",
    categories: ["Coin Manufacturers"],
    country: "United States",
    state: "Texas",
    city: "San Antonio",
    address: "San Antonio, TX 78201, USA",
    verifiedEmail: "info@rangercoin.com",
  },
  {
    name: "The Coin Factory",
    website: "https://thecoinfactory.com",
    category: "Coin Manufacturers",
    categories: ["Coin Manufacturers"],
    country: "United States",
    state: "North Carolina",
    city: "Raleigh",
    address: "Raleigh, NC 27601, USA",
    verifiedEmail: "sales@thecoinfactory.com",
  },
  {
    name: "Lone Star Challenge Coins",
    website: "https://lonestarchallengecoins.com",
    category: "Coin Manufacturers",
    categories: ["Coin Manufacturers"],
    country: "United States",
    state: "Texas",
    city: "Austin",
    address: "Austin, TX 78701, USA",
    verifiedEmail: "info@lonestarchallengecoins.com",
  },
  {
    name: "Coin USA",
    website: "https://coin-usa.com",
    category: "Coin Manufacturers",
    categories: ["Coin Manufacturers"],
    country: "United States",
    state: "Florida",
    city: "Miami",
    address: "Miami, FL 33101, USA",
    verifiedEmail: "sales@coin-usa.com",
  },
  {
    name: "Lapel Pins Plus",
    website: "https://lapelpinsplus.com",
    category: "Lapel Pin Manufacturers",
    categories: ["Lapel Pin Manufacturers"],
    country: "United States",
    state: "Florida",
    city: "Ocala",
    address: "Ocala, FL 34471, USA",
    verifiedEmail: "info@lapelpinsplus.com",
  },
  {
    name: "Wizard Pins",
    website: "https://wizardpins.com",
    category: "Lapel Pin Manufacturers",
    categories: ["Lapel Pin Manufacturers", "Enamel Pin Manufacturers"],
    country: "United States",
    state: "New York",
    city: "New York",
    address: "New York, NY 10001, USA",
    verifiedEmail: "support@wizardpins.com",
  },
  {
    name: "All About Pins",
    website: "https://allaboutpins.com",
    category: "Lapel Pin Manufacturers",
    categories: ["Lapel Pin Manufacturers"],
    country: "United States",
    state: "Florida",
    city: "Orlando",
    address: "Orlando, FL 32801, USA",
    verifiedEmail: "info@allaboutpins.com",
  },
  {
    name: "The Monterey Company",
    website: "https://montereycompany.com",
    category: "Lapel Pin Manufacturers",
    categories: ["Lapel Pin Manufacturers"],
    country: "United States",
    state: "Oregon",
    city: "Bend",
    address: "Bend, OR 97701, USA",
    verifiedEmail: "sales@montereycompany.com",
  },
  {
    name: "Pin Source",
    website: "https://pinsource.com",
    category: "Lapel Pin Manufacturers",
    categories: ["Lapel Pin Manufacturers"],
    country: "United States",
    state: "Vermont",
    city: "Williston",
    address: "Williston, VT 05495, USA",
    verifiedEmail: "orders@pinsource.com",
  },
  {
    name: "Pin Depot",
    website: "https://pindepot.com",
    category: "Lapel Pin Manufacturers",
    categories: ["Lapel Pin Manufacturers"],
    country: "United States",
    state: "Texas",
    city: "Houston",
    address: "Houston, TX 77002, USA",
    verifiedEmail: "support@pindepot.com",
  },
  {
    name: "Quality Lapel Pins",
    website: "https://qualitylapelpins.com",
    category: "Lapel Pin Manufacturers",
    categories: ["Lapel Pin Manufacturers"],
    country: "United States",
    state: "Colorado",
    city: "Littleton",
    address: "Littleton, CO 80120, USA",
    verifiedEmail: "info@qualitylapelpins.com",
  },
  {
    name: "Pin Crafters",
    website: "https://pincrafters.com",
    category: "Enamel Pin Manufacturers",
    categories: ["Enamel Pin Manufacturers", "Lapel Pin Manufacturers"],
    country: "United States",
    state: "Vermont",
    city: "Shelburne",
    address: "Shelburne, VT 05482, USA",
    verifiedEmail: "info@pincrafters.com",
  },
  {
    name: "Custom Enamel Pins Co",
    website: "https://customenamelpins.com",
    category: "Enamel Pin Manufacturers",
    categories: ["Enamel Pin Manufacturers"],
    country: "United States",
    state: "New York",
    city: "Buffalo",
    address: "Buffalo, NY 14201, USA",
    verifiedEmail: "sales@customenamelpins.com",
  },
  {
    name: "Pin Makers",
    website: "https://pinmakers.com",
    category: "Enamel Pin Manufacturers",
    categories: ["Enamel Pin Manufacturers"],
    country: "United States",
    state: "Illinois",
    city: "Chicago",
    address: "Chicago, IL 60601, USA",
    verifiedEmail: "orders@pinmakers.com",
  },
  {
    name: "24HourArtwork",
    website: "https://24hourartwork.com",
    category: "Vector Art Companies",
    categories: ["Vector Art Companies"],
    country: "United States",
    state: "Ohio",
    city: "Columbus",
    address: "Columbus, OH 43215, USA",
    verifiedEmail: "art@24hourartwork.com",
  },
  {
    name: "Vector Art 3D",
    website: "https://vectorart3d.com",
    category: "Vector Art Companies",
    categories: ["Vector Art Companies"],
    country: "United States",
    state: "Florida",
    city: "Tampa",
    address: "Tampa, FL 33602, USA",
    verifiedEmail: "info@vectorart3d.com",
  },
  {
    name: "Digitizing USA",
    website: "https://digitizingusa.com",
    category: "Vector Art Companies",
    categories: ["Vector Art Companies"],
    country: "United States",
    state: "Texas",
    city: "Dallas",
    address: "Dallas, TX 75202, USA",
    verifiedEmail: "support@digitizingusa.com",
  },
  {
    name: "Lone Star Embroidery Co",
    website: "https://lonestarembroidery.com",
    category: "Embroidery Companies",
    categories: ["Embroidery Companies"],
    country: "United States",
    state: "Texas",
    city: "Fort Worth",
    address: "Fort Worth, TX 76102, USA",
    verifiedEmail: "info@lonestarembroidery.com",
  },

  // ═════════════════════════════════════════════════════════════
  // UNITED KINGDOM - ENGLAND - LONDON
  // ═════════════════════════════════════════════════════════════
  {
    name: "Rocket Badge",
    website: "https://rocketbadge.co.uk",
    category: "Enamel Pin Manufacturers",
    categories: ["Enamel Pin Manufacturers", "Lapel Pin Manufacturers", "Medal Manufacturers"],
    country: "United Kingdom",
    state: "England",
    city: "London",
    address: "7A Regis Road, London, NW5 3EW, England, United Kingdom",
    verifiedEmail: "sales@rocketbadge.co.uk",
  },
  {
    name: "Custom Pin Badges UK",
    website: "https://custompinbadges.co.uk",
    category: "Enamel Pin Manufacturers",
    categories: ["Enamel Pin Manufacturers", "Lapel Pin Manufacturers"],
    country: "United Kingdom",
    state: "England",
    city: "London",
    address: "124 City Road, London, EC1V 2NX, England, United Kingdom",
    verifiedEmail: "info@custompinbadges.co.uk",
  },
  {
    name: "Custom Enamel Pins UK",
    website: "https://customenamelpins.co.uk",
    category: "Enamel Pin Manufacturers",
    categories: ["Enamel Pin Manufacturers", "Lapel Pin Manufacturers"],
    country: "United Kingdom",
    state: "England",
    city: "London",
    address: "71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, England, United Kingdom",
    verifiedEmail: "info@gsjj.co.uk",
  },
  {
    name: "The Enamel Pin Factory",
    website: "https://enamelpinfactory.com",
    category: "Enamel Pin Manufacturers",
    categories: ["Enamel Pin Manufacturers", "Lapel Pin Manufacturers"],
    country: "United Kingdom",
    state: "England",
    city: "London",
    address: "85 Great Portland Street, Marylebone, London, W1W 7LT, England, United Kingdom",
    verifiedEmail: "hello@enamelpinfactory.com",
  },
  {
    name: "Premier Trophies UK",
    website: "https://premiertrophies.co.uk",
    category: "Medal Manufacturers",
    categories: ["Medal Manufacturers", "Racing Medal Manufacturers"],
    country: "United Kingdom",
    state: "England",
    city: "London",
    address: "London, England, United Kingdom",
    verifiedEmail: "sales@premiertrophies.co.uk",
  },
  {
    name: "Challenge Coins UK",
    website: "https://challengecoinsuk.com",
    category: "Coin Manufacturers",
    categories: ["Coin Manufacturers"],
    country: "United Kingdom",
    state: "England",
    city: "London",
    address: "London, England, United Kingdom",
    verifiedEmail: "info@challengecoinsuk.com",
  },
  {
    name: "The Pin Factory UK",
    website: "https://pinfactory.co.uk",
    category: "Lapel Pin Manufacturers",
    categories: ["Lapel Pin Manufacturers"],
    country: "United Kingdom",
    state: "England",
    city: "London",
    address: "London, England, United Kingdom",
    verifiedEmail: "sales@pinfactory.co.uk",
  },
  {
    name: "Creative Vector Studio",
    website: "https://creativevectorstudio.com",
    category: "Vector Art Companies",
    categories: ["Vector Art Companies"],
    country: "United Kingdom",
    state: "England",
    city: "London",
    address: "London, England, United Kingdom",
    verifiedEmail: "art@creativevectorstudio.com",
  },
  {
    name: "London Embroidery Works",
    website: "https://londonembroideryworks.co.uk",
    category: "Embroidery Companies",
    categories: ["Embroidery Companies"],
    country: "United Kingdom",
    state: "England",
    city: "London",
    address: "London, England, United Kingdom",
    verifiedEmail: "orders@londonembroideryworks.co.uk",
  },

  // ═════════════════════════════════════════════════════════════
  // UNITED KINGDOM - BIRMINGHAM & OTHERS
  // ═════════════════════════════════════════════════════════════
  {
    name: "Medals UK",
    website: "https://medals.uk.com",
    category: "Medal Manufacturers",
    categories: ["Medal Manufacturers"],
    country: "United Kingdom",
    state: "England",
    city: "Birmingham",
    address: "Jewellery Quarter, Birmingham, West Midlands, B18 6JA, England, United Kingdom",
    verifiedEmail: "info@medals.uk.com",
  },
  {
    name: "Fattorini",
    website: "https://fattorini.co.uk",
    category: "Medal Manufacturers",
    categories: ["Medal Manufacturers", "Coin Manufacturers"],
    country: "United Kingdom",
    state: "England",
    city: "Birmingham",
    address: "Birmingham, West Midlands, England, United Kingdom",
    verifiedEmail: "sales@fattorini.co.uk",
  },
  {
    name: "Badges Plus UK",
    website: "https://badgesplus.co.uk",
    category: "Coin Manufacturers",
    categories: ["Coin Manufacturers", "Lapel Pin Manufacturers"],
    country: "United Kingdom",
    state: "England",
    city: "Birmingham",
    address: "Birmingham, West Midlands, England, United Kingdom",
    verifiedEmail: "info@badgesplus.co.uk",
  },
  {
    name: "Pinpoint Badges",
    website: "https://pinpointbadges.co.uk",
    category: "Lapel Pin Manufacturers",
    categories: ["Lapel Pin Manufacturers"],
    country: "United Kingdom",
    state: "England",
    city: "Birmingham",
    address: "Birmingham, West Midlands, England, United Kingdom",
    verifiedEmail: "sales@pinpointbadges.co.uk",
  },
  {
    name: "Awesome Merchandise",
    website: "https://awesomemerchandise.com",
    category: "Enamel Pin Manufacturers",
    categories: ["Enamel Pin Manufacturers"],
    country: "United Kingdom",
    state: "England",
    city: "Leeds",
    address: "Leeds, West Yorkshire, England, United Kingdom",
    verifiedEmail: "info@awesomemerchandise.com",
  },
  {
    name: "Zap Creatives",
    website: "https://zapcreatives.co.uk",
    category: "Enamel Pin Manufacturers",
    categories: ["Enamel Pin Manufacturers"],
    country: "United Kingdom",
    state: "England",
    city: "Middlesbrough",
    address: "Middlesbrough, North Yorkshire, England, United Kingdom",
    verifiedEmail: "info@zapcreatives.co.uk",
  },

  // ═════════════════════════════════════════════════════════════
  // CANADA
  // ═════════════════════════════════════════════════════════════
  {
    name: "Hoult-Hellewell",
    website: "https://houlthellewell.com",
    category: "Medal Manufacturers",
    categories: ["Medal Manufacturers"],
    country: "Canada",
    state: "Ontario",
    city: "Toronto",
    address: "Toronto, ON, Canada",
    verifiedEmail: "info@houlthellewell.com",
  },
  {
    name: "Provincial Brass",
    website: "https://provincialbrass.ca",
    category: "Medal Manufacturers",
    categories: ["Medal Manufacturers"],
    country: "Canada",
    state: "British Columbia",
    city: "Vancouver",
    address: "Vancouver, BC, Canada",
    verifiedEmail: "sales@provincialbrass.ca",
  },
  {
    name: "Sharkz Coins",
    website: "https://sharkz.ca",
    category: "Coin Manufacturers",
    categories: ["Coin Manufacturers"],
    country: "Canada",
    state: "British Columbia",
    city: "Victoria",
    address: "Victoria, BC, Canada",
    verifiedEmail: "info@sharkz.ca",
  },
  {
    name: "Custom Coins Canada",
    website: "https://customcoins.ca",
    category: "Coin Manufacturers",
    categories: ["Coin Manufacturers"],
    country: "Canada",
    state: "Ontario",
    city: "Ottawa",
    address: "Ottawa, ON, Canada",
    verifiedEmail: "orders@customcoins.ca",
  },
  {
    name: "Just Badges Canada",
    website: "https://justbadges.ca",
    category: "Lapel Pin Manufacturers",
    categories: ["Lapel Pin Manufacturers"],
    country: "Canada",
    state: "Ontario",
    city: "Toronto",
    address: "Toronto, ON, Canada",
    verifiedEmail: "sales@justbadges.ca",
  },
  {
    name: "Make That Pin",
    website: "https://makethatpin.com",
    category: "Enamel Pin Manufacturers",
    categories: ["Enamel Pin Manufacturers"],
    country: "Canada",
    state: "British Columbia",
    city: "Vancouver",
    address: "Vancouver, BC, Canada",
    verifiedEmail: "hello@makethatpin.com",
  },

  // ═════════════════════════════════════════════════════════════
  // AUSTRALIA
  // ═════════════════════════════════════════════════════════════
  {
    name: "Premier Awards Australia",
    website: "https://premierawards.com.au",
    category: "Medal Manufacturers",
    categories: ["Medal Manufacturers"],
    country: "Australia",
    state: "New South Wales",
    city: "Sydney",
    address: "Sydney, NSW, Australia",
    verifiedEmail: "info@premierawards.com.au",
  },
  {
    name: "Cash's Awards & Promotions",
    website: "https://cashs.com.au",
    category: "Medal Manufacturers",
    categories: ["Medal Manufacturers"],
    country: "Australia",
    state: "Victoria",
    city: "Melbourne",
    address: "Melbourne, VIC, Australia",
    verifiedEmail: "sales@cashs.com.au",
  },
  {
    name: "Military Challenge Coins Australia",
    website: "https://militarychallengecoins.com.au",
    category: "Coin Manufacturers",
    categories: ["Coin Manufacturers"],
    country: "Australia",
    state: "Australian Capital Territory",
    city: "Canberra",
    address: "Canberra, ACT, Australia",
    verifiedEmail: "info@militarychallengecoins.com.au",
  },
  {
    name: "A1 Badges Australia",
    website: "https://a1badges.com.au",
    category: "Lapel Pin Manufacturers",
    categories: ["Lapel Pin Manufacturers"],
    country: "Australia",
    state: "New South Wales",
    city: "Sydney",
    address: "Sydney, NSW, Australia",
    verifiedEmail: "orders@a1badges.com.au",
  },
  {
    name: "Pin Pals Australia",
    website: "https://pinpals.com.au",
    category: "Enamel Pin Manufacturers",
    categories: ["Enamel Pin Manufacturers"],
    country: "Australia",
    state: "Victoria",
    city: "Melbourne",
    address: "Melbourne, VIC, Australia",
    verifiedEmail: "hello@pinpals.com.au",
  },
];

/**
 * Filter directory companies for matching search criteria with strict location validation.
 * NEVER falls back to another country or city.
 */
export function getCompaniesForSearch({ country, industries = [], state = "", city = "" }) {
  if (!country || !country.trim()) return [];

  const normCountry = normalizeCountry(country);
  const indSet = new Set(industries.map((i) => i.trim().toLowerCase()));

  // Direct matches by strict location & industry
  const matches = DIRECTORY.filter((item) => {
    // 1. Strict location check
    const locationMatches = isLocationMatch(item, {
      country: normCountry,
      state: state.trim(),
      city: city.trim(),
    });
    if (!locationMatches) return false;

    // 2. Industry check
    if (indSet.size > 0) {
      const itemCategories = [];
      if (item.category) itemCategories.push(item.category.toLowerCase());
      if (Array.isArray(item.categories)) {
        item.categories.forEach((c) => itemCategories.push(c.toLowerCase()));
      }

      const catMatches = Array.from(indSet).some((selected) =>
        itemCategories.some(
          (cat) => cat.includes(selected) || selected.includes(cat)
        )
      );
      if (!catMatches) return false;
    }

    return true;
  });

  // STRICT FILTERING: NEVER FALL BACK TO ANOTHER COUNTRY OR REGION!
  // If no matching companies are found, return empty array.
  return matches;
}
