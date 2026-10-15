import fs from "node:fs";
import path from "node:path";

const promptArgument = process.argv[2];
const fileName = process.argv[3] || `arte-${Date.now()}.png`;
const size = process.argv[4] || "1024x1024";
const apiKey = process.env.VIBI_API_KEY;
const baseUrl = "https://vibi.top/v1";

if (!promptArgument || !/^[a-zA-Z0-9_.-]+\.png$/.test(fileName)) {
  console.error(
    'Uso: node gerar-img.mjs "<prompt ou @arquivo>" <nome.png> [tamanho]',
  );
  process.exit(1);
}

if (!apiKey) {
  console.error("VIBI_API_KEY não está configurada neste ambiente.");
  process.exit(1);
}

const prompt = promptArgument.startsWith("@")
  ? fs.readFileSync(promptArgument.slice(1), "utf8")
  : promptArgument;

async function main() {
  try {
    console.log("Gerando imagem para o Brisa pela Vibi...");
    const response = await fetch(`${baseUrl}/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: "gpt-image-2", prompt, n: 1, size }),
    });
    const data = await response.json();
    if (!response.ok) {
      const code = data.error?.code || data.code || "erro da API";
      throw new Error(`Vibi HTTP ${response.status}: ${code}`);
    }

    const image = data.data?.[0];
    if (!image) throw new Error("A resposta não continha uma imagem.");
    let bytes;
    if (image.b64_json) {
      bytes = Buffer.from(image.b64_json, "base64");
    } else if (image.url) {
      const imageUrl = new URL(image.url);
      if (imageUrl.protocol !== "https:")
        throw new Error("A URL da imagem não é HTTPS.");
      const download = await fetch(imageUrl);
      if (!download.ok)
        throw new Error(`Falha ao baixar a imagem: HTTP ${download.status}`);
      bytes = Buffer.from(await download.arrayBuffer());
    } else {
      throw new Error("A resposta não tinha arquivo nem URL da imagem.");
    }
    if (
      bytes.length < 1024 ||
      !bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))
    )
      throw new Error("A API não retornou um PNG válido.");

    const directory = path.resolve("public/assets/images");
    fs.mkdirSync(directory, { recursive: true });
    const target = path.join(directory, fileName);
    fs.writeFileSync(target, bytes);
    console.log(`Imagem salva em ${target}`);
  } catch (error) {
    console.error("Falha ao gerar imagem:", error.message);
    process.exitCode = 1;
  }
}

await main();
