import { getTranslations } from "next-intl/server";
import { SignUpForm } from "./sign-up-form";
import { Link } from "@/i18n/navigation";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: t("signUp") };
}

export default async function SignUpPage() {
  const t = await getTranslations("auth");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-6 bg-background">
      {/* Hero gradient header */}
      <div className="text-center space-y-2">
        <div className="text-5xl">🏆</div>
        <h1 className="font-display text-3xl font-bold bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] bg-clip-text text-transparent">
          Fichas &amp; Premios
        </h1>
        <p className="text-muted-foreground text-sm">
          {t("signUp")} — empieza gratis
        </p>
      </div>

      <div className="w-full max-w-sm space-y-6">
        <SignUpForm />

        <p className="text-center text-sm text-muted-foreground">
          {t("alreadyHaveAccount")}{" "}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            {t("signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
