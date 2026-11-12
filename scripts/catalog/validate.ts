import { readFile } from "node:fs/promises";
import { validateCatalog } from "./schema";
const file = process.argv[2];
if (!file) throw new Error("검수 파일 경로를 입력하세요.");
const r = validateCatalog(JSON.parse(await readFile(file, "utf8")));
if (!r.ok) {
  console.error(r.errors.join("\n"));
  process.exitCode = 1;
} else
  console.log(
    `검수 데이터 형식 확인: ${r.batch.changes.length}개 제품. 실제 근거 확인 후에만 발행하세요.`,
  );
