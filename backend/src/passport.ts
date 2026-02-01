import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import User from "./models/User";
import { Profile } from "passport";

export function initPassport() {
  // ---------- GOOGLE ----------
  if (
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CALLBACK_URL
  ) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        async (
  _accessToken: string,
  _refreshToken: string,
  profile: Profile,
  done: (err: any, user?: any) => void
) =>  {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(new Error("No email from Google"), undefined);
            }

            let user = await User.findOne({ email });
            if (!user) {
              user = await User.create({
                name: profile.displayName,
                email,
                provider: "google",
                providerId: profile.id,
              });
            }

            done(null, user);
          } catch (err) {
            done(err, undefined);
          }
        }
      )
    );

    console.log("✅ Google OAuth enabled");
  } else {
    console.warn("⚠️ Google OAuth disabled (env vars missing)");
  }

  // ---------- GITHUB ----------
  if (
    process.env.GITHUB_CLIENT_ID &&
    process.env.GITHUB_CLIENT_SECRET &&
    process.env.GITHUB_CALLBACK_URL
  ) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          callbackURL: process.env.GITHUB_CALLBACK_URL,
        },
        async (
  _accessToken: string,
  _refreshToken: string,
  profile: Profile,
  done: (err: any, user?: any) => void
) => {
          try {
            const email =
              profile.emails?.[0]?.value ??
              `${profile.username}@github.local`;

            let user = await User.findOne({ email });
            if (!user) {
              user = await User.create({
                name: profile.displayName || profile.username,
                email,
                provider: "github",
                providerId: profile.id,
              });
            }

            done(null, user);
          } catch (err) {
            done(err, undefined);
          }
        }
      )
    );

    console.log("✅ GitHub OAuth enabled");
  } else {
    console.warn("⚠️ GitHub OAuth disabled (env vars missing)");
  }

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
}

export default passport;

