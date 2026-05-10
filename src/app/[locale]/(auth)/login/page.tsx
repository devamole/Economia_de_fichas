import { getTranslations } from "next-intl/server";
import { RolePicker } from "./role-picker";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: t("signIn") };
}

export default async function LoginPage() {
  return <RolePicker />;
}
