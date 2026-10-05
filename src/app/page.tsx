import type { Metadata } from "next";
import { StoryPage } from "@/components/story-page";

export const metadata: Metadata = {
  title: "Vera — Intent to settlement for machine-paid APIs",
  description:
    "Agent procurement intelligence: intent, compare, policy, decide, settle, receipt — before any USDC moves.",
};

export default function Home() {
  return <StoryPage />;
}
