import { Client } from "pg";
import { readFile } from "node:fs/promises";
import { validateCatalog } from "./schema";
import { publishCatalog } from "./import";
import { rollbackCatalog } from "./rollback";
const [command, arg] = process.argv.slice(2);
if (!process.env.DATABASE_URL)
  throw new Error("DATABASE_URL 환경 설정이 필요합니다.");
const db = new Client({ connectionString: process.env.DATABASE_URL });
try {
  await db.connect();
  if (command === "publish") {
    const r = validateCatalog(JSON.parse(await readFile(arg, "utf8")));
    if (!r.ok) throw new Error("검수 파일 형식을 확인하세요.");
    const { releaseId } = await publishCatalog(r.batch, db);
    console.log("발행 ID:", releaseId);
  } else if (command === "rollback") {
    await rollbackCatalog(arg, db);
    console.log("수정 발행을 복구했습니다.");
  } else throw new Error("publish 또는 rollback을 지정하세요.");
} catch {
  console.error(
    "작업하지 못했습니다. 검수 파일·revision·DB 연결을 확인하세요.",
  );
  process.exitCode = 1;
} finally {
  await db.end();
}
