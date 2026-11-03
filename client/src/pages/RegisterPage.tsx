import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSafeRedirect } from "@/features/auth/redirect";
import { registerSchema, type RegisterValues } from "@/features/auth/schemas";
import { authClient } from "@/lib/auth-client";

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = getSafeRedirect(searchParams.get("redirect"));
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterValues) {
    setServerError(null);

    const { error } = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
    });

    if (error) {
      if (error.status === 429) {
        setServerError("Too many attempts. Please wait a few minutes and try again.");
      } else if (error.status === 422) {
        setServerError("An account with this email may already exist. Try logging in.");
      } else {
        setServerError("We could not create your account. Please try again.");
      }
      return;
    }

    toast.success("Your account is ready");
    navigate(redirectTo, { replace: true });
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>It takes less than a minute.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="flex flex-col gap-4">
          <FormField
            id="name"
            label="Name"
            autoComplete="name"
            error={errors.name?.message}
            {...register("name")}
          />
          <FormField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <FormField
            id="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <FormField
            id="confirmPassword"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
          {serverError && (
            <p role="alert" className="text-sm text-destructive">
              {serverError}
            </p>
          )}
        </CardContent>
        <CardFooter className="mt-6 flex flex-col items-stretch gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to={`/login${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
              className="font-medium text-foreground underline underline-offset-4"
            >
              Log in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
