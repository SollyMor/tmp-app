import HomeShell from "./HomeShell";
import { getSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSession();

  return (
    <HomeShell
      nick={session?.nick ?? "Гость"}
      userId={session?.userId ?? ""}
    />
  );
}
