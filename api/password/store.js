const { scorePassword } = require('../../utils/password_utils');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.json({ error: 'Method not allowed' });
  }

  const { password, userId } = req.body || {};
  if (!password || !userId) {
    res.statusCode = 400;
    return res.json({ error: 'password and userId are required' });
  }

  const analysis = scorePassword(String(password));
  return res.json({
    id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    userId,
    strength: analysis.strength
  });
};

