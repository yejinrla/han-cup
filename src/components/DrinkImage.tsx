"use client";
import { useState } from "react";
import Image from "next/image";
import { CupArt } from "./CupArt";
export function DrinkImage({
  src,
  name,
  kind,
  large = false,
}: {
  src: string | null;
  name: string;
  kind: string;
  large?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed || !/^\/images\/drinks\/[a-z0-9._-]+$/.test(src))
    return <CupArt name={name} kind={kind} large={large} />;
  return (
    <Image
      src={src}
      alt={name + " 제품 사진"}
      width={large ? 320 : 200}
      height={large ? 384 : 240}
      style={{ objectFit: "contain", maxWidth: "90%", height: "90%" }}
      onError={() => setFailed(true)}
    />
  );
}
