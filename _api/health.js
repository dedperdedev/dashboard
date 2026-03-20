/** Минимальный health check — без Express и БД, только JSON */
export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).end(JSON.stringify({ status: 'ok', message: 'API работает' }));
}
