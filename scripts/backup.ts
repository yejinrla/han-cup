import { spawnSync } from "node:child_process";
import { mkdir, chmod } from "node:fs/promises";
if (!process.env.DATABASE_URL)
  throw new Error("운영 DB 연결을 환경 설정으로 제공하세요.");
await mkdir("backups", { recursive: true, mode: 0o700 });
const file =
  "backups/hancup-" + new Date().toISOString().replace(/[:.]/g, "-") + ".dump";
const result = spawnSync(
  "pg_dump",
  ["--format=custom", "--no-owner", "--file", file],
  {
    env: { ...process.env, PGDATABASE: process.env.DATABASE_URL },
    stdio: ["ignore", "ignore", "pipe"],
  },
);
if (result.status !== 0)
  throw new Error("백업에 실패했습니다. DB 연결과 pg_dump 설치를 확인하세요.");
await chmod(file, 0o600);
console.log(
  "로컬 backups 폴더에 백업했습니다. 외부에 공유하거나 Git에 추가하지 마세요.",
);
