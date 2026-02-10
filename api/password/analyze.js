const { scorePassword } = require('./_utils');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.json({ error: 'Method not allowed' });
  }

  const { password } = req.body || {};
  if (!password) {
    res.statusCode = 400;
    return res.json({ error: 'Password is required' });
  }

  const analysis = scorePassword(String(password));
  return res.json(analysis);
};

