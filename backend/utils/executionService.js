const https = require("https");
const http = require("http");
const { URL } = require("url");

// Mapping from CodeRush language strings to Judge0 language IDs
const LANGUAGE_MAP = {
    python: 71, // Python (3.8.1)
    cpp: 54,    // C++ (GCC 9.2.0)
    java: 62,   // Java (OpenJDK 13.0.1)
    javascript: 63 // JavaScript (Node.js 12.14.0)
};

/**
 * Execute code using sandboxed Judge0 API
 * @param {string} language - "python" | "cpp" | "java" | "javascript"
 * @param {string} sourceCode - Complete source code to execute
 * @param {string} stdin - Standard input string for test cases
 * @returns {Promise<Object>} Execution result with stdout, stderr, compile_output, status, time, memory
 */
async function executeCode(language, sourceCode, stdin = "") {
    const languageId = LANGUAGE_MAP[language];
    if (!languageId) {
        throw new Error(`Unsupported language: ${language}. Allowed: python, cpp, java, javascript`);
    }

    const apiUrl = process.env.JUDGE0_API_URL || "https://ce.judge0.com";
    const apiKey = process.env.JUDGE0_API_KEY;

    const payload = JSON.stringify({
        source_code: sourceCode,
        language_id: languageId,
        stdin: stdin || ""
    });

    const parsedUrl = new URL(`${apiUrl}/submissions?base64_encoded=false&wait=true`);
    const isHttps = parsedUrl.protocol === "https:";
    const transport = isHttps ? https : http;

    const headers = {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload)
    };

    // If using RapidAPI Judge0
    if (apiKey) {
        headers["X-RapidAPI-Key"] = apiKey;
        headers["X-RapidAPI-Host"] = parsedUrl.hostname;
    }

    const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: "POST",
        headers,
        timeout: 15000 // 15s timeout
    };

    return new Promise((resolve, reject) => {
        const req = transport.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => {
                data += chunk;
            });

            res.on("end", async () => {
                try {
                    const result = JSON.parse(data);

                    // If result status is still in queue (id 1 or 2), poll once or twice
                    if (result.status && (result.status.id === 1 || result.status.id === 2) && result.token) {
                        const polled = await pollSubmission(apiUrl, apiKey, result.token);
                        return resolve(formatJudge0Response(polled));
                    }

                    resolve(formatJudge0Response(result));
                } catch (parseErr) {
                    reject(new Error(`Failed to parse execution service response: ${data.slice(0, 100)}`));
                }
            });
        });

        req.on("timeout", () => {
            req.destroy();
            reject(new Error("Code execution timed out (limit 15 seconds)"));
        });

        req.on("error", (err) => {
            reject(new Error(`Sandbox execution connection error: ${err.message}`));
        });

        req.write(payload);
        req.end();
    });
}

/**
 * Poll Judge0 if async token returned
 */
async function pollSubmission(apiUrl, apiKey, token) {
    const parsedUrl = new URL(`${apiUrl}/submissions/${token}?base64_encoded=false`);
    const isHttps = parsedUrl.protocol === "https:";
    const transport = isHttps ? https : http;

    const headers = {};
    if (apiKey) {
        headers["X-RapidAPI-Key"] = apiKey;
        headers["X-RapidAPI-Host"] = parsedUrl.hostname;
    }

    // Try up to 4 times with 1 second delay
    for (let i = 0; i < 4; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        try {
            const data = await new Promise((resolve, reject) => {
                const req = transport.get(
                    {
                        hostname: parsedUrl.hostname,
                        port: parsedUrl.port || (isHttps ? 443 : 80),
                        path: parsedUrl.pathname + parsedUrl.search,
                        headers,
                        timeout: 5000
                    },
                    (res) => {
                        let body = "";
                        res.on("data", (c) => (body += c));
                        res.on("end", () => resolve(JSON.parse(body)));
                    }
                );
                req.on("error", reject);
            });

            if (data.status && data.status.id > 2) {
                return data;
            }
        } catch (e) {
            // continue polling
        }
    }

    return { status: { id: 5, description: "Time Limit Exceeded" } };
}

/**
 * Standardize output structure
 */
function formatJudge0Response(raw) {
    const statusDesc = raw.status ? raw.status.description : "Unknown";
    const isAccepted = raw.status && raw.status.id === 3;
    const isCompileError = raw.status && raw.status.id === 6;
    const isTimeLimit = raw.status && raw.status.id === 5;
    const isRuntimeError = raw.status && (raw.status.id >= 7 && raw.status.id <= 12);

    return {
        stdout: (raw.stdout || "").trimEnd(),
        stderr: (raw.stderr || "").trimEnd(),
        compile_output: (raw.compile_output || "").trimEnd(),
        status: statusDesc,
        statusId: raw.status?.id || 0,
        time: raw.time ? `${raw.time}s` : "0.0s",
        memory: raw.memory ? `${raw.memory} KB` : "0 KB",
        isAccepted,
        isCompileError,
        isTimeLimit,
        isRuntimeError,
        raw
    };
}

module.exports = {
    executeCode,
    LANGUAGE_MAP
};
