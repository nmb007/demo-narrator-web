import { BrandMark } from "@/features/auth/components/brand-mark";

type AuthStatusScreenProps = {
  message: string;
};

/** Full-viewport gate while session hydrates or a redirect is about to fire. */
export function AuthStatusScreen({ message }: AuthStatusScreenProps) {
  return (
    <div
      className="bg-bay text-sand flex min-h-dvh flex-col items-center justify-center px-6"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3">
        <BrandMark tone="on-bay" />
        <p className="text-sand/80 text-sm tracking-wide">{message}</p>
      </div>
    </div>
  );
}
