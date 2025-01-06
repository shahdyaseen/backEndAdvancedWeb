const express = require("express");
const { ApolloServer, gql } = require("apollo-server-express");
const mysql = require("mysql2");

const app = express();
const port = 4000;

// إعداد الاتصال بقاعدة البيانات
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "123-abc-ABC**",
  database: "VillageDB",
});

connection.connect();

// تعريف الـ schema
const typeDefs = gql`
  type Village {
    id: ID!
    name: String
    Region: String
    land: Int
    Latitude: Float
    Longitude: Float
    Tags: String
    img: String
    population: Int
    age: String
    gender: String
    growthRate: Float
    Urban: Boolean
  }

  type VillageDetails {
    name: String
    region: String
    landArea: Int
    latitude: Float
    longitude: Float
    tags: String
    img: String
  }

  type Query {
    villages: [Village]
    villageDetails(id: ID!): VillageDetails
  }

  type Mutation {
    deleteVillage(id: ID!): Village
    updateVillage(
      id: ID!
      name: String
      Region: String
      land: Int
      Latitude: Float
      Longitude: Float
      Tags: String
      img: String
      population: Int
      age: String
      gender: String
      growthRate: Float
      Urban: Boolean
    ): Village

    updateDemographicData(
      id: ID!
      population: Int
      age: String
      gender: String
      growthRate: Float
    ): Village

  addVillage(
    name: String
    Region: String
    land: Int
    Latitude: Float
    Longitude: Float
    Tags: String
    img: String
  ): Village


    }
`;

const resolvers = {
  Query: {
    villages: () => {
      return new Promise((resolve, reject) => {
        connection.query("SELECT * FROM Villages", (err, results) => {
          if (err) reject(err);
          resolve(results);
        });
      });
    },
    villageDetails: (_, { id }) => {
      return new Promise((resolve, reject) => {
        connection.query(
          "SELECT name, Region AS region, land AS landArea, Latitude AS latitude, Longitude AS longitude, Tags AS tags, img FROM Villages WHERE id = ?",
          [id],
          (err, results) => {
            if (err) reject(err);
            if (results.length > 0) {
              resolve(results[0]);
            } else {
              resolve(null);
            }
          }
        );
      });
    },
  },
  Mutation: {
    deleteVillage: (_, { id }) => {
      return new Promise((resolve, reject) => {
        connection.query("DELETE FROM Villages WHERE id = ?", [id], (err) => {
          if (err) reject(err);
          resolve({ id });
        });
      });
    },
    updateVillage: (_, args) => {
      const { id, ...updatedFields } = args;
      const fields = Object.keys(updatedFields).filter((key) => updatedFields[key] !== undefined);

      if (fields.length === 0) {
        throw new Error("No fields provided for update");
      }

      const query = `UPDATE Villages SET ${fields.map((key) => `${key} = ?`).join(", ")} WHERE id = ?`;
      const values = fields.map((key) => updatedFields[key]);

      return new Promise((resolve, reject) => {
        connection.query(query, [...values, id], (err) => {
          if (err) reject(err);
          connection.query("SELECT * FROM Villages WHERE id = ?", [id], (err, results) => {
            if (err) reject(err);
            if (results.length > 0) {
              resolve(results[0]);
            } else {
              resolve(null);
            }
          });
        });
      });
    },
    updateDemographicData: (_, { id, population, age, gender, growthRate }) => {
      return new Promise((resolve, reject) => {
        const query = `
          UPDATE Villages 
          SET population = ?, age = ?, gender = ?, growthRate = ? 
          WHERE id = ?`;

        connection.query(query, [population, age, gender, growthRate, id], (err) => {
          if (err) reject(err);
          connection.query("SELECT * FROM Villages WHERE id = ?", [id], (err, results) => {
            if (err) reject(err);
            if (results.length > 0) {
              resolve(results[0]);
            } else {
              resolve(null);
            }
          });
        });
      });
    },




    addVillage: (_, { name, Region, land, Latitude, Longitude, Tags, img }) => {
      return new Promise((resolve, reject) => {
        const query = `
          INSERT INTO Villages (name, Region, land, Latitude, Longitude, Tags, img, population, age, gender, growthRate, Urban)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [
          name, 
          Region, 
          land, 
          Latitude, 
          Longitude, 
          Tags, 
          img, 
          0,  // population
          "", // age
          "", // gender
          1.0, // growthRate
          1    // Urban (افتراضيًا 1 يمكن تحديثه لاحقًا)
        ];
    
        connection.query(query, values, (err, results) => {
          if (err) reject(err);
    
          // إرجاع البيانات المدخلة بعد الإضافة
          const newVillage = {
            id: 10, // الحصول على الـ ID الذي تم إضافته
            name,
            Region,
            land,
            Latitude,
            Longitude,
            Tags,
            img,
            population: 0, // قيمة افتراضية، يمكن تحديثها لاحقًا
            age: "",
            gender: "",
            growthRate: 1.0,
            Urban: true, // افتراضيًا
          };
    
          resolve(newVillage);
        });
      });
    }
    
    

  },
};

// إعداد Apollo Server
const server = new ApolloServer({ typeDefs, resolvers });

async function startServer() {
  await server.start();
  server.applyMiddleware({ app });
  app.listen({ port }, () => {
    console.log(`Server ready at http://localhost:${port}${server.graphqlPath}`);
  });
}

startServer();
