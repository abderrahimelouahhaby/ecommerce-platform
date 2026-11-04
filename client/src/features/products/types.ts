// These types describe what the API sends (see docs/api.md).

export type Category = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  stock: number;
  imageUrl: string | null;
  createdAt: string;
  category: { id: string; name: string; slug: string };
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ProductListResponse = {
  data: Product[];
  pagination: Pagination;
};
