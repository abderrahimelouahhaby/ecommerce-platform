// One line of the cart. The name, price and stock are a snapshot taken when the product
// was added. They are used for display only: the server checks the real values at checkout.
export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  priceCents: number;
  imageUrl: string | null;
  stock: number;
  quantity: number;
};

// What we need to know about a product to add it to the cart.
export type CartProduct = Omit<CartItem, "quantity">;
