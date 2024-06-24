require('dotenv').config();

const Sequelize = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT,
  operatorsAliases: false,

  pool: {
    max: parseInt(process.env.DB_POOL_MAX),
    min: parseInt(process.env.DB_POOL_MIN),
    acquire: parseInt(process.env.DB_POOL_ACQUIRE),
    idle: parseInt(process.env.DB_POOL_IDLE)
  }
});

sequelize.authenticate()
  .then(() => console.log('Database connected...'))
  .catch(err => console.log('Error: ' + err))