import express from 'express';
import authRouter from './routers/auth.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import foodRouter from './routers/food.js';
import unitRouter from './routers/unit.js';
import recipeRouter from './routers/recipe.js';
import categoryRouter from './routers/category.js';

const app = express();

app.use(express.json());

// A secret can be passed in first param...idk what it is.
app.use(cookieParser('cookieSecret'));
app.use(cookieParser());

app.use((req, res, next) => {
  if (req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
});

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  next();
});

const whitelist = ['http://localhost:4200', 'http://127.0.0.1:4200']
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));

app.use('/auth', authRouter);
app.use('/food', foodRouter);
app.use('/unit', unitRouter);
app.use('/recipe', recipeRouter);
app.use('/categories', categoryRouter);

const port = 3000;

app.listen(port)
  .on('listening', () => console.log(`Listeneing on port ${port}`));
