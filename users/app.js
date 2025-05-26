const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const app = express();
app.use(bodyParser.json());
const SECRET = process.env.SECRET_KEY;
const users = [];

function generateToken(user) {
  return jwt.sign({ userId: user.userID, username: user.username }, SECRET, { expiresIn: '10h' });
}
app.post('/Account/v1/User', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password){
    return res.status(400).json({ message: 'Username and password required' });
  }
  const user = users.find(u => u.username === username);
  if (user){
    return res.status(400).json({ message: 'User already exists' });
  }
  const pass = bcrypt.hashSync(password, 8);
  const us = {userID: uuidv4(), username: username, password: pass, books: []};
  users.push(us);
  res.status(201).json({ userID: user.userID, username: user.username });
})

app.post('/Account/v1/GenerateToken', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ token: null, status: 'Failed', result: 'Invalid username or password' });
  }
  const token = generateToken(user);
  res.json({ token, status: 'Success', result: 'User authorization complete' });
});

app.post('/Account/v1/Authorized', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.sendStatus(401);
  }
  res.sendStatus(200);
});

app.get('/Account/v1/User/:uuid', (req, res) => {
  const token = req.headers['authorization'];
  if (!token){
    return res.sendStatus(401);
  }
  try {
    jwt.verify(token, SECRET);
  }
  catch(error){
    return res.sendStatus(403);
  }
  const user = users.find(u => u.userID === req.params.uuid);
  if (!user){
    return res.sendStatus(404);
  }
  res.json({ userID: user.userID, username: user.username, books: user.books });
});

app.delete('/Account/v1/User/:uuid', (req, res) => {
  const token = req.headers['authorization'];
  if (!token){
    return res.sendStatus(401);
  }
  try {
    jwt.verify(token, SECRET);
  }
  catch(error){
    return res.sendStatus(403);
  }
  const location = users.findIndex(u => u.userID === req.params.uuid);
  if (location === -1){
    return res.sendStatus(404);
  }
  users.splice(location, 1);
  res.sendStatus(204);
});

app.listen(3001, () => {
  console.log('User service running on port 3001');
});
