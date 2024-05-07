const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// edit User
router.put("/:id", upload.single("profilePicture"), async (req, res) => {
  try {
    console.log("reqbody:", req.body);
    const { userId, username, password, desc, city, from } = req.body;
    const profilePicture = req.file;
    console.log("propic", profilePicture);
    const profilePicturePath = profilePicture.path;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json("User not found");
    }

    // Assuming isAdmin is defined somewhere in your code
    if (userId !== req.params.id && !isAdmin) {
      return res.status(403).json("You can only update your own account");
    }

    let newPasswordHash = user.password; // Initialize with existing password hash
    if (password) {
      // Hash the new password if provided
      const salt = await bcrypt.genSalt(10);
      newPasswordHash = await bcrypt.hash(password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, {
      username,
      password: newPasswordHash, // Update password field with new hash
      desc,
      city,
      from,
      profilePicture: profilePicturePath, // Update profilePicture field with file path
    });

    res.status(200).json("Account has been updated");
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal Server Error");
  }
});

// Delete User

router.delete("/:id", async (req, res) => {
  try {
    const deleteUser = await User.findByIdAndDelete(req.params.id);

    if (!deleteUser) {
      return res.status(404).json("User not found");
    }

    res.status(200).json("Account has been Deleted");
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal Server Error");
  }
});

// get User

router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.status(200).json(user);
    console.log(user);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Follow User
// router.put("/:id/follow", async (req, res) => {
//   if (req.body.userId !== req.params.id) {
//     try {
//       const user = await User.findById(req.params.id);
//       const currentUser = await User.findById(req.body.userId);
//       if (!user.followers.includes(currentUser.username)) {
//         await user.updateOne({ $push: { followers: currentUser.username } });
//         await currentUser.updateOne({ $push: { following: user.username } });
//         res.status(200).json("user has been followed");
//       } else {
//         res.status(402).json("You already Follow");
//       }
//     } catch (err) {
//       res.status(500).json(err);
//     }
//   } else {
//     res.status(403).json("You Cant Follow Your Self");
//   }
// });
router.put("/:id/follow", async (req, res) => {
  if (req.body.userId !== req.params.id) {
    try {
      const user = await User.findById(req.params.id);
      const currentUser = await User.findById(req.body.userId);

      // Check if the currentUser is already following the user
      const isAlreadyFollowing = user.followers.some(
        (follower) => follower.userId.toString() === currentUser._id.toString()
      );

      if (!isAlreadyFollowing) {
        const followerObject = {
          userId: currentUser._id,
          username: currentUser.username,
        };

        await user.updateOne({ $push: { followers: followerObject } });
        await currentUser.updateOne({
          $push: { following: { userId: user._id, username: user.username } },
        });

        res.status(200).json("User has been followed");
      } else {
        res.status(402).json("You are already following this user");
      }
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(403).json("You can't follow yourself");
  }
});

//get friends

router.get("/:userId/friends", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const friends = await Promise.all(
      user.following.map(({ userId }) => User.findById(userId))
    );

    const friendList = friends
      .map((friend) => {
        if (friend) {
          const { _id, username, profilePicture } = friend;
          return { _id, username, profilePicture };
        }
        return null;
      })
      .filter((friend) => friend !== null); // Filter out any null values resulting from non-existent userIds

    res.status(200).json(friendList);
  } catch (err) {
    console.error("Error fetching user's friends:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// unfollow user
router.put("/:id/unfollow", async (req, res) => {
  console.log(req.body);
  console.log(req.params.id);
  if (req.body.userId !== req.params.id) {
    try {
      const user = await User.findById(req.params.id);
      const currentUser = await User.findById(req.body.userId);

      // Check if the currentUser is following the user
      const isFollowing = user.followers.some(
        (follower) => follower.userId.toString() === currentUser._id.toString()
      );

      if (isFollowing) {
        // Remove the follower from the followers array
        await user.updateOne({
          $pull: { followers: { userId: currentUser._id } },
        });
        // Remove the user from the following array of currentUser
        await currentUser.updateOne({
          $pull: { following: { userId: user._id } },
        });

        res.status(200).json("User has been unfollowed");
      } else {
        res.status(402).json("You are not following this user");
      }
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(403).json("You can't unfollow yourself");
  }
});

module.exports = router;
