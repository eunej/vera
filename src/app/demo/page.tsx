import { VeraDemo } from "@/components/vera-demo";

export const metadata = {
  title: "Vera — Live procurement demo",
  description:
    "Run Vera’s agent procurement flow with real x402 settlement on Solana Devnet.",
};

export default function DemoPage() {
  return <VeraDemo />;
}
