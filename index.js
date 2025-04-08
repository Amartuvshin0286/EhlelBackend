const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const { buildSchema } = require("graphql");
const sequelize = require("./DB");
const Company = require("./Models/Company");
const Order = require("./Models/Order");
const Products = require("./Models/Product");
const Login = require("./Models/Login");
const { ApolloError } = require("apollo-server");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Express сервер үүсгэх
const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// **📌 GraphQL схем**
const schema = buildSchema(`
  type Company {
    id: ID!
    CompanyName: String!
    Store: String!
    Register: String!
    Phone: String!
    created_at: String!
  }

  type Order {
    id: ID!
    OrderGroup: String!
    Products: String!
    Qty: Int!
    Price: Float!
    TotalPrice: Float!
    OrderDate: String
    Store: String!
  }

  type Products {
    id: ID!
    ProductName: String!
    Image: String
    Price: Float!
    Qty: Int!
    Comment: String
  }

  type Login {
    id: ID!
    username: String!
    password: String!
  }

  type AuthPayload {
    token: String!
    user: Login!
  }

  type Query {
    companies: [Company]
    orders: [Order]
    products: [Products]
    company(id: ID!): Company
  }

  type Mutation {
    addCompany(CompanyName: String!, Store: String!, Register: String!, Phone: String!): Company
    deleteCompany(id: ID!): Boolean
    updateCompany(id: ID!, CompanyName: String, Store: String, Register: String, Phone: String): Company
    addOrder(Products: String!, Qty: Int!, Price: Float!, Store: String!, OrderGroup: String!): Order
    addProduct(ProductName: String!, Image: String, Price: Float!, Qty: Int!, Comment: String): Products
    updateProduct(id: ID!, ProductName: String, Image: String, Price: Float, Qty: Int, Comment: String): Products
    deleteProduct(id: ID!): Boolean
    register(username: String!, password: String!): Login
    login(username: String!, password: String!): AuthPayload
  }
`);

