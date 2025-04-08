const { DataTypes } = require("sequelize");
const sequelize = require("../DB");

const Products = sequelize.define(
  "Products",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    ProductName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Image: {
      type: DataTypes.STRING, // ✅ Зураг URL эсвэл Base64 хадгалах
      allowNull: true,
    },
    Price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    Qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "Products",
    timestamps: false,
  }
);

module.exports = Products;
