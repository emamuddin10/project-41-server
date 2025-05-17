const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const cors = require("cors");
const app = express();
const port = process.env.post || 5000;

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173"],
  })
);

console.log(process.env.DB_user);
const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_pass}@cluster0.v28xn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	
    await client.connect();
    const myDB = client.db("myDB");
    const blogCollection = myDB.collection("blogCollection");
    const wishCollection = myDB.collection("wishCollection");
    const commentCollection = myDB.collection("commentCollection");

    // add blog in DB
    app.post("/addBlog", async (req, res) => {
      const blog = req.body;
      const result = await blogCollection.insertOne(blog);
      res.send(result);
    });

    // get all blogs 
    app.get("/allBlogs", async (req, res) => {
      const result = await blogCollection.find().toArray();
      res.send(result);
    });
    
    // get all feature blogs
    app.get("/allFeaturedBlogs", async (req, res) => {
      const blogs = await blogCollection.find().toArray();

      const topBlogs = blogs
        .map((blog) => ({
          ...blog,
          wordCount: blog.longDescription?.split(" ").length || 0,
        }))
        .sort((a, b) => b.wordCount - a.wordCount)
        .slice(0, 10);

      res.send(topBlogs);
    });

    // blog details 
    app.get("/blogDetails/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await blogCollection.findOne(query);
      res.send(result);
    });

    // delete blog from db
    app.delete("/deleteBlog/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await blogCollection.deleteOne(query);
      res.send(result);
    });

    app.patch('update/:id',async(req,res)=>{
      const id = req.params.id;
      const blog = req.body;
      const query = {_id:new ObjectId(id)};
      const updateDocs = {
        $set: {
          title: blog.title,
          imageUrl: blog.imageUrl,
          shortDesc: blog.shortDesc,
          longDesc: blog.longDesc,
        }
      }
      
      const result = await blogCollection.updateOne(query,updateDocs)
      res.send(result)
    })

    //-------------start the work of wishlist---------//
    app.post("/addWishlist", async (req, res) => {
      const blog = req.body;
      const query = { wishListId: blog?.wishListId };
      const isExit = wishCollection.find(query);
      const user = { userEmail: blog?.userEmail };
      const isUser = wishCollection.find(user);
      if (isExit & isUser) {
        return res.send({ message: "this blog already exist in wishlist" });
      }
      console.log(blog);
      const result = await wishCollection.insertOne(blog);
      res.send(result);
    });

    //  all wishlist data is here
    app.get("/allWishlist", async (req, res) => {
      const result = await wishCollection.find().toArray();
      res.send(result);
    });

    // my wishlist
    app.get("/myWish/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await wishCollection.find(query).toArray();
      res.send(result);
    });

    // delete wishlist
    app.delete("/deleteWish/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await wishCollection.deleteOne(query);
      res.send(result);
    });

    app.post('/comment', async(req,res)=>{
      const comment = req.body;
      const result = await commentCollection.insertOne(comment);
      res.send(result)
    })

    app.get('/getComment',async(req,res)=>{
      const result = await commentCollection.find().toArray();
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("assignment11 is running!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
