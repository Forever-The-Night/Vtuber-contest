import { inflateSync } from "zlib";
import exifr from "exifr";

export type ParsedImageMetadata = {
  modelName?: string;
  toolName?: string;
  prompt?: string;
  negativePrompt?: string;
  seed?: string;
  width?: number;
  height?: number;
  rawMetadata?: string;
  tags: string[];
};

export type ImageDimensions = {
  height: number;
  width: number;
};

const textDecoder = new TextDecoder("utf-8", { fatal: false });

export function readImageDimensions(buffer: Buffer): ImageDimensions | undefined {
  if (buffer.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" && buffer.length >= 24) {
    return { height: buffer.readUInt32BE(20), width: buffer.readUInt32BE(16) };
  }

  if (buffer.subarray(0, 3).toString("hex") === "ffd8ff") {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) return undefined;
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if (length < 2) return undefined;
      if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
        return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
      }
      offset += 2 + length;
    }
  }

  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    const format = buffer.subarray(12, 16).toString("ascii");
    if (format === "VP8X" && buffer.length >= 30) {
      return { height: 1 + buffer.readUIntLE(27, 3), width: 1 + buffer.readUIntLE(24, 3) };
    }
    if (format === "VP8 " && buffer.length >= 30) {
      return { height: buffer.readUInt16LE(28) & 0x3fff, width: buffer.readUInt16LE(26) & 0x3fff };
    }
    if (format === "VP8L" && buffer.length >= 25) {
      const bits = buffer.readUInt32LE(21);
      return { height: ((bits >> 14) & 0x3fff) + 1, width: (bits & 0x3fff) + 1 };
    }
  }

  return undefined;
}

function decodeText(data: Buffer, compressed = false) {
  try {
    return textDecoder.decode(compressed ? inflateSync(data) : data);
  } catch {
    return textDecoder.decode(data);
  }
}

function readPngTextChunks(buffer: Buffer) {
  const chunks: Record<string, string> = {};
  const signature = "89504e470d0a1a0a";
  if (buffer.subarray(0, 8).toString("hex") !== signature) {
    return chunks;
  }

  let offset = 8;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd > buffer.length) break;

    const data = buffer.subarray(dataStart, dataEnd);
    if (type === "tEXt") {
      const separator = data.indexOf(0);
      if (separator > -1) {
        const key = data.subarray(0, separator).toString("latin1");
        const value = decodeText(data.subarray(separator + 1));
        chunks[key] = value;
      }
    }

    if (type === "zTXt") {
      const separator = data.indexOf(0);
      if (separator > -1) {
        const key = data.subarray(0, separator).toString("latin1");
        const compressionMethod = data[separator + 1];
        const value = decodeText(data.subarray(separator + 2), compressionMethod === 0);
        chunks[key] = value;
      }
    }

    if (type === "iTXt") {
      const separator = data.indexOf(0);
      if (separator > -1) {
        const key = data.subarray(0, separator).toString("latin1");
        const compressionFlag = data[separator + 1];
        const compressionMethod = data[separator + 2];
        const languageEnd = data.indexOf(0, separator + 3);
        const translatedEnd = languageEnd > -1 ? data.indexOf(0, languageEnd + 1) : -1;
        if (translatedEnd > -1) {
          chunks[key] = decodeText(data.subarray(translatedEnd + 1), compressionFlag === 1 && compressionMethod === 0);
        }
      }
    }

    offset = dataEnd + 4;
  }

  return chunks;
}

function pickStableDiffusionFields(parameters: string) {
  const negativeMarker = "Negative prompt:";
  const settingsMarker = "Steps:";
  const negativeIndex = parameters.indexOf(negativeMarker);
  const settingsIndex = parameters.indexOf(settingsMarker);
  const promptEnd = negativeIndex > -1 ? negativeIndex : settingsIndex > -1 ? settingsIndex : parameters.length;
  const prompt = parameters.slice(0, promptEnd).trim();
  const negativePrompt =
    negativeIndex > -1
      ? parameters
          .slice(negativeIndex + negativeMarker.length, settingsIndex > -1 ? settingsIndex : undefined)
          .trim()
      : undefined;
  const settings = settingsIndex > -1 ? parameters.slice(settingsIndex) : "";
  const seed = settings.match(/Seed:\s*([^,\n]+)/i)?.[1]?.trim();
  const modelName = settings.match(/Model(?: hash)?:\s*([^,\n]+)/i)?.[1]?.trim();

  return { modelName, negativePrompt, prompt, seed };
}

function parseNovelAi(comment: string) {
  try {
    const value = JSON.parse(comment) as Record<string, unknown>;
    return {
      modelName: typeof value.source === "string" ? value.source : undefined,
      negativePrompt: typeof value.uc === "string" ? value.uc : undefined,
      prompt: typeof value.prompt === "string" ? value.prompt : undefined,
      seed: typeof value.seed === "number" || typeof value.seed === "string" ? String(value.seed) : undefined,
      toolName: "NovelAI",
    };
  } catch {
    return {};
  }
}

type MetadataFields = {
  modelName?: string;
  negativePrompt?: string;
  prompt?: string;
  seed?: string;
  toolName?: string;
};

type ComfyNode = {
  class_type?: string;
  type?: string;
  inputs?: Record<string, unknown>;
  widgets_values?: unknown[];
};

