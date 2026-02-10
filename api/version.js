module.exports = async (req, res) => {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || null;
  const ref = process.env.VERCEL_GIT_COMMIT_REF || null;
  res.json({
    ok: true,
    sha,
    ref,
    now: new Date().toISOString()
  });
};

