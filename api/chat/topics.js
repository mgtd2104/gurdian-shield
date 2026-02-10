module.exports = async (req, res) => {
  const topics = [
    "sql injection",
    "xss",
    "path traversal",
    "csrf",
    "insecure headers",
    "malware",
    "virus",
    "eicar",
    "ransomware",
    "trojan",
    "hash"
  ];
  res.json({ success: true, topics, count: topics.length });
};