function parseJsonObject(value?: string) {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function normalizeComfyNodes(value: unknown) {
  const nodes = new Map<string, ComfyNode>();
  if (!value || typeof value !== "object") return nodes;

  if (Array.isArray(value)) {
    for (const node of value) {
      if (node && typeof node === "object" && "id" in node) {
        nodes.set(String((node as { id: unknown }).id), node as ComfyNode);
      }
    }
    return nodes;
  }

  const record = value as Record<string, unknown>;
  if (Array.isArray(record.nodes)) return normalizeComfyNodes(record.nodes);

  for (const [id, node] of Object.entries(record)) {
    if (node && typeof node === "object") nodes.set(id, node as ComfyNode);
  }
  return nodes;
}

function classNameOf(node?: ComfyNode) {
  return node?.class_type ?? node?.type ?? "";
}

function linkedNodeId(value: unknown) {
  if (Array.isArray(value) && value.length > 0) return String(value[0]);
  if (typeof value === "number" || typeof value === "string") return String(value);
  return undefined;
}

function textFromNode(node?: ComfyNode) {
  if (!node) return undefined;
  const text = node.inputs?.text;
  if (typeof text === "string" && text.trim()) return text.trim();
  const widgetText = node.widgets_values?.find((value) => typeof value === "string" && value.trim().length > 8);
  return typeof widgetText === "string" ? widgetText.trim() : undefined;
}

function inputString(node: ComfyNode, keys: string[]) {
  for (const key of keys) {
    const value = node.inputs?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function parseComfyUi(promptJson?: string, workflowJson?: string): MetadataFields & { tags: string[] } {
  const promptNodes = normalizeComfyNodes(parseJsonObject(promptJson));
  const workflowNodes = normalizeComfyNodes(parseJsonObject(workflowJson));
  const nodes = promptNodes.size > 0 ? promptNodes : workflowNodes;
  if (nodes.size === 0) return { tags: [] };

  const clipTexts = Array.from(nodes.values())
    .filter((node) => /CLIPTextEncode/i.test(classNameOf(node)))
    .map(textFromNode)
    .filter((value): value is string => Boolean(value));
  const sampler = Array.from(nodes.values()).find((node) => /KSampler/i.test(classNameOf(node)));
  const positiveNodeId = linkedNodeId(sampler?.inputs?.positive);
  const negativeNodeId = linkedNodeId(sampler?.inputs?.negative);
  const prompt = textFromNode(positiveNodeId ? nodes.get(positiveNodeId) : undefined) ?? clipTexts[0];
  const negativePrompt = textFromNode(negativeNodeId ? nodes.get(negativeNodeId) : undefined) ?? clipTexts[1];
  const seedValue = sampler?.inputs?.seed ?? sampler?.inputs?.noise_seed;
  const seed = typeof seedValue === "number" || typeof seedValue === "string" ? String(seedValue) : undefined;

  const modelCandidates: string[] = [];
  const loraNames: string[] = [];
  for (const node of nodes.values()) {
    const nodeClass = classNameOf(node);
    const modelName = inputString(node, ["ckpt_name", "unet_name", "model_name"]);
    if (modelName && /(Checkpoint|UNET|Loader|Model)/i.test(nodeClass)) modelCandidates.push(modelName);
    const loraName = inputString(node, ["lora_name"]);
    if (loraName) loraNames.push(loraName);

    if (node.widgets_values && /(Checkpoint|UNET|Lora|Loader)/i.test(nodeClass)) {
      for (const value of node.widgets_values) {
        if (typeof value === "string" && /\.(safetensors|ckpt|pt|bin)$/i.test(value.trim())) {
          if (/Lora/i.test(nodeClass)) loraNames.push(value.trim());
          else modelCandidates.push(value.trim());
        }
      }
    }
  }

  return {
    modelName: modelCandidates[0],
    negativePrompt,
    prompt,
    seed,
    tags: Array.from(new Set([modelCandidates[0], ...loraNames].filter((tag): tag is string => Boolean(tag)))),
    toolName: "ComfyUI",
  };
}

export async function parseImageMetadata(file: File, buffer: Buffer): Promise<ParsedImageMetadata> {
  const dimensions = readImageDimensions(buffer);
  const pngText = readPngTextChunks(buffer);
  const exif = await exifr.parse(buffer, { userComment: true, xmp: true }).catch(() => undefined);
  const rawMetadata = JSON.stringify({ exif, pngText }, null, 2);
  const parameters = pngText.parameters ?? pngText.Parameters ?? "";
  const novelAi: MetadataFields = pngText.Comment ? parseNovelAi(pngText.Comment) : {};
  const sd: MetadataFields = parameters ? pickStableDiffusionFields(parameters) : {};
  const hasComfy = Boolean(pngText.prompt || pngText.workflow);
  const comfy: MetadataFields & { tags: string[] } = hasComfy ? parseComfyUi(pngText.prompt, pngText.workflow) : { tags: [] };

  const prompt = novelAi.prompt ?? sd.prompt ?? comfy.prompt ?? pngText.prompt ?? undefined;
  const negativePrompt = novelAi.negativePrompt ?? sd.negativePrompt ?? comfy.negativePrompt;
  const modelName = novelAi.modelName ?? sd.modelName ?? comfy.modelName ?? pngText.Model ?? undefined;
  const toolName = novelAi.toolName ?? (hasComfy ? "ComfyUI" : parameters ? "Stable Diffusion" : undefined);
  const seed = novelAi.seed ?? sd.seed ?? comfy.seed;
  const tags = Array.from(new Set([toolName, modelName, ...comfy.tags].filter((tag): tag is string => Boolean(tag))));

  return {
    modelName,
    negativePrompt,
    prompt,
    rawMetadata: rawMetadata === "{}" ? undefined : rawMetadata,
    seed,
    tags,
    toolName,
    height: typeof exif?.ImageHeight === "number" ? exif.ImageHeight : dimensions?.height,
    width: typeof exif?.ImageWidth === "number" ? exif.ImageWidth : dimensions?.width,
  };
}