// **📌 Resolvers**
const root = {
  companies: async () => {
    console.log("📦 Компаниудын жагсаалтыг татаж байна...");
    return await Company.findAll();
  },
  orders: async () => {
    console.log("📦 Захиалгуудыг татаж байна...");

    return await Order.findAll({
      order: [["OrderDate", "DESC"]], // ✅ `OrderDate`-г буурахаар эрэмбэлэх (DESC)
    });
  },

  products: async () => {
    console.log("📦 Бүтээгдэхүүнүүдийг татаж байна...");
    return await Products.findAll();
  },

  company: async ({ id }) => {
    console.log(`🔍 Компани хайж байна: ID=${id}`);
    return (await Company.findByPk(id)) || new Error("Company not found");
  },

  addCompany: async ({ CompanyName, Store, Register, Phone }) => {
    console.log(`➕ Компани нэмэгдэж байна: ${CompanyName}`);
    return await Company.create({ CompanyName, Store, Register, Phone });
  },

  updateCompany: async ({ id, CompanyName, Store, Register, Phone }) => {
    console.log("📌 Updating Company ID:", id);

    if (!id) {
      console.log("❌ Компаний ID байхгүй байна!");
      throw new Error("Компаний ID заавал шаардлагатай!");
    }

    try {
      console.log("🔍 Компани шинэчилж байна...");

      // ID-аар компанийн мэдээллийг хайж олох
      const company = await Company.findByPk(id);

      if (!company) {
        console.log("❌ Компани олдсонгүй.");
        return null;
      }

      // Компани шинэчлэх
      await company.update({
        CompanyName,
        Store,
        Register,
        Phone,
      });

      console.log("✅ Компани амжилттай шинэчлэгдлээ:", company);
      return company;
    } catch (error) {
      console.error("❌ Компани шинэчлэхэд алдаа гарлаа:", error);
      throw new Error("Серверийн алдаа: Компани шинэчлэх боломжгүй.");
    }
  },

  addOrder: async (args) => {
    console.log("Received args in resolver:", args);
    const { Products, Qty, Price, Store, OrderGroup } = args;

    if (!Products || !Qty || !Price || !Store || !OrderGroup) {
      throw new ApolloError("Бүх талбаруудыг бөглөнө үү", "MISSING_FIELDS");
    }

    const TotalPrice = Price * Qty;

    try {
      const newOrder = await Order.create({
        Products,
        Qty,
        Price,
        TotalPrice,
        Store,
        OrderDate: new Date(),
        OrderGroup,
      });
      return newOrder;
    } catch (error) {
      console.error("addOrder resolver-д алдаа гарлаа:", error);
      throw new ApolloError(
        `Захиалга нэмэхэд алдаа гарлаа: ${error.message}`,
        error.code || "ADD_ORDER_ERROR"
      );
    }
  },

  deleteCompany: async ({ id }) => {
    try {
      console.log(`🗑 Компани устгаж байна: ID=${id}`);
      const company = await Company.findByPk(id);
      if (!company) {
        console.error(`❌ Компани олдсонгүй: ID=${id}`);
        return false;
      }
      await company.destroy();
      console.log(`✅ Компани амжилттай устгалаа: ID=${id}`);
      return true;
    } catch (error) {
      console.error("❌ Компани устгах үед алдаа гарлаа:", error);
      return false;
    }
  },

  updateProduct: async ({ id, ProductName, Image, Price, Qty, Comment }) => {
    console.log("📌 Received ID:", id); // ✅ ID зөв ирж байгаа эсэхийг шалгах
    if (!id) {
      console.log("❌ ID олдсонгүй!");
      throw new Error("❌ ID байхгүй байна!");
    }

    try {
      console.log("🔍 Updating Product with ID:", id);

      // ID-аар бүтээгдэхүүнийг хайх
      const product = await Products.findByPk(id);

      if (!product) {
        console.log("❌ Бүтээгдэхүүн олдсонгүй.");
        return null;
      }

      // Өгөгдлийг шинэчлэх
      await product.update({
        ProductName,
        Image,
        Price,
        Qty,
        Comment,
      });

      console.log("✅ Амжилттай шинэчлэгдлээ:", product);
      return product;
    } catch (error) {
      console.error("❌ Хадгалах явцад алдаа гарлаа:", error);
      throw new Error("Серверийн алдаа: Хадгалах боломжгүй.");
    }
  },

  addProduct: async ({ ProductName, Image, Price, Qty, Comment }) => {
    console.log("📌 `addProduct` Mutation дуудагдсан!");
    console.log("📦 Өгөгдөл:", { ProductName, Image, Price, Qty, Comment });

    try {
      const newProduct = await Products.create({
        // ✅ `Product.create()` биш `Products.create()`
        ProductName,
        Image,
        Price,
        Qty,
        Comment,
      });

      console.log("✅ Бүтээгдэхүүн амжилттай нэмэгдлээ:", newProduct);
      return newProduct;
    } catch (error) {
      console.error("❌ Бүтээгдэхүүн нэмэхэд алдаа гарлаа:", error);
      throw new Error("Серверийн алдаа: Бүтээгдэхүүн нэмэх боломжгүй.");
    }
  },

  deleteProduct: async ({ id }) => {
    try {
      console.log(`🗑️ Бүтээгдэхүүн устгаж байна: ID=${id}`);
      const product = await Products.findByPk(id);
      if (!product) {
        console.error(`❌ Бүтээгдэхүүн олдсонгүй: ID=${id}`);
        return false;
      }
      await product.destroy();
      console.log(`✅ Бүтээгдэхүүн устгалаа: ID=${id}`);
      return true;
    } catch (error) {
      console.error("❌ Бүтээгдэхүүн устгах үед алдаа гарлаа:", error);
      return false;
    }
  },

  // 🔥 **User Authentication**
  register: async ({ username, password }) => {
    try {
      console.log(`🔐 Хэрэглэгч бүртгэж байна: ${username}`);
      const existingUser = await Login.findOne({ where: { username } });
      if (existingUser) {
        console.error(`⚠️ Хэрэглэгч бүртгэгдсэн байна!`);
        throw new Error("⚠️ Хэрэглэгч бүртгэгдсэн байна!");
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await Login.create({ username, password: hashedPassword });
      console.log(`✅ Хэрэглэгч амжилттай бүртгэгдлээ: ${username}`);
      return user;
    } catch (error) {
      console.error("❌ Хэрэглэгч бүртгэх үед алдаа гарлаа:", error);
      throw new Error("⚠️ Бүртгэл хийх үед алдаа гарлаа.");
    }
  },

  login: async ({ username, password }) => {
    try {
      console.log(`🟢 Нэвтрэх оролдлого хийж байна: ${username}`);
      const user = await Login.findOne({ where: { username } });

      if (!user) {
        console.error(`❌ Хэрэглэгч олдсонгүй: ${username}`);
        throw new Error("Хэрэглэгч олдсонгүй!");
      }

      console.log(`🟢 Өгөгдлийн санд олдсон хэрэглэгч:`, user);

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        console.error(`❌ Нууц үг буруу!`);
        throw new Error("Нууц үг буруу!");
      }

      const token = jwt.sign(
        { userId: user.id },
        process.env.SECRET_KEY || "DEFAULT_SECRET",
        { expiresIn: "1h" }
      );

      console.log(`✅ Амжилттай нэвтэрлээ!`);
      return { token, user };
    } catch (error) {
      console.error("❌ Нэвтрэх үед алдаа гарлаа:", error);
      throw new Error("Нэвтрэх үед алдаа гарлаа.");
    }
  },
};

// **GraphQL Server**
app.use(
  "/graphql",
  graphqlHTTP({
    schema,
    rootValue: root,
    graphiql: true,
  })
);

// **Сервер ажиллуулах**
app.listen(4001, async () => {
  console.log("🚀 Server running at http://192.168.1.4:4001/graphql");
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected.");
    await sequelize.sync();
    console.log("✅ Database synchronized.");
  } catch (error) {
    console.error("❌ Database connection error:", error);
  }
});
