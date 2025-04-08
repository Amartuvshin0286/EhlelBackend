const { DataTypes } = require("sequelize");
const sequelize = require("../DB");

const Login = sequelize.define(
  "Login",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "Login", // ✅ MySQL хүснэгтийн нэртэй ижил тохируулна
    timestamps: false, // ✅ `createdAt`, `updatedAt` ашиглахгүй
  }
);

module.exports = Login;
