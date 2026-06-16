import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { spawn, spawnSync } from "child_process";

const root = process.cwd();
const sqliteSchemaPath = join(root, "prisma", "schema.local.sqlite.prisma");
const env = {
  ...process.env,
  DATABASE_URL: "file:./dev.db",
  UPLOAD_DRIVER: "local",
};
const prismaCli = join(root, "node_modules", "prisma", "build", "index.js");
const nextCli = join(root, "node_modules", "next", "dist", "bin", "next");

const postgresSchema = await readFile(join(root, "prisma", "schema.prisma"), "utf8");
const sqliteSchema = postgresSchema.replace('provider = "postgresql"', 'provider = "sqlite"');
await mkdir(dirname(sqliteSchemaPath), { recursive: true });
await writeFile(sqliteSchemaPath, sqliteSchema);

function run(command, args) {
  const result = spawnSync(command, args, { env, stdio: "inherit" });
  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(process.execPath, [prismaCli, "generate", "--schema", sqliteSchemaPath]);
run(process.execPath, [prismaCli, "db", "push", "--schema", sqliteSchemaPath]);

const next = spawn(process.execPath, [nextCli, "dev"], { env, stdio: "inherit" });
next.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
next.on("exit", (code) => process.exit(code ?? 0));