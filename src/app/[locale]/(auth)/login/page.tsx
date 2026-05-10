import { getTranslations } from "next-intl/server";
import { LoginForm } from "./login-form";
import { Link } from "@/i18n/navigation";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: t("signIn") };
}

export default async function LoginPage() {
  const t = await getTranslations("auth");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-6 bg-background">
      <div className="text-center space-y-2">
        <div className="text-5xl">🏆</div>
        <h1 className="font-display text-3xl font-semibold text-primary">
          Fichas &amp; Premios
        </h1>
      </div>

      <div className="w-full max-w-sm space-y-6">
        <LoginForm />

        <div className="space-y-3 text-center text-sm text-muted-foreground">
          <p>
            {t("noAccount")}{" "}
            <Link href="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
              {t("signUp")}
            </Link>
          </p>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">o</span>
            </div>
          </div>
          <Link
            href="/login/child"
            className="block w-full rounded-xl border border-border py-3 text-center font-medium hover:bg-muted transition-colors"
          >
            Soy un hijo/a 👦
          </Link>
        </div>
      </div>
    </div>
  );
}
