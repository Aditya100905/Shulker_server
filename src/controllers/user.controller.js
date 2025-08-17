import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";
import { cookiesOptions } from "../utils/cookiesOptions.js";
import cloudinary from "../utils/cloudinary.js";
import streamifier from "streamifier";

const generateAccessAndRefreshToken = async (id) => {
  try {
    console.log("User ID received for token generation:", id);

    const user = await User.findById(id);
    if (!user) {
      throw new ApiError("User not found", 404);
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error generating tokens:", error);
    throw new ApiError("Error creating access and refresh token", 500);
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    throw new ApiError("All fields are required", 400);
  }

  const existedUser = await User.findOne({ email });
  if (existedUser) {
    throw new ApiError("Email already exists", 409);
  }

  const duplicateUsername = await User.findOne({ username });
  if (duplicateUsername) {
    throw new ApiError("Username already exists", 409);
  }

  const user = await User.create({
    username: username.toLowerCase(),
    email,
    password,
    firstname: "user_",
    lastname: username.toLowerCase(),
    avatar: process.env.BACKEND_URL + "/uploads/profile/avatar/default.webp",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError("User creation failed", 500);
  }

  return res
    .status(201)
    .json(new ApiResponse("User registered Successfully", 200, createdUser));
});

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username && !email) {
    throw new ApiError("Username or Email is required", 400);
  }
  const user = await User.findOne({
    $or: [
      { username: username?.toLowerCase() },
      { email: email?.toLowerCase() },
    ],
  });
  if (!user) {
    throw new ApiError("Invalid username or email", 401);
  }

  const isValidPassword = await user.isPasswordCorrect(password);
  if (!isValidPassword) {
    throw new ApiError("Invalid credentials", 401);
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  const loggedInUser = await User.findByIdAndUpdate(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookiesOptions)
    .cookie("refreshToken", refreshToken, cookiesOptions)
    .json(
      new ApiResponse("User logged in Successfully", 200, {
        user: loggedInUser,
        accessToken,
        refreshToken,
      })
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  try {
    console.log("Logout request received:", req.user);
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $unset: {
          refreshToken: 1,
        },
      },
      {
        new: true,
      }
    );

    return res
      .status(200)
      .clearCookie("accessToken", cookiesOptions)
      .clearCookie("refreshToken", cookiesOptions)
      .json(new ApiResponse("User logged out Successfully", 200));
  } catch (error) {
    console.error("Error during logout:", error);
    throw new ApiError("Logout failed", 500);
  }
});

