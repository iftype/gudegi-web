import type { Metadata } from "next";
import { FeedbackExperience } from "@/components/feedback-experience";

export const metadata: Metadata = {
  title: "피드백 | 구데기",
  description: "구데기 서비스에 의견을 남겨 주세요."
};

export default function FeedbackPage() {
  return <FeedbackExperience />;
}
