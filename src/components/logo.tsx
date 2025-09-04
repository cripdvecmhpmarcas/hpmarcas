import Image from "next/image";
import React from "react";

export default function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      width={350}
      height={350}
      className={className}
      alt="Logo"
    />
  );
}
