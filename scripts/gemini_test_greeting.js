const handler = require('../api/chat/message.js');

function createRes() {
  return {
    statusCode: 200,
    _json: null,
    json(payload) {
      this._json = payload;
      return payload;
    }
  };
}

async function runOnce(text) {
  const req = {
    method: 'POST',
    body: {
      message: text,
      history: [{ role: 'user', content: text }]
    }
  };
  const res = createRes();
  await handler(req, res);
  return { statusCode: res.statusCode, body: res._json };
}

async function main() {
  const hi = await runOnce('Hi');
  const hello = await runOnce('Hello');
  console.log(JSON.stringify({ hi, hello }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

