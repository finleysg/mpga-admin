"use client";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldLabel,
  FieldSeparator,
  Input,
} from "@mpga/ui";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { signIn, signUp } from "@/lib/auth-client";

interface InvitationData {
  email: string;
  role: string;
}

interface AcceptInvitationPageProps {
  params: Promise<{ token: string }>;
}

export default function AcceptInvitationPage({
  params,
}: AcceptInvitationPageProps) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function validateToken() {
      const { token: tokenParam } = await params;
      setToken(tokenParam);

      try {
        const response = await fetch(
          `/api/invitations/validate?token=${encodeURIComponent(tokenParam)}`,
        );
        const data = await response.json();

        if (!response.ok || !data.valid) {
          setValidationError(
            data.error || "This invitation link is invalid or has expired.",
          );
        } else {
          setInvitation({ email: data.email, role: data.role });
        }
      } catch {
        setValidationError("Failed to validate invitation. Please try again.");
      } finally {
        setIsValidating(false);
      }
    }

    validateToken();
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation || !token) return;

    setError("");
    setLoading(true);

    try {
      const result = await signUp.email({
        email: invitation.email,
        password,
        name,
      });

      if (result.error) {
        setError(result.error.message ?? "Account creation failed");
      } else {
        // Accept the invitation
        const acceptResponse = await fetch("/api/invitations/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (!acceptResponse.ok) {
          setError(
            "Your account was created but the invitation could not be accepted. Please contact an administrator.",
          );
          return;
        }

        router.push("/");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const storeTokenAndRedirect = (provider: "google") => {
    if (!token) return;

    // Store the invitation token in a cookie before redirecting
    document.cookie = `invitation_token=${token}; path=/; max-age=3600; SameSite=Lax`;

    signIn.social({
      provider,
      callbackURL: "/accept-invitation/callback",
    });
  };

  const handleGoogleSignUp = () => {
    storeTokenAndRedirect("google");
  };

  if (isValidating) {
    return (
      <div className="bg-muted flex min-h-svh items-center justify-center">
        <div className="text-muted-foreground">Validating invitation...</div>
      </div>
    );
  }

  if (validationError) {
    return (
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <a href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-md text-sm font-bold">
            M
          </div>
          <span className="font-heading text-xl">MPGA</span>
        </a>
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="font-heading text-xl">
                Invalid Invitation
              </CardTitle>
              <CardDescription>{validationError}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center text-sm">
                Please contact an administrator to request a new invitation.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <a href="/" className="flex items-center gap-2 self-center font-medium">
        <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-md text-sm font-bold">
          M
        </div>
        <span className="font-heading text-xl">MPGA</span>
      </a>
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="font-heading text-xl">
              Create your account
            </CardTitle>
            <CardDescription>
              You&apos;ve been invited to join as an {invitation?.role}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="flex flex-col gap-4">
                <Button
                  variant="outline"
                  className="w-full"
                  type="button"
                  onClick={handleGoogleSignUp}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="mr-2 h-5 w-5"
                  >
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Sign up with Google
                </Button>
              </div>
              <FieldSeparator>Or continue with</FieldSeparator>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-6">
                  {error && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}
                  <Field>
                    <FieldLabel htmlFor="name">Name</FieldLabel>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      value={invitation?.email ?? ""}
                      readOnly
                      className="bg-muted"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </Field>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account..." : "Create account"}
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
