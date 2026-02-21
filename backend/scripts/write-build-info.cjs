const fs = require("fs");
const path = require("path");
const outputPath = path.resolve(__dirname, "../src/build-info.json");

const findRepoRoot = (startDir) => {
  let current = startDir;
  while (current && current !== path.dirname(current)) {
    if (fs.existsSync(path.join(current, ".git"))) {
      return current;
    }
    current = path.dirname(current);
  }
  return null;
};

const readPackedRef = (packedRefsPath, refPath) => {
  if (!fs.existsSync(packedRefsPath)) return "";
  const lines = fs.readFileSync(packedRefsPath, "utf8").split("\n");
  for (const line of lines) {
    if (!line || line.startsWith("#") || line.startsWith("^")) continue;
    const [sha, ref] = line.trim().split(" ");
    if (ref === refPath && sha) return sha;
  }
  return "";
};

const getGitHash = () => {
  const repoRoot = findRepoRoot(path.resolve(__dirname, ".."));
  if (!repoRoot) return "";

  const gitPath = path.join(repoRoot, ".git");
  const gitStat = fs.statSync(gitPath);
  const headPath = gitStat.isDirectory()
    ? path.join(gitPath, "HEAD")
    : gitPath;

  if (!fs.existsSync(headPath)) return "";
  const headContent = fs.readFileSync(headPath, "utf8").trim();

  if (!headContent.startsWith("ref: ")) {
    return headContent.slice(0, 7);
  }

  const refPath = headContent.replace("ref: ", "");
  const refFile = path.join(gitPath, refPath);
  if (fs.existsSync(refFile)) {
    return fs.readFileSync(refFile, "utf8").trim().slice(0, 7);
  }

  const packed = readPackedRef(path.join(gitPath, "packed-refs"), refPath);
  return packed ? packed.slice(0, 7) : "";
};

const version =
  process.env.GIT_COMMIT_HASH ||
  getGitHash() ||
  "unknown";

const buildTime =
  process.env.BUILD_TIME ||
  new Date().toISOString();

const payload = { version, buildTime };

fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log("[build-info]", payload);
