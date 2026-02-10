const crypto = require("crypto");
const formidable = require("formidable");
const fs = require("fs");

const MALWARE_HASHES = [
  "e99a18c428cb38d5f260853678922e03",
  "44d88612fea8a8f36de82e1278abb02f",
  "275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f",
  "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
  "d41d8cd98f00b204e9800998ecf8427e"
];

function hashBuffer(buf) {
  const sha256 = crypto.createHash("sha256").update(buf).digest("hex");
  const md5 = crypto.createHash("md5").update(buf).digest("hex");
  return { sha256, md5 };
}

function entropy(buf) {
  if (!buf || buf.length === 0) return 0;
  const counts = new Array(256).fill(0);
  for (const b of buf) counts[b] += 1;
  let ent = 0;
  for (let i = 0; i < 256; i++) {
    const p = counts[i] / buf.length;
    if (p > 0) ent += -p * Math.log2(p);
  }
  return ent;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.json({ error: "Method not allowed" });
  }

  const form = formidable({
    multiples: false,
    maxFileSize: 25 * 1024 * 1024
  });

  form.parse(req, async (err, fields, files) => {
    try {
      if (err) {
        res.statusCode = 400;
        return res.json({ success: false, error: String(err.message || err) });
      }

      const file = files?.file;
      if (!file) {
        res.statusCode = 400;
        return res.json({ error: "No file uploaded" });
      }

      const filePath = file.filepath || file.path;
      const originalFilename = file.originalFilename || file.name || "uploaded";
      const buf = fs.readFileSync(filePath);

      const threats = [];
      const { sha256, md5 } = hashBuffer(buf);
      if (MALWARE_HASHES.includes(sha256) || MALWARE_HASHES.includes(md5)) {
        threats.push({
          type: "Known Malware",
          risk: "Critical",
          description: `File hash matches known malware database. SHA256: ${sha256}`,
          file: originalFilename
        });
      }

      const ent = entropy(buf);
      if (ent > 7.5) {
        threats.push({
          type: "High Entropy",
          risk: "Medium",
          description: `File entropy is ${ent.toFixed(2)}, indicating packed or encrypted content.`,
          file: originalFilename
        });
      }

      const isSafe = threats.length === 0;
      const riskLevel = threats.some((t) => t.risk === "Critical") ? "Critical" : threats.length ? "High" : "Safe";

      return res.json({
        success: true,
        fileName: originalFilename,
        isSafe,
        threatCount: threats.length,
        threats,
        riskLevel
      });
    } catch (e) {
      res.statusCode = 500;
      return res.json({ success: false, error: String(e?.message || e) });
    }
  });
};

module.exports.config = {
  api: {
    bodyParser: false
  }
};
