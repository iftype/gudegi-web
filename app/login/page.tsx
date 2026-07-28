import { Suspense } from "react";
import { LoginExperience } from "@/components/login-experience";

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="login-route-state">로그인 정보를 확인하고 있습니다.</main>}>
      <LoginExperience />
    </Suspense>
  );
}
