const { DataTypes } = require("sequelize");
const sequelize = require("../DB");

const Company = sequelize.define("Company", {
  CompanyName: { type: DataTypes.STRING, allowNull: false },
  Store: { type: DataTypes.STRING, allowNull: false },
  Register: { type: DataTypes.STRING, allowNull: false },
  Phone: { type: DataTypes.STRING, allowNull: false },
});

module.exports = Company;
