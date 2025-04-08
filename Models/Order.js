const { DataTypes } = require("sequelize");
const sequelize = require("../DB");

const Order = sequelize.define(
  "Orders",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    Products: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    TotalPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    OrderDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    Store: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    OrderGroup: {
      // Энд шинэ талбар нэмэгдэж байна
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: false, // ❌ createdAt, updatedAt баганыг автоматаар үүсгэхээс сэргийлнэ
  }
);

module.exports = Order;
