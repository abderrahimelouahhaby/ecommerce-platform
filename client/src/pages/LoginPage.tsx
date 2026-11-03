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
import { loginSchema, type LoginValues } from "@/features/auth/schemas";
import { authClient } from "@/lib/auth-client";

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = getSafeRedirect(searchParams.get("redirect"));
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginValues) {
    setServerError(null);

    const { error } = await authClient.signIn.email(values);

    if (error) {
      // The same message for a wrong email and a wrong password, so nobody can find out
      // which emails have an account.
      setServerError(
        error.status === 429
          ? "Too many attempts. Please wait a few minutes and try again."
          : "Invalid email or password.",
      );
      return;
    }

    toast.success("Welcome back");
    navigate(redirectTo, { replace: true });
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Log in</CardTitle>
        <CardDescription>Enter your email and password to continue.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="flex flex-col gap-4">
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
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />
          {serverError && (
            <p role="alert" className="text-sm text-destructive">
              {serverError}
            </p>
          )}
        </CardContent>
        <CardFooter className="mt-6 flex flex-col items-stretch gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Log in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            No account yet?{" "}
            <Link
              to={`/register${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
              className="font-medium text-foreground underline underline-offset-4"
            >
              Create one
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
