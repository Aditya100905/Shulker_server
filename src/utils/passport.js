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
      callbackURL: "http://localhost:5000/api/v1/users/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        let username = profile.displayName;
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
            username = generateRandomUsername(profile.displayName);
            usernameExists = await User.findOne({ username });
            attempt++;
          }
          user = await User.create({
            googleId: profile.id,
            username: username,
            email: email,
            avatar: profile.photos.value,
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

function generateRandomUsername(base) {
  const sanitizedBase = base.replace(/\s+/g, '-').toLowerCase();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${sanitizedBase}-${randomSuffix}`;
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});