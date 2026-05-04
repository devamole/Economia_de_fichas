import { getTranslations } from "next-intl/server";

export default async function ParentDashboardPage() {
  const t = await getTranslations("common");
  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="font-display text-2xl font-bold">{t("appName")}</h1>
      <p className="text-muted-foreground">{t("loading")}</p>
    </main>
  );
}
