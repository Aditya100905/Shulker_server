import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/user.model.js";
import dotenv from 'dotenv';
dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/api/v1/users/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        let username = email.split("@")[0];

        let user = await User.findOne({
          $or: [
            { googleId: profile.id },
            { email: email }
          ]
        });

        if (!user) {
          let usernameExists = await User.findOne({ username });
          let attempt = 0;
          while (usernameExists && attempt < 5) {
            username = `${email.split("@")[0]}${Math.floor(1000 + Math.random() * 9000)}`;
            usernameExists = await User.findOne({ username });
            attempt++;
          }

          const names = profile.displayName ? profile.displayName.split(" ") : [];
          const firstname = "user_";
          const lastname = username;

          user = await User.create({
            googleId: profile.id,
            username: username,
            email: email,
            avatar: profile.photos?.[0]?.value || null,
            firstname: firstname,
            lastname: lastname
          });
        } else {
          if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
          }
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});