import express from 'express';
import mysql from 'mysql';
import { promisify } from 'util';

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'test'
});

connection.connect(err => { if (err) throw err; });
const query = promisify(connection.query).bind(connection) as (sql: string, values?: any[]) => Promise<any>;   // promisified

type ChatMember = { chatId: number; userId: number };

async function getOrCreateChat(userAId: number, userBId: number): Promise<number> {
  const [a, b] = [userAId, userBId].sort((x, y) => x - y);

  const rows = await query('SELECT ChatID FROM customers WHERE UserID = ? LIMIT 1', [a]) as any[];
  if (rows.length) return rows[0].ChatID;

  const chatId = a;
  await query('INSERT INTO customers (UserID, ChatID) VALUES (?, ?)', [a, chatId]);
  await query('INSERT INTO customers (UserID, ChatID) VALUES (?, ?)', [b, chatId]);
  return chatId;
}

const app = express();
app.use(express.json());
const PORT = 3000;

// 1. Create or Get Chat
app.post('/chat/create', async (req, res) => {
  try {
    const chatId = await getOrCreateChat(req.body.userAId, req.body.userBId);
    res.status(201).json({ chatId });
  } catch (e) { console.error(e); res.sendStatus(500); }
});

// 2. Send Message
app.post('/chat/:chatId/message/send', async (req, res) => {
  const { chatId } = req.params;
  const { senderId, text } = req.body;
  try {
    const result = await query(
      `INSERT INTO customers (ChatID, SenderId, Text, Messages, sentAt)
       VALUES (?, ?, ?, ?, NOW())`,
      [chatId, senderId, text, text]
    ) as any;
    res.status(201).json({ messageId: result.insertId });
  } catch (e) { console.error(e); res.sendStatus(500); }
});

// 3. Get Messages
app.get('/chat/:chatId/messages', async (req, res) => {
  const chatId = Number(req.params.chatId);
  const limit = Number(req.query.limit) || 50;
  try {
    const messages = await query(
      `SELECT UserID as id, ChatID as chatId, SenderId, Text as text, sentAt
       FROM customers
       WHERE ChatID = ? AND Text IS NOT NULL
       ORDER BY sentAt DESC
       LIMIT ?`,
      [chatId, limit]
    );
    res.json({ messages });
  } catch (e) { console.error(e); res.sendStatus(500); }
});

// 4. Mark Read  (stub)
app.post('/chat/:chatId/message/:messageId/read', (req, res) => res.json({ ok: true }));

// 5. Update Last Seen  (stub)
app.post('/chat/:chatId/lastseen', (req, res) => res.json({ ok: true }));

// 6. List User Chats
app.get('/user/:userId/chats', async (req, res) => {
  const userId = Number(req.params.userId);
  try {
    const rows = await query('SELECT DISTINCT ChatID FROM customers WHERE UserID = ?', [userId]) as any[];
    res.json({ chats: rows.map(r => ({ chatId: r.ChatID, members: [] })) });
  } catch (e) { console.error(e); res.sendStatus(500); }
});

app.listen(PORT, () => console.log(`Chat API on http://localhost:${PORT}`));