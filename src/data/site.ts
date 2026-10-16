/**
 * Site-wide constants that are not editorial content.
 * Editorial content lives in `src/content/` and is schema-validated.
 */

export const site = {
  name: 'School Innovation Council',
  school: 'Choithram School, Manik Bagh Road, Indore',
  shortDescription:
    'The School Innovation Council at Choithram School, Manik Bagh Road, Indore: ideation, innovation and entrepreneurship run with students.',
  description:
    'Official pages of the School Innovation Council at Choithram School, Manik Bagh Road, Indore. What the council does, what it has running now, who leads it, and how to reach it.',
  locale: 'en_IN',
  schoolWebsite: 'https://choithramschool.com/',
  sicPages: 'https://choithramschool.com/sic/',
} as const;

export const contact = {
  /** Published on the council's own contact page. */
  email: 'sic@choithramschool.com',
  phoneDisplay: '+0731 2475254',
  phoneHref: '+917312475254',
  addressLines: [
    'School Innovation Council',
    'Choithram School, Manik Bagh Road',
    'Indore, Madhya Pradesh 452009',
    'India',
  ],
  /** Maps link uses only the public street address already published above. */
  mapUrl:
    'https://www.openstreetmap.org/search?query=Choithram%20School%20Manik%20Bagh%20Road%20Indore',
} as const;

export const nav = [
  { href: '/', label: 'Home' },
  { href: '/events/', label: 'What’s on' },
  { href: '/about/', label: 'What is SIC?' },
  { href: '/mission/', label: 'Mission & vision' },
  { href: '/leadership/', label: 'Leadership' },
  { href: '/contact/', label: 'Contact' },
] as const;

export const footerNav = nav;
