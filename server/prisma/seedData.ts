export type SeedProduct = {
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  stock: number;
};

export type SeedCategory = {
  name: string;
  slug: string;
  products: SeedProduct[];
};

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Prices are written in dollars here, and stored in cents.
function product(name: string, price: number, stock: number, description: string): SeedProduct {
  return { name, slug: slugify(name), description, priceCents: Math.round(price * 100), stock };
}

export const seedCategories: SeedCategory[] = [
  {
    name: "Smartphones",
    slug: "smartphones",
    products: [
      product(
        "Nova X1 Smartphone",
        699,
        25,
        "6.1 inch OLED screen, 128 GB storage and a dual camera for sharp everyday photos.",
      ),
      product(
        "Nova X1 Pro Smartphone",
        999,
        14,
        "6.7 inch 120 Hz display, 256 GB storage, triple camera and fast wireless charging.",
      ),
      product(
        "Nova Lite 5G Smartphone",
        349,
        40,
        "An affordable 5G phone with a 6.5 inch screen and a battery that lasts two days.",
      ),
      product(
        "Pulse A7 Smartphone",
        279,
        32,
        "6.4 inch screen, 64 GB storage and a clean, fast interface for daily use.",
      ),
      product(
        "Pulse A7 Plus Smartphone",
        329,
        18,
        "Same design as the A7 with 128 GB storage, 8 GB of memory and a better camera.",
      ),
      product(
        "Orbit Fold Smartphone",
        1499,
        3,
        "A foldable phone that opens into a 7.6 inch tablet screen. Limited stock.",
      ),
    ],
  },
  {
    name: "Laptops",
    slug: "laptops",
    products: [
      product(
        "Voltix Air 14 Laptop",
        899,
        20,
        "Thin 14 inch laptop with 16 GB of memory, 512 GB SSD and 12 hours of battery.",
      ),
      product(
        "Voltix Pro 16 Laptop",
        1599,
        9,
        "16 inch high resolution display, powerful processor and 1 TB SSD for demanding work.",
      ),
      product(
        "Voltix Student 13 Laptop",
        549,
        35,
        "A light 13 inch laptop that is easy to carry to class, with 8 GB of memory.",
      ),
      product(
        "Nimbus Gaming 15 Laptop",
        1299,
        11,
        "15 inch 144 Hz screen, dedicated graphics card and a cooling system built for games.",
      ),
      product(
        "Nimbus Slim 14 Laptop",
        749,
        0,
        "A quiet 14 inch laptop for office work and streaming. Currently out of stock.",
      ),
      product(
        "Orbit Workstation 17 Laptop",
        2199,
        4,
        "17 inch color accurate screen and 32 GB of memory for video editing and 3D work.",
      ),
    ],
  },
  {
    name: "Headphones and Audio",
    slug: "headphones-audio",
    products: [
      product(
        "Aura Buds Pro",
        149,
        50,
        "Wireless earbuds with active noise cancelling and 24 hours of battery with the case.",
      ),
      product(
        "Aura Buds Lite",
        59,
        80,
        "Light wireless earbuds with clear sound and a pocket sized charging case.",
      ),
      product(
        "Aura Studio Headphones",
        249,
        16,
        "Over ear headphones with deep bass, soft ear cushions and 40 hours of playback.",
      ),
      product(
        "Aura Sport Earbuds",
        89,
        45,
        "Sweat resistant earbuds with secure ear hooks, made for running and the gym.",
      ),
      product(
        "Pulse Bluetooth Speaker",
        79,
        28,
        "A portable waterproof speaker with strong sound and 12 hours of battery.",
      ),
      product(
        "Pulse Soundbar 300",
        199,
        12,
        "A 2.1 channel soundbar with a wireless subwoofer for a better TV sound.",
      ),
    ],
  },
  {
    name: "Smart Home",
    slug: "smart-home",
    products: [
      product(
        "Lumo Smart Bulb 4 Pack",
        39,
        60,
        "Four color changing bulbs you control from your phone or with your voice.",
      ),
      product(
        "Lumo Security Camera",
        69,
        24,
        "1080p indoor camera with night vision, motion alerts and two way audio.",
      ),
      product(
        "Lumo Smart Plug 2 Pack",
        24,
        70,
        "Turn any device on or off from your phone, and set schedules.",
      ),
      product(
        "Lumo Video Doorbell",
        129,
        5,
        "See and talk to visitors from anywhere. Works with your home network.",
      ),
      product(
        "Lumo Smart Thermostat",
        119,
        15,
        "Learns your schedule and helps lower your heating and cooling costs.",
      ),
      product(
        "Lumo Robot Vacuum",
        279,
        8,
        "Maps your home, cleans on a schedule and returns to its base by itself.",
      ),
    ],
  },
  {
    name: "Accessories",
    slug: "accessories",
    products: [
      product(
        "Orbit 65W USB-C Charger",
        35,
        90,
        "A compact fast charger for laptops, tablets and phones.",
      ),
      product(
        "Orbit 10000mAh Power Bank",
        29,
        55,
        "Charges a phone two to three times. Slim enough for a pocket.",
      ),
      product(
        "Orbit Braided USB-C Cable 2m",
        12,
        150,
        "A strong braided two meter cable for fast charging and data.",
      ),
      product(
        "Orbit Laptop Backpack",
        59,
        22,
        "Water resistant backpack with a padded laptop pocket up to 16 inches.",
      ),
      product(
        "Orbit Wireless Charging Pad",
        25,
        38,
        "Place your phone on the pad to charge it, no cable needed.",
      ),
      product(
        "Orbit Mechanical Keyboard",
        99,
        13,
        "Compact mechanical keyboard with tactile switches and backlight.",
      ),
    ],
  },
];
