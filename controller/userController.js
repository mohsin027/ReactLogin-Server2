const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const secret = "secret";
const userModel = require("../model/userModel");

module.exports = {
  postSignup: async (req, res) => {
    try {
      console.log(req.body);
      let { name, email, password } = req.body;
      const oldUser = await userModel.findOne({ email });
      if (oldUser) {
        res.json({ err: true, message: "User already exsist" });
      } else {
        let bcrypPassword = await bcrypt.hash(password, 10);
        let user = await userModel.create({
          name,
          email,
          password: bcrypPassword,
        });

        console.log(user);
        const token = jwt.sign(
          {
            id: user._id,
          },
          secret
        );
        console.log(token);
        return res
          .cookie("token", token, {
            httpOnly: true,
            secure: true,
            maxAge: 1000 * 60 * 60 * 24 * 7,
            sameSite: "none",
          })
          .json({ err: false, message: "User registration success" });
      }
    } catch (error) {
      console.log(error);
    }
  },
  postLogin: async (req, res) => {
    let { email, password } = req.body;
    let user = await userModel.findOne({ email: email });
    if (user) {
      let status = await bcrypt.compare(password, user.password);
      if (status) {
        const token = jwt.sign(
          {
            id: user._id,
          },
          secret
        );
        return res
          .cookie("token", token, {
            httpOnly: true,
            secure: true,
            maxAge: 1000 * 60 * 60 * 24 * 7,
            sameSite: "none",
          })
          .json({ err: false, message: "User login success" });
      } else {
        res.json({ err: true, message: "Invalid email or password" });
      }
    } else {
      res.json({ err: true, message: "No user found, please signup." });
    }
  },
  getLogout: (req, res) => {
    return res
      .cookie("token", "", {
        httpOnly: true,
        secure: true,
        maxAge: 1000 * 60 * 60 * 24 * 7,
        sameSite: "none",
      })
      .json({ err: false, message: "Logged out successfully" });
  },

  checkAuth: async (req, res) => {
    const token = req.cookies.token;
    if (token) {
      const verifyJwt = jwt.verify(token, secret);
      const user = await userModel.findById(verifyJwt.id, { password: 0 });
      res.json({ logged: true, details: user });
    } else {
      res.json({ logged: false, err: true, message: "No token" });
    }
  },
  editProfile: async (req, res) => {
    await userModel
      .updateMany(
        { _id: req.body.id },
        {
          $set: {
            name: req.body.name,
            image: req.file,
          },
        }
      )
      .then((result) => {
        res.json({ result, err: false, message: "profile updated" });
      })
      .catch((err) => {
        console.log(err);
        res.json({ err: true, message: "error occured" });
      });
  },
  googleAuthRedirect: async (req, res) => {
    console.log("redirected to google");
    try {
      const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
      const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
      const REDIRECT_URI = process.env.SERVER_URL + "/auth/callback";
      const { code } = req.query;
      const tokenResponse = await axios.post(
        "https://oauth2.googleapis.com/token",
        {
          code,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
        }
      );

      const { access_token, id_token } = tokenResponse.data;
      const userInfo = await axios.get(
        `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`
      );

      const user = {
        email: userInfo.data.email,
        name: userInfo.data.name,
        picture: userInfo.data.picture,
      };
      console.log(user,'user info');

      let newUser = await userModel.findOne({ email: user.email });

      if (!newUser) {
        newUser = await userModel.create({
          email: user.email,
          image: { url: user.picture, secure_url: user.picture },
          name: user.name,
        });
      } 

      const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET_KEY);
      console.log(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
      res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
    } catch (error) {
      console.log("Google authentication error:", error);
      res.json({ err: true, error, message: "Google Authentication failed" });
    }
  },
  verifyGAuth:async (req, res)=>{
    console.log('verifygauth');
    try {
      const token = req.query.token;
      if (!token) {
        return res.json({ loggedIn: false, err: true, message: "no token" });
      }
      const verifiedJWT = jwt.verify(token, process.env.JWT_SECRET_KEY);
      if (!verifiedJWT) {
        return res.json({ loggedIn: false, err: true, message: "no token" });
      }
      const user = await userModel.findById(verifiedJWT.id, { password: 0 });
      if (!user) {
        return res.json({ loggedIn: false, err: true, message: "no user found" });
      }
    //   if (user.block) {
    //     return res.json({ loggedIn: false, err: true, message: "user blocked" });
    //   }
    console.log('gauth verify controller');
      return res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          maxAge: 1000 * 60 * 60 * 24 * 7 * 30,
          sameSite: "none",
        })
        .json({ err: false, user: user._id, token });
    } catch (error) {
      console.log("Google authentication failed:", error);
      res.json({ err: true, error, message: "Google Authentication failed" });
    }
  }
};
