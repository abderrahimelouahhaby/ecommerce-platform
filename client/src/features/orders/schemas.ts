import { z } from "zod";

// The same rules as the server. The server is the real judge.
export const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(100, "Name is too long"),
  phone: z
    .string()
    .trim()
    .min(6, "Enter a valid phone number")
    .max(30, "Phone number is too long")
    .regex(/^[0-9+()\s-]+$/, "Use digits, spaces and + ( ) - only"),
  address: z.string().trim().min(5, "Enter your street address").max(200, "Address is too long"),
  city: z.string().trim().min(2, "Enter your city").max(100, "City is too long"),
  postalCode: z.string().trim().min(2, "Enter your postal code").max(20, "Postal code is too long"),
  country: z.string().trim().min(2, "Enter your country").max(100, "Country is too long"),
  paymentMethod: z.enum(["COD", "CARD"]),
});

export type CheckoutValues = z.infer<typeof checkoutSchema>;
