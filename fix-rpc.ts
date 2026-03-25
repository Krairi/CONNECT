import fs from "fs";
import path from "path";

function walkDir(dir: string, callback: (filePath: string) => void) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

walkDir("./src/services", (filePath) => {
  if (!filePath.endsWith(".ts") || filePath.includes("rpc.ts")) return;
  let content = fs.readFileSync(filePath, "utf-8");
  
  // Replace callRpc<TypeA, TypeB> with callRpc<TypeB>
  content = content.replace(/callRpc<\s*Record<string,\s*never>,\s*([^>]+)\s*>/g, "callRpc<$1>");
  content = content.replace(/callRpc<\s*[a-zA-Z0-9_]+,\s*([^>]+)\s*>/g, "callRpc<$1>");
  
  fs.writeFileSync(filePath, content);
});
