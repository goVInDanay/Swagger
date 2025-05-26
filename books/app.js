const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());
const SECRET = process.env.SECRET_KEY;
const books = [];
const usersBooks = {}; 
function authenticate(req, res, next) {
  const token = req.headers['authorization'];
  if (!token){
    return res.sendStatus(401);
  }
  try {
    const payload = jwt.verify(token, SECRET);
    req.user = payload;
    next();
  }
  catch(error){
    return res.sendStatus(403);
  }
}

app.get('/BookStore/v1/Books', (req, res) => {
  res.json({books});
});
app.get('/BookStore/v1/Book', (req, res) => {
  const book = books.find(b => b.isbn === req.query.ISBN);
  if(!book){
    return res.sendStatus(404);
  }
  res.json(book);
});

app.post('/BookStore/v1/Books', authenticate, (req, res) => {
  const userID = req.user.userId;
  const {isbns} = req.body;
  if(!usersBooks[userID]){
    usersBooks[userID] = [];
  }
  isbns.forEach(({ isbn }) => {
    const book = books.find(b => b.isbn === isbn);
    if(book && !usersBooks[userID].find(b => b.isbn === isbn)){
      usersBooks[userID].push(book);
    }
  });
  res.status(201).json({ books: usersBooks[userID] });
});

app.delete('/BookStore/v1/Book', authenticate, (req, res) => {
  const userID = req.user.userId;
  const { isbn, userId } = req.body;
  if (userId !== userID){
    return res.sendStatus(403);
  }
  if(!usersBooks[userID]){
    return res.sendStatus(404);
  }
  usersBooks[userID] = usersBooks[userID].filter(b => b.isbn !== isbn);
  res.sendStatus(204);
});

app.delete('/BookStore/v1/Books', authenticate, (req, res) => {
  const userID = req.user.userId;
  const { userId } = req.body;
  if (userId !== userID){
    return res.sendStatus(403);
  }
  usersBooks[userID] = [];
  res.sendStatus(204);
});

app.listen(3002, () => {
  console.log('Book service running on port 3002');
});
