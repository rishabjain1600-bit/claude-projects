export interface Review {
  author: string;
  rating: number;
  title: string;
  body: string;
  verified: boolean;
  helpful: number;
  date: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  sizes: string[];
  imageUrl: string;
  brand: string;
  tags: string[];
  sizingNotes?: string;
  reviews?: Review[];
}

export const PRODUCTS: Product[] = [
  {
    id: 'blue-runner-01',
    name: 'Air Runner Pro',
    price: 89,
    description: 'Lightweight running silhouette with a cushioned sole and breathable mesh upper. A everyday favourite that runs slightly narrow — most customers between sizes go up half a size.',
    sizes: ['7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '12'],
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
    brand: 'AeroStep',
    tags: ['running', 'lightweight', 'bestseller'],
    sizingNotes: 'Runs slightly narrow. Customers between sizes should go up half a size. Width is standard B (women\'s) / D (men\'s). Those with wider feet may want to go up a full size. The mesh upper does stretch slightly after a week of regular wear, so some customers find their true size works after break-in. Heel is snug — no slippage once laced.',
    reviews: [
      {
        author: 'Jordan M.',
        rating: 5,
        title: 'Best running shoe I\'ve owned',
        body: 'After three pairs of other brands, these are in another league. Incredibly light — you barely notice them on your feet. Took about a week to break in but now they\'re like wearing nothing. Went up half a size per the guide and the fit is perfect.',
        verified: true,
        helpful: 34,
        date: '2025-11-12',
      },
      {
        author: 'Sam K.',
        rating: 4,
        title: 'Great shoe, sizing tip is real',
        body: 'Really happy with these. The narrow fit warning is accurate — I\'m usually a 9 but ordered 9.5 and it\'s exactly right. Mesh breathes well on long runs. Took off one star because the insole is a bit thin out of the box, but an aftermarket insole fixes it.',
        verified: true,
        helpful: 21,
        date: '2025-10-28',
      },
      {
        author: 'Alex R.',
        rating: 5,
        title: 'My everyday sneaker now',
        body: 'Bought these for running but honestly wear them all day. Super comfortable after the break-in period. Returns policy gave me confidence to try them — ended up keeping them without hesitation.',
        verified: true,
        helpful: 18,
        date: '2025-12-03',
      },
      {
        author: 'Taylor W.',
        rating: 4,
        title: 'Light and fast, wide feet warning',
        body: 'Perfect for 5K and shorter runs. Cushioning is responsive without being too bouncy. I\'m a wide width and went up a full size — fits fine. Would recommend sizing up if you\'re between sizes or wide.',
        verified: false,
        helpful: 9,
        date: '2025-09-17',
      },
      {
        author: 'Morgan L.',
        rating: 5,
        title: 'Exactly what the description says',
        body: 'No surprises — lightweight, breathable, slightly narrow. Went half a size up and it\'s perfect. The cushioning is great for all-day wear. Free returns made it easy to try without risk. Keeping these forever.',
        verified: true,
        helpful: 15,
        date: '2026-01-05',
      },
    ],
  },
  {
    id: 'white-court-02',
    name: 'Court Classic',
    price: 115,
    description: 'A clean court-inspired low-top with a premium leather upper. Timeless style that pairs with anything. True to size.',
    sizes: ['7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '12'],
    imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80',
    brand: 'HeritageKicks',
    tags: ['lifestyle', 'leather', 'classic'],
  },
  {
    id: 'black-high-03',
    name: 'Uptown High',
    price: 130,
    description: 'High-top street style with premium canvas construction. Ankle support meets bold street design. Runs true to size.',
    sizes: ['7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '12'],
    imageUrl: 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800&q=80',
    brand: 'StreetForm',
    tags: ['street', 'high-top', 'canvas'],
  },
];

export function getProduct(id: string) {
  return PRODUCTS.find(p => p.id === id);
}
