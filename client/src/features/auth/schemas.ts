import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name").max(60, "Name is too long"),
    email: z.email("Enter a valid email address"),
    password: z.string().min(8, "Use at least 8 characters").max(128, "Use at most 128 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
