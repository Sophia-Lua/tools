import http from "http";
import { pipeline, env } from "@huggingface/transformers";

const HOST = "0.0.0.0";
const PORT = parseInt(process.env.PORT || "8080");
const MODEL_ID = process.env.MODEL_ID || "Mozilla/tinybert-address-autofill";

env.cacheDir = "./models";
let generator = null;

async function initModel() {
  console.log("Loading model:", MODEL_ID);
  console.log("This may take a few minutes on first run...");
  generator = await pipeline("text-generation", MODEL_ID, { device: "cpu" });
  console.log("Model loaded successfully!");
}

function formatMessages(messages) {
  let prompt = "";
  const SYS = String.fromCharCode(198) + "system" + String.fromCharCode(256);
  const USR = String.fromCharCode(198) + "user" + String.fromCharCode(256);
  const AST = String.fromCharCode(198) + "assistant" + String.fromCharCode(256);
  const NL = String.fromCharCode(10);

  for (const msg of messages) {
    if (msg.role === "system") {
      prompt += SYS + NL + msg.content + NL;
    } else if (msg.role === "user") {
      prompt += USR + NL + msg.content + NL;
    }
  }
  prompt += AST + NL;
  return prompt;
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
    });
  });
}

function jsonResponse(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(data));
}

function sendSSE(res, data) {
  res.write("data: " + JSON.stringify(data) + "\n\n");
}

async function handleChat(req, res) {
  const body = await parseBody(req);
  const { messages, max_tokens = 512, stream = false } = body;

  if (!messages || !Array.isArray(messages)) {
    return jsonResponse(res, 400, { error: "messages is required" });
  }
  if (!generator) {
    return jsonResponse(res, 503, { error: "Model not loaded yet" });
  }

  const prompt = formatMessages(messages);
  const id = "chatcmpl-" + Date.now();

  if (stream) {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    const result = await generator(prompt, { max_new_tokens: max_tokens, do_sample: true, temperature: 0.7 });
    const text = result[0].generated_text;
    const newPart = text.slice(prompt.length);
    sendSSE(res, { id, object: "chat.completion.chunk", choices: [{ delta: { content: newPart }, finish_reason: "stop" }] });
    sendSSE(res, { id, object: "chat.completion.chunk", choices: [{ delta: {}, finish_reason: "stop" }] });
    res.end();
  } else {
    const result = await generator(prompt, { max_new_tokens: max_tokens, do_sample: true, temperature: 0.7 });
    const text = result[0].generated_text;
    const newPart = text.slice(prompt.length);
    jsonResponse(res, 200, {
      id, object: "chat.completion", created: Math.floor(Date.now() / 1000), model: MODEL_ID,
      choices: [{ index: 0, message: { role: "assistant", content: newPart.trim() }, finish_reason: "stop" }],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    });
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    return res.end();
  }
  if (req.method === "GET" && req.url === "/v1/models") {
    return jsonResponse(res, 200, { data: [{ id: MODEL_ID, object: "model", owned_by: "local" }] });
  }
  if (req.method === "GET" && req.url === "/health") {
    return jsonResponse(res, 200, { status: generator ? "ok" : "loading" });
  }
  if (req.method === "POST" && req.url === "/v1/chat/completions") {
    try { return await handleChat(req, res); }
    catch (e) { console.error("Error:", e); return jsonResponse(res, 500, { error: e.message }); }
  }
  jsonResponse(res, 404, { error: "Not found" });
});

console.log("Starting server...");
initModel().then(() => {
  server.listen(PORT, HOST, () => {
    console.log("Server running at http://" + HOST + ":" + PORT);
    console.log("Chrome extension config:");
    console.log("  API address: http://localhost:" + PORT);
    console.log("  Model: " + MODEL_ID);
  });
}).catch((e) => {
  console.error("Failed to load model:", e);
  process.exit(1);
});
