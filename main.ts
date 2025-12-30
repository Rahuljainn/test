import mysql from 'mysql';
import express from 'express';
import { dbConfig } from './dbConfig.ts';

const connection = mysql.createConnection({
  host: dbConfig.HOST,
  user: dbConfig.USER,
  password: dbConfig.PASSWORD,
  database: dbConfig.DB,
});

const app = express();
const port = 3000;
app.use(express.json());

app.post('/chat/create', async (req, res) => {
  const body = req.body;
  try {
    // store this response in sql
    connection.connect((err) => {
      if (err) throw err;
      console.log("Connected to the database!");

      const sql = "INSERT INTO customers (UserID, ChatID) VALUES (?, ?)";
      //same chat id for user and chat id
      for (let key in body) {
        connection.query(sql, [body[key], body[key]], (err, result) => {
          if (err) throw err;
          console.log("Record inserted:", result.insertId);
        });
      }
    });
    console.log('query executed', body.userAId, body.userBId);
    res.status(201).json({ message: `Chat '${body.userAId}' ${body.userBId} and created successfully!` });
  } catch (err) {
    console.error('Error executing query', err);
  }

});

//POST /chat/:chatId/message/send
app.post('/chat/:chatId/message/send', async (req, res) => {
  const { chatId } = req.params;
  const { senderId, message } = req.body;
  try {
    // store this response in sql
    console.log('query executed', chatId, senderId, message);
    const sql = "INSERT INTO customers (UserId, ChatID, SenderID, Messages) VALUES (?, ?, ?)";
    connection.query(sql, [chatId, chatId, senderId, message], (err, result) => {
      if (err) throw err;
      console.log("Message inserted:", result.insertId);
    });
    res.status(201).json({ message: `Message sent successfully in chat '${chatId}'!` });
  } catch (err) {
    console.error('Error executing query', err);
  }
});

//GET /chat/:chatId/messages?limit=50
app.get('/chat/:chatId/messages', async (req, res) => {
  const { chatId } = req.params;
  const limit = req.query.limit || 50;
  try {
    // fetch messages from sql
    console.log('query executed', chatId, limit);
    res.status(200).json({ messages: [] });
  } catch (err) {
    console.error('Error executing query', err);
  }
});

// POST /chat/:chatId/message/:messageId/read
app.post('/chat/:chatId/message/:messageId/read', async (req, res) => {
  const { chatId, messageId } = req.params;
  try {
    // update message status in sql
    console.log('query executed', chatId, messageId);
    res.status(200).json({ message: `Message '${messageId}' in chat '${chatId}' marked as read!` });
  } catch (err) {
    console.error('Error executing query', err);
  }
});

// POST /chat/:chatId/lastseen
app.post('/chat/:chatId/lastseen', async (req, res) => {
  const { chatId } = req.params;
  const { userId, timestamp } = req.body;
  try {
    // update last seen in sql
    console.log('query executed', chatId, userId, timestamp);
    res.status(200).json({ message: `Last seen for user '${userId}' in chat '${chatId}' updated!` });
  } catch (err) {
    console.error('Error executing query', err);
  }
});

// GET /user/:userId/chats
app.get('/user/:userId/chats', async (req, res) => {
  const { userId } = req.params;
  try {
    // fetch chats from sql
    console.log('query executed', userId);
    res.status(200).json({ chats: [] });
  } catch (err) {
    console.error('Error executing query', err);
  }
});
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});