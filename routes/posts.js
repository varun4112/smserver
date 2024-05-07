const router = require("express").Router();
const Post = require("../models/Post");
const User = require("../models/User");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// create Post
router.post("/", upload.single("file"), async (req, res) => {
  console.log("reqbody:", req.body);
  const { userId, username, title, desc, community } = req.body;
  const file = req.file;

  const newPost = new Post({
    userId,
    username,
    title,
    desc,
    community,
    file: file.path,
  });

  try {
    const savedPost = await newPost.save();
    res.status(200).json(savedPost);
  } catch (err) {
    res.status(500).json(err);
  }
});

// // update Post
// router.put("/:id", async (req, res) => {
//   try {
//     const post = await Post.findById(req.params.id);
//     if (post.userId == req.body.userId) {
//       await Post.updateOne({ $set: req.body });
//       res.status(200).json("The Post Has Been Updated");
//     } else {
//       res.status(403).json("you can only update your own Posts ");
//     }
//   } catch (err) {
//     res.status(500).json(err);
//   }
// });

// Update post
router.put("/:id", upload.single("file"), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    console.log(post);
    console.log("reqbody:", req.body);
    if (!post) {
      return res.status(404).json("Post not found");
    }

    if (post.userId == req.body.userId) {
      // Check if the user is authorized to update the post
      const { title, desc } = req.body;
      const file = req.file; // Corrected to req.file to get uploaded file object
      console.log("file", file);
      if (!file) {
        // Check if a file was uploaded
        return res.status(400).json("File not provided");
      }
      const filePath = file.path; // Get file path
      console.log("filepath", filePath);

      // Update the post with the provided fields including the file path
      await Post.findByIdAndUpdate(req.params.id, {
        title,
        desc,
        file: filePath,
      });
      res.status(200).json("The Post Has Been Updated");
    } else {
      res.status(403).json("You can only update your own Posts");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// delete Post
router.delete("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.userId == req.body.userId) {
      await Post.findByIdAndDelete(req.params.id);
      res.status(200).json("The Post Has Been Deleted");
    } else {
      res.status(403).json("you can only Delete your own Posts ");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// like Post
router.put("/:id/like", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json("Post not found");
    }

    if (post.likes.includes(req.body.userId)) {
      await post.updateOne({ $pull: { likes: req.body.userId } });
      res.status(200).json("the Post has Been Disliked");
    } else {
      await post.updateOne({ $push: { likes: req.body.userId } });
      res.status(200).json("The post has been liked");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Internal Server Error");
  }
});

// Dislike
router.put("/:id/dislike", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.likes.includes(req.body.userId)) {
      await post.updateOne({ $pull: { likes: req.body.userId } });
      res.status(200).json("the Post has Been Disliked");
    } else {
      res.status(401).json("the Post Already  disliked");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// get Post
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.find(req.params.id);
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get("/:userId/user", async (req, res) => {
  try {
    const posts = await Post.find({ userId: req.params.userId });
    res.status(200).json(posts);
    console.log(posts);
  } catch (err) {
    res.status(500).json(err);
  }
});

// comment
router.put("/:id/comment", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json("Post not found");
    } else {
      const commentObject = {
        userId: req.body.userId,
        username: req.body.username,
        comment: req.body.comment,
      };
      await post.updateOne({ $push: { comments: commentObject } });
      res.status(200).json("The post has been liked");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Internal Server Error");
  }
});

// get timeline
// router.get("/timeline/all", async (req, res) => {
//   try {
//     const currentUser = await User.findById(req.query.userId); // Use req.query.userId
//     const userPosts = await Post.find({ userId: currentUser._id });
//     const friendPosts = await Promise.all(
//       currentUser.following.map(async (friendId) => {
//         return Post.find({ userId: friendId });
//       })
//     );
//     const timelinePosts = userPosts.concat(...friendPosts);
//     res.status(200).json(timelinePosts);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json(err);
//   }
// });
router.get("/timeline/all", async (req, res) => {
  try {
    const currentUser = await User.findById(req.query.userId);

    // Extracting userIds from the following array
    const friendIds = currentUser.following.map((friend) => friend.userId);

    // Find posts of the current user
    const userPosts = await Post.find({ userId: currentUser._id });

    // Find posts of friends
    const friendPosts = await Promise.all(
      friendIds.map(async (friendId) => {
        return Post.find({ userId: friendId });
      })
    );

    // Concatenate posts of user and friends
    const timelinePosts = userPosts.concat(...friendPosts);

    res.status(200).json(timelinePosts);
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

// get all posts
router.get("/getall/all", async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
