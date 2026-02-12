const { generatePassword, scorePassword } = require('../../utils/password_utils');

module.exports = async (req, res) => {
  const lengthRaw = req.query?.length;
  const specialRaw = req.query?.special;

  const length = Math.max(8, Math.min(64, Number(lengthRaw || 16)));
  const special = String(specialRaw ?? 'true') !== 'false';

  const password = generatePassword(length, special);
  const analysis = scorePassword(password);

  return res.json({
    password,
    ...analysis
  });
};