const refreshAccessToken = asyncHandler(async (req, res) => {

  const incommingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incommingRefreshToken) {
    throw new ApiError("Refresh Token expired", 401);
  }
  const decoded = await jwt.verify(
    incommingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  try {
    const user = await User.findById(decoded._id);

    if (!user) {
      throw new ApiError("Refresh Token expired", 401);
    }
    if (incommingRefreshToken != user?.refreshToken) {
      throw new ApiError("Refresh Token expired", 401);
    }
    const { newAccessToken, newRefreshToken } = generateAccessAndRefreshToken(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", newAccessToken, cookiesOptions)
      .cookie("refreshToken", newRefreshToken, cookiesOptions)
      .json(
        new ApiResponse(
          {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          },
          200
        )
      );
  } catch (error) {
    throw new ApiError(error?.message || "Invalid Refresh Token", 401);
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError("User not found", 404);
  }
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  return res.status(200).json(
    new ApiResponse(
      {
        message: "Password changed successfully",
      },
      200
    )
  );
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user
    = await User.findById(req.user._id).select("-password -refreshToken");
  if (!user) {
    throw new ApiError("User not found", 404);
  }
  return res.status(200).json(
    new ApiResponse(
      {
        user,
      },
      200
    )
  );
}
);

const forgotPassword = asyncHandler(async (req, res) => {
  try {
    console.log("Forgot password request received:", req.body);

    const { email } = req.body;
    if (!email) {
      throw new ApiError("Email is required", 400);
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError("User not found", 404);
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const message = `Click the link below to reset your password: \n\n${resetUrl}\n\nThis link is valid for 10 minutes.`;

    await sendEmail({
      email: email,
      subject: "Password Reset",
      message,
    });

    console.log("Email sent successfully");

    res
      .status(200)
      .json(new ApiResponse({ message: "Password reset email sent" }, 200));
  } catch (error) {
    console.error("Forgot password error:", error);
    throw new ApiError("Something went wrong. Try again later.", 500);
  }
});

const googleAuthCallback = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }

    // Generate tokens
    const accessToken = req.user.generateAccessToken();
    const refreshToken = req.user.generateRefreshToken();

    // Save refresh token in DB
    req.user.refreshToken = refreshToken;
    await req.user.save({ validateBeforeSave: false });

    // Redirect to frontend with tokens
    res.redirect(
      `${process.env.FRONTEND_URL}/auth-success?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );
  } catch (error) {
    console.error("Google Auth Callback Error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
  }
};

const updateAvatar = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.file) {
      throw new ApiError("No file uploaded", 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError("User not found", 404);
    }

    // Delete old avatar from Cloudinary (if not default)
    if (user.avatarId && !user.avatar.includes("default.webp")) {
      try {
        await cloudinary.uploader.destroy(user.avatarId);
      } catch (err) {
        console.error("Error deleting old avatar:", err.message);
      }
    }

    // Upload new avatar to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "avatars",
        format: "webp",
        transformation: [{ width: 300, height: 300, crop: "fill" }],
      },
      async (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          throw new ApiError("Failed to upload avatar", 500);
        }

        // Save new avatar
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          { avatar: result.secure_url, avatarId: result.public_id },
          { new: true, select: "-password -refreshToken" }
        );

        return res
          .status(200)
          .json(new ApiResponse("Avatar updated successfully", 200, updatedUser));
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  } catch (error) {
    console.error("Update Avatar Error:", error);
    return res.status(500).json(new ApiResponse("Failed to update avatar", 500));
  }
});

const editUserProfile = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    // first name , last name, bio, dob
    const { firstname, lastname, bio, dob } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { firstname, lastname, bio, dob },
      { new: true, select: "-password -refreshToken" }
    );
    if (!updatedUser) {
      throw new ApiError("User not found", 404);
    }
    return res
      .status(200)
      .json(new ApiResponse("User profile updated successfully", 200, updatedUser));
  } catch (error) {
    console.error("Error updating user profile:", error);
    return res
      .status(500)
      .json(new ApiResponse("Error updating user profile", 500));
  }
});

const changePassword = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new ApiError("Current password and new password are required", 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError("User not found", 404);
    }

    const isMatch = await user.isPasswordCorrect(currentPassword);
    if (!isMatch) {
      throw new ApiError("Current password is incorrect", 401);
    }

    user.password = newPassword;
    await user.save();

    return res
      .status(200)
      .json(new ApiResponse("Password changed successfully", 200));
  } catch (error) {
    console.error("Error changing password:", error);
    return res
      .status(500)
      .json(new ApiResponse("Error changing password", 500));
  }
});

const sendEmailVerification = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError("User not found", 404);
    }

    if (user.isEmailVerified) {
      throw new ApiError("Email already verified", 400);
    }

    const verificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

    const message = `Click the link below to verify your email:\n\n${verifyUrl}\n\nThis link is valid for 10 minutes.`;

    await sendEmail({
      email: user.email,
      subject: "Email Verification",
      message,
    });

    res
      .status(200)
      .json(new ApiResponse({ message: "Verification email sent" }, 200));
  } catch (error) {
    console.error("Error sending email verification:", error);
    return res
      .status(500)
      .json(new ApiResponse("Error sending email verification", 500));
  }
});

const verifyEmail = asyncHandler(async (req, res) => {
  try {
    const { token } = req.params;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      throw new ApiError("Invalid or expired token", 400);
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    res.status(200).json(new ApiResponse({ message: "Email verified successfully" }, 200));
  } catch (error) {
    console.error("Error verifying email:", error);
    return res
      .status(500)
      .json(new ApiResponse("Error verifying email", 500));
  }
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  forgotPassword,
  getCurrentUser,
  resetPassword,
  googleAuthCallback,
  updateAvatar,
  editUserProfile,
  changePassword,
  sendEmailVerification,
  verifyEmail,
};